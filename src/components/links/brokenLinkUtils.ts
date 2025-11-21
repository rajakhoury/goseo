import { LinkData, AnalysisResult } from './types';
import { logger } from '../../utils/logger';
import { z } from 'zod';

const LINK_CHECK_TIMEOUT_MS = 5000;
const BROKEN_LINK_CACHE_TTL_MS = 30 * 60 * 1000;
const CACHE_KEY = 'brokenLinkCache_v1';
const LINK_CHECK_MAX_RETRIES = 2;
const LINK_CHECK_INITIAL_RETRY_DELAY_MS = 500;
const LINK_CHECK_BACKOFF_FACTOR = 2;
const LINK_CHECK_MAX_RETRY_DELAY_MS = 5000;
const BROKEN_LINK_CACHE_MAX_ENTRIES = 1000;
const BROKEN_LINK_CONCURRENCY = 5;

interface CacheEntry {
  isBroken: boolean;
  timestamp: number;
}

interface LinkCache {
  [url: string]: CacheEntry;
}

function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    urlObj.searchParams.sort();
    return urlObj.toString();
  } catch {
    return url;
  }
}

function delay(ms: number, externalSignal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(resolve, ms);
    if (externalSignal) {
      const onAbort = () => {
        clearTimeout(timeoutId);
        const err = new Error('Aborted');
        err.name = 'AbortError';
        reject(err);
      };
      externalSignal.addEventListener('abort', onAbort, { once: true });
    }
  });
}

const CacheEntrySchema = z.object({
  isBroken: z.boolean(),
  timestamp: z.number(),
});

const LinkCacheSchema = z.record(z.string(), CacheEntrySchema);

async function getCache(): Promise<LinkCache> {
  try {
    const result = await chrome.storage.local.get(CACHE_KEY);
    const raw = (result[CACHE_KEY] || {}) as unknown;
    const parsed = LinkCacheSchema.safeParse(raw);
    if (parsed.success) {
      const now = Date.now();
      const pruned = Object.entries(parsed.data as LinkCache).reduce((acc, [url, entry]) => {
        if (now - entry.timestamp <= BROKEN_LINK_CACHE_TTL_MS) {
          acc[url] = entry;
        }
        return acc;
      }, {} as LinkCache);
      const entries = Object.entries(pruned).sort((a, b) => b[1].timestamp - a[1].timestamp);
      const limited: LinkCache = {};
      for (const [url, entry] of entries.slice(0, BROKEN_LINK_CACHE_MAX_ENTRIES)) {
        limited[url] = entry;
      }
      await chrome.storage.local.set({ [CACHE_KEY]: limited });
      return limited;
    }
    logger.log('Link Cache', 'Invalid cache format', 'info');
    return {} as LinkCache;
  } catch (error) {
    logger.log('Link Cache', 'Failed to load cache: ' + error, 'info');
    return {} as LinkCache;
  }
}

async function saveCache(cache: LinkCache): Promise<void> {
  try {
    const now = Date.now();
    const cleanCache = Object.entries(cache).reduce((acc, [url, entry]) => {
      if (now - entry.timestamp <= BROKEN_LINK_CACHE_TTL_MS) {
        acc[url] = entry;
      }
      return acc;
    }, {} as LinkCache);

    const entries = Object.entries(cleanCache).sort((a, b) => b[1].timestamp - a[1].timestamp);
    const limited: LinkCache = {};
    for (const [url, entry] of entries.slice(0, BROKEN_LINK_CACHE_MAX_ENTRIES)) {
      limited[url] = entry;
    }
    await chrome.storage.local.set({ [CACHE_KEY]: limited });
  } catch (error) {
    logger.log('Link Cache', 'Failed to save cache: ' + error, 'info');
  }
}

async function checkSingleLink(link: LinkData, externalSignal?: AbortSignal): Promise<boolean> {
  if (!link?.href?.trim()) {
    return false;
  }

  if (
    link.type === 'anchor' ||
    link.type === 'communication' ||
    link.type === 'javascript' ||
    link.type === 'data' ||
    link.type === 'blob' ||
    link.type === 'file' ||
    link.type === 'unknown'
  ) {
    return false;
  }

  try {
    const normalizedUrl = normalizeUrl(link.href);

    const cache = await getCache();
    const cachedResult = cache[normalizedUrl];
    if (cachedResult && Date.now() - cachedResult.timestamp <= BROKEN_LINK_CACHE_TTL_MS) {
      return cachedResult.isBroken;
    }

    let attempt = 0;
    let delayMs = LINK_CHECK_INITIAL_RETRY_DELAY_MS;
    while (attempt <= LINK_CHECK_MAX_RETRIES) {
      if (externalSignal?.aborted) {
        return false;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), LINK_CHECK_TIMEOUT_MS);
      let onAbort: (() => void) | null = null;
      if (externalSignal) {
        if (externalSignal.aborted) {
          clearTimeout(timeoutId);
          return false;
        }
        onAbort = () => controller.abort();
        externalSignal.addEventListener('abort', onAbort);
      }

      try {
        const response = await fetch(link.href, {
          method: 'GET',
          signal: controller.signal,
          credentials: 'omit',
        });

        clearTimeout(timeoutId);

        if (response.status === 429 && attempt < LINK_CHECK_MAX_RETRIES) {
          const retryAfterHeader = response.headers.get('Retry-After');
          let headerDelay = NaN;
          if (retryAfterHeader) {
            const numeric = Number(retryAfterHeader);
            if (!Number.isNaN(numeric) && isFinite(numeric)) {
              headerDelay = numeric * 1000;
            } else {
              const dateMs = Date.parse(retryAfterHeader);
              if (!Number.isNaN(dateMs)) {
                const diff = dateMs - Date.now();
                if (diff > 0) {
                  headerDelay = diff;
                }
              }
            }
          }
          const nextDelay = Math.min(
            Number.isNaN(headerDelay) ? delayMs : headerDelay,
            LINK_CHECK_MAX_RETRY_DELAY_MS
          );
          try {
            await delay(nextDelay, externalSignal);
          } catch (e) {
            if (e instanceof Error && e.name === 'AbortError') {
              if (onAbort) {
                externalSignal?.removeEventListener('abort', onAbort);
              }
              return false;
            }
          }
          delayMs = Math.min(delayMs * LINK_CHECK_BACKOFF_FACTOR, LINK_CHECK_MAX_RETRY_DELAY_MS);
          attempt++;
          if (onAbort) {
            externalSignal?.removeEventListener('abort', onAbort);
          }
          continue;
        }

        const isBroken = !response.ok && response.status !== 429;
        cache[normalizedUrl] = {
          isBroken,
          timestamp: Date.now(),
        };
        await saveCache(cache);

        if (onAbort) {
          externalSignal?.removeEventListener('abort', onAbort);
        }
        return isBroken;
      } catch (error) {
        clearTimeout(timeoutId);
        if (onAbort) {
          externalSignal?.removeEventListener('abort', onAbort);
        }
        if (error instanceof Error && error.name === 'AbortError') {
          logger.log('Link Check', `Timeout checking link ${link.href}`, 'info');
        } else {
          logger.log(
            'Link Check',
            `Cannot verify ${link.href}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            'info'
          );
        }
        return false;
      }
    }

    cache[normalizedUrl] = {
      isBroken: false,
      timestamp: Date.now(),
    };
    await saveCache(cache);
    return false;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        logger.log('Link Check', `Timeout checking link ${link.href}`, 'info');
      } else {
        logger.log('Link Check', `Error checking link ${link.href}: ${error.message}`, 'info');
      }
    } else {
      logger.log('Link Check', `Unknown error checking link ${link.href}`, 'info');
    }
    return true;
  }
}

export async function checkBrokenLinks(
  links: LinkData[],
  signal?: AbortSignal
): Promise<LinkData[]> {
  if (!Array.isArray(links)) {
    logger.log('Link Check', 'Invalid links array provided', 'warn');
    return [];
  }

  const updatedLinks = [...links];
  const resultCache = new Map<string, boolean>();

  try {
    for (let i = 0; i < links.length; i += BROKEN_LINK_CONCURRENCY) {
      if (signal?.aborted) {
        break;
      }
      const batch = links.slice(i, i + BROKEN_LINK_CONCURRENCY);
      const batchPromises = batch.map(async (link, batchIndex) => {
        try {
          if (signal?.aborted) {
            return;
          }
          const key = normalizeUrl(link.href || '');
          let isBroken: boolean;
          if (resultCache.has(key)) {
            isBroken = resultCache.get(key)!;
          } else {
            isBroken = await checkSingleLink(link, signal);
            resultCache.set(key, isBroken);
          }
          updatedLinks[i + batchIndex] = {
            ...link,
            broken: isBroken,
          };
        } catch (error) {
          logger.log(
            'Link Check',
            `Failed to process link ${link.href}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            'info'
          );
          updatedLinks[i + batchIndex] = {
            ...link,
            broken: true,
          };
        }
      });

      await Promise.allSettled(batchPromises);
    }

    return updatedLinks;
  } catch (error) {
    logger.log(
      'Link Check',
      `Failed to check broken links: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'warn'
    );
    return links.map((link) => ({ ...link, broken: false }));
  }
}

export function updateBrokenMetrics(
  links: LinkData[],
  metrics: AnalysisResult['metrics']
): AnalysisResult['metrics'] {
  if (!Array.isArray(links) || !metrics) {
    logger.log('Link Check', 'Invalid input for metrics update', 'warn');
    return metrics || {};
  }

  try {
    return {
      ...metrics,
      broken: links.filter((link) => Boolean(link?.broken)).length,
    };
  } catch (error) {
    logger.log(
      'Link Check',
      `Failed to update metrics: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'warn'
    );
    return metrics;
  }
}
