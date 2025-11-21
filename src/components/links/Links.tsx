import { useEffect, useState, useRef } from 'react';
import {
  LinksError,
  AnalysisResult,
  FilterOptions,
  initialAnalysisState,
  LinkType,
  LinkData,
} from './types';
import ErrorScreen from '../common/ErrorScreen';
import QuickMetrics from './QuickMetrics';
import LinkToolbar from './LinkToolbar';
import LinkList from './LinkList';
import { usePageAnalysis } from '../../hooks/usePageAnalysis';
import { logger, createLoggedError } from '../../utils/logger';
import { exportToCSV } from './exportUtils';
import { AnalysisResultValidator } from './types';
import { checkBrokenLinks, updateBrokenMetrics } from './brokenLinkUtils';

function analyzeLinks(): AnalysisResult {
  if (!document?.documentElement || typeof document.querySelectorAll !== 'function') {
    throw new Error('No access to document API');
  }

  function getDomPath(element: Element | null): string {
    if (!element || !(element instanceof Element)) {
      return '';
    }

    try {
      const path: string[] = [];
      let currentElement: Element | null = element;

      while (currentElement && currentElement.nodeType === Node.ELEMENT_NODE) {
        const nodeName = currentElement.nodeName?.toLowerCase() || '';
        if (!nodeName) {
          break;
        }

        let selector = nodeName;
        if (currentElement.id) {
          selector += `#${currentElement.id}`;
          path.unshift(selector);
          break;
        } else {
          let sibling = currentElement.previousElementSibling;
          let siblingCount = 1;

          while (sibling) {
            if (sibling.nodeName?.toLowerCase() === selector) {
              siblingCount++;
            }
            sibling = sibling.previousElementSibling;
          }

          if (siblingCount > 1) {
            selector += `:nth-of-type(${siblingCount})`;
          }
        }
        path.unshift(selector);
        currentElement = currentElement.parentElement;
      }

      return path.join(' > ');
    } catch {
      return '';
    }
  }

  function generateLinkId(element: Element | null, index: number): string {
    if (!element) {
      return `link-${index}`;
    }

    try {
      const base =
        typeof window !== 'undefined' && typeof window.crypto?.randomUUID === 'function'
          ? window.crypto.randomUUID()
          : `${Date.now().toString(36)}-${index}-${Math.random().toString(36).slice(2)}`;

      let candidate = `link-${base}`;
      let attempts = 0;
      while (document.getElementById(candidate) && attempts < 3) {
        const extra = Math.random().toString(36).slice(2, 8);
        candidate = `link-${base}-${extra}`;
        attempts++;
      }

      return candidate;
    } catch {
      return `link-${index}-${Math.random().toString(36).slice(2, 8)}`;
    }
  }

  try {
    const linkElements = document.querySelectorAll('a');
    const baseUrl = window.location.origin;

    const validLinks = Array.from(linkElements)
      .map((element, index): LinkData | null => {
        try {
          const isHtmlAnchor = element instanceof HTMLAnchorElement;
          const hrefAttr = element.getAttribute('href') || element.getAttribute('xlink:href');
          if (!isHtmlAnchor && !hrefAttr) {
            return null;
          }

          const href = isHtmlAnchor ? element.href || '' : hrefAttr || '';
          const text = (element.textContent || '').trim();
          const title = isHtmlAnchor
            ? element.title || null
            : (element as Element).getAttribute('title') || null;
          const rel = isHtmlAnchor
            ? element.rel
              ? element.rel
                  .split(/\s+/)
                  .map((v) => v.trim())
                  .filter(Boolean)
              : []
            : [];
          const target = isHtmlAnchor
            ? element.target || null
            : (element as Element).getAttribute('target') || null;

          let type: LinkType = 'standard';
          if (!href?.trim()) {
            type = 'unknown';
          } else if (href.startsWith('#')) {
            type = 'anchor';
          } else if (href.match(/^(mailto:|tel:|sms:)/i)) {
            type = 'communication';
          } else if (href.startsWith('javascript:')) {
            type = 'javascript';
          } else if (href.startsWith('data:')) {
            type = 'data';
          } else if (href.startsWith('blob:')) {
            type = 'blob';
          } else if (href.startsWith('file:')) {
            type = 'file';
          } else if (href.startsWith('ftp:')) {
            type = 'ftp';
          }

          const domId = element.id || generateLinkId(element, index);
          if (!element.id) {
            element.id = domId;
          }
          const domPosition = {
            index,
            path: getDomPath(element),
            id: domId,
          };

          const attributes: Record<string, string> = {};
          if (element.attributes) {
            for (let i = 0; i < element.attributes.length; i++) {
              const attr = element.attributes[i];
              if (attr && !['href', 'text', 'title', 'rel', 'target'].includes(attr.name)) {
                attributes[attr.name] = attr.value || '';
              }
            }
          }

          return {
            href,
            text,
            title,
            rel,
            target,
            isInternal: href?.startsWith(baseUrl) || href?.startsWith('/') || false,
            isNoFollow: rel.includes('nofollow'),
            isDoFollow: !rel.includes('nofollow'),
            isNoOpener: rel.includes('noopener'),
            isNoReferrer: rel.includes('noreferrer'),
            type,
            broken: false,
            domPosition,
            attributes,
          };
        } catch (error) {
          logger.log(
            'Links Analysis',
            'Failed to process link: ' + (error as Error).message,
            'warn'
          );
          return null;
        }
      })
      .filter((link): link is LinkData => link !== null);

    const metrics = {
      total: validLinks.length,
      unique: new Set(validLinks.map((l) => l.href)).size,
      internal: validLinks.filter((l) => l.isInternal).length,
      external: validLinks.filter((l) => !l.isInternal).length,
      noFollow: validLinks.filter((l) => l.isNoFollow).length,
      doFollow: validLinks.filter((l) => l.isDoFollow).length,
      noOpener: validLinks.filter((l) => l.isNoOpener).length,
      noReferrer: validLinks.filter((l) => l.isNoReferrer).length,
      communication: validLinks.filter((l) => l.type === 'communication').length,
      missingTitles: validLinks.filter((l) => !l.title).length,
      broken: 0,
    };

    return { links: validLinks, metrics };
  } catch (error) {
    throw new Error(
      'Failed to analyze links: ' + (error instanceof Error ? error.message : String(error))
    );
  }
}

export default function Links() {
  const [filters, setFilters] = useState<FilterOptions>({
    internal: false,
    external: false,
    missingTitle: false,
    broken: false,
    communication: false,
    nofollow: false,
  });

  const [brokenLinkData, setBrokenLinkData] = useState<{
    links: LinkData[];
    metrics: AnalysisResult['metrics'];
  } | null>(null);
  const [isBrokenLinksLoading, setIsBrokenLinksLoading] = useState(false);
  const checkedLinksRef = useRef<string | null>(null);

  const validator = new AnalysisResultValidator();

  const { state, analyzeCurrentPage } = usePageAnalysis<AnalysisResult, LinksError>({
    initialState: initialAnalysisState,
    errorType: 'runtime',
    createError: (message) =>
      createLoggedError(
        'Links Analysis',
        message,
        (msg) => new LinksError('LINK_ANALYSIS_ERROR', msg)
      ),
    executeScript: async (tabId) => {
      try {
        const result = await chrome.scripting.executeScript({
          target: { tabId },
          func: analyzeLinks,
          world: 'ISOLATED',
        });

        if (!result?.[0]?.result) {
          throw new LinksError('EXECUTION_ERROR', 'No result returned from content script');
        }

        const validationResult = validator.validate(result[0].result);
        if (!validationResult.success) {
          const errorMessage =
            validationResult.error?.violations?.map((v) => `${v.field}: ${v.message}`).join(', ') ||
            'Unknown validation error';

          throw new LinksError(
            'VALIDATION_ERROR',
            'Invalid data received from content script: ' + errorMessage
          );
        }

        return validationResult.data as AnalysisResult;
      } catch (error) {
        if (error instanceof LinksError) {
          throw error;
        }
        throw new LinksError(
          'LINK_ANALYSIS_ERROR',
          'Failed to analyze links: ' + (error as Error).message
        );
      }
    },
  });

  useEffect(() => {
    if (state.status === 'idle') {
      analyzeCurrentPage();
    }
  }, [analyzeCurrentPage, state.status]);

  useEffect(() => {
    const links = state.result?.links || [];
    if (state.status !== 'success' || links.length === 0) {
      return;
    }

    const hrefSignature = JSON.stringify(links.map((l) => l.href));
    if (checkedLinksRef.current === hrefSignature) {
      return;
    }
    checkedLinksRef.current = hrefSignature;

    const abortController = new AbortController();

    const checkLinks = async () => {
      if (abortController.signal.aborted) return;

      setIsBrokenLinksLoading(true);
      try {
        const linksWithBrokenStatus = await checkBrokenLinks(links, abortController.signal);

        if (abortController.signal.aborted) return;

        const updatedMetrics = updateBrokenMetrics(linksWithBrokenStatus, state.result!.metrics);
        setBrokenLinkData({ links: linksWithBrokenStatus, metrics: updatedMetrics });
      } catch (error) {
        logger.log(
          'Links Analysis',
          `Failed to check broken links: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'warn'
        );
      } finally {
        if (!abortController.signal.aborted) {
          setIsBrokenLinksLoading(false);
        }
      }
    };

    checkLinks();

    return () => {
      abortController.abort();
    };
  }, [state.status, state.result?.links?.length]);

  const displayData = brokenLinkData || state.result || initialAnalysisState.result;

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  const handleCopy = () => {
    if (!state.result?.links) return;

    const links = Array.from(
      new Set(
        state.result.links
          .filter(
            (link) =>
              link.type === 'standard' &&
              link.href &&
              !link.href.startsWith('javascript:') &&
              !link.href.startsWith('#')
          )
          .map((link) => link.href)
      )
    ).join('\n');

    navigator.clipboard
      .writeText(links)
      .then(() => logger.log('Links', 'Copied unique links to clipboard', 'info'))
      .catch((error) => logger.log('Links', 'Failed to copy links: ' + error.message, 'info'));
  };

  const handleExport = () => {
    if (!state.result?.links) return;
    exportToCSV(state.result.links);
  };

  if (state.error) {
    return (
      <ErrorScreen
        title="Links Analysis Failed"
        message={state.error.message}
        onRetry={analyzeCurrentPage}
      />
    );
  }

  if (!state.result?.links.length && state.status !== 'loading') {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-brand-400">
        <p className="text-sm">No links found on this page</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <QuickMetrics
        metrics={displayData.metrics}
        isLoading={state.status === 'loading'}
        isBrokenLinksLoading={isBrokenLinksLoading}
      />
      <LinkToolbar
        loading={state.status === 'loading'}
        filters={filters}
        onFilterChange={handleFilterChange}
        onCopy={handleCopy}
        onExport={handleExport}
        links={state.result?.links}
        showBrokenFilter={!isBrokenLinksLoading && (displayData.metrics?.broken || 0) > 0}
      />
      <div className="flex-1 min-h-0 overflow-auto">
        <LinkList
          links={displayData.links}
          filters={filters}
          metrics={displayData.metrics}
          loading={state.status === 'loading'}
        />
      </div>
    </div>
  );
}
