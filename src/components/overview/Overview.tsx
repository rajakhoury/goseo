import { useEffect, useState } from 'react';
import { BiPlay } from 'react-icons/bi';
import ErrorScreen from '../common/ErrorScreen';
import { usePageAnalysis } from '../../hooks/usePageAnalysis';
import { createLoggedError, logSystemAware } from '../../utils/logger';
import { validators } from './validators';
import { OverviewError } from './types';
import type {
  AnalysisResult,
  PageElements,
  TechnicalInfo,
  LinkTag,
  MetaTag,
  ScriptTag,
  XFNRelationship,
  TitleTag,
  WebVitalMetric,
} from './types';
import { initialAnalysisState } from './types';
import { CompactOverviewCard } from './cards/CompactOverviewCard';
import { AllMetaTagsCard } from './cards/AllMetaTagsCard';
import { AllScriptsCard } from './cards/AllScriptsCard';
import { ResourcesCard } from './cards/ResourcesCard';
import WebVitalsCard from './cards/WebVitalsCard';
import SerpPreview from './components/SerpPreview';
import SocialPreview from './components/SocialPreview';
import TwitterPreview from './components/TwitterPreview';
import MetricCard from './components/MetricCard';

const WEB_VITALS_SCRIPT = async function (
  this: Window
): Promise<Record<'CLS' | 'INP' | 'LCP' | 'FCP' | 'TTFB', WebVitalMetric>> {
  type WVMName = 'CLS' | 'INP' | 'LCP' | 'FCP' | 'TTFB';
  type WVMRating = 'good' | 'needs-improvement' | 'poor';
  type WVMetric = {
    name: WVMName;
    rating: WVMRating;
    value: number;
    delta?: number;
    id?: string;
    entries?: unknown[];
  };
  type WVAPI = {
    onCLS: (cb: (m: WVMetric) => void, opts?: unknown) => void;
    onINP: (cb: (m: WVMetric) => void, opts?: unknown) => void;
    onLCP: (cb: (m: WVMetric) => void, opts?: unknown) => void;
    onFCP: (cb: (m: WVMetric) => void, opts?: unknown) => void;
    onTTFB: (cb: (m: WVMetric) => void, opts?: unknown) => void;
  };

  const metrics: Partial<Record<WVMName, WebVitalMetric>> = {};

  const toRecord = (m: WVMetric) => {
    if (!m || !m.name) return;
    metrics[m.name] = {
      name: m.name,
      rating: m.rating,
      score: m.rating,
      value: m.value,
      delta: m.delta || 0,
      id: m.id || '',
      entries: m.entries || [],
    };
  };

  if ((window as unknown as { webVitals?: WVAPI }).webVitals) {
    const wv = (window as unknown as { webVitals?: WVAPI }).webVitals as WVAPI;
    try {
      const opts = { reportAllChanges: true } as unknown;
      wv.onCLS(toRecord, opts);
      wv.onLCP(toRecord, opts);
      wv.onFCP(toRecord, opts);
      wv.onTTFB(toRecord);
      wv.onINP(toRecord);
    } catch {
      void 0;
    }
    await new Promise((r) => setTimeout(r, 1200));
  }

  const nav = performance.getEntriesByType('navigation')[0] as
    | PerformanceNavigationTiming
    | undefined;
  if (nav && !metrics.TTFB) {
    const ttfb = nav.responseStart - nav.startTime;
    const rating = ttfb <= 800 ? 'good' : ttfb <= 1800 ? 'needs-improvement' : 'poor';
    metrics.TTFB = {
      name: 'TTFB',
      rating,
      score: rating,
      value: ttfb,
      delta: 0,
      id: nav.toJSON?.().name || 'navigation',
      entries: [nav],
    };
  }
  const fcpEntry = performance
    .getEntriesByType('paint')
    .find((e) => e.name === 'first-contentful-paint') as PerformanceEntry | undefined;
  if (fcpEntry && !metrics.FCP) {
    const value = fcpEntry.startTime;
    const rating = value <= 1800 ? 'good' : value <= 3000 ? 'needs-improvement' : 'poor';
    metrics.FCP = {
      name: 'FCP',
      rating,
      score: rating,
      value,
      delta: 0,
      id: fcpEntry.name || 'FCP',
      entries: [fcpEntry],
    };
  }

  if (!metrics.LCP) {
    const lcpEntries = performance.getEntriesByType(
      'largest-contentful-paint'
    ) as unknown as Array<{
      startTime?: number;
      renderTime?: number;
      loadTime?: number;
      id?: string;
    }>;
    if (lcpEntries && lcpEntries.length > 0) {
      const last = lcpEntries[lcpEntries.length - 1];
      const candidate = Math.max(last.renderTime ?? 0, last.loadTime ?? 0, last.startTime ?? 0);
      const value = candidate;
      const rating: WVMRating =
        value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor';
      metrics.LCP = {
        name: 'LCP',
        rating,
        score: rating,
        value,
        delta: 0,
        id: last.id || 'LCP',
        entries: lcpEntries as unknown[],
      };
    }
  }

  if (!metrics.CLS) {
    const lsEntries = performance.getEntriesByType('layout-shift') as unknown as Array<{
      value: number;
      hadRecentInput?: boolean;
    }>;
    if (lsEntries && lsEntries.length > 0) {
      let cls = 0;
      for (const e of lsEntries) {
        if (!e.hadRecentInput) cls += e.value;
      }
      const rating: WVMRating = cls <= 0.1 ? 'good' : cls <= 0.25 ? 'needs-improvement' : 'poor';
      metrics.CLS = {
        name: 'CLS',
        rating,
        score: rating,
        value: cls,
        delta: 0,
        id: 'CLS',
        entries: lsEntries as unknown[],
      };
    }
  }

  return metrics as Record<WVMName, WebVitalMetric>;
};

const ANALYSIS_SCRIPT = async function (this: Window): Promise<AnalysisResult> {
  function getElementOuterHTML(element: Element | null): string {
    return element ? element.outerHTML : '';
  }

  function getMetaTags(): PageElements['meta'] {
    const allMetas = Array.from(document.querySelectorAll('meta'));
    const metaTags = {
      standard: [] as MetaTag[],
      opengraph: [] as MetaTag[],
      twitter: [] as MetaTag[],
      other: [] as MetaTag[],
      raw: [] as string[],
    };

    const titleTag = document.querySelector('title');
    if (titleTag) {
      const raw = getElementOuterHTML(titleTag);
      const titleMetaTag: TitleTag = {
        name: 'title',
        content: titleTag.textContent || '',
        type: 'standard',
        raw,
      };
      metaTags.standard.push(titleMetaTag);
      metaTags.raw.push(raw);
    }

    allMetas.forEach((meta) => {
      const raw = getElementOuterHTML(meta);
      const tag: MetaTag = {
        name: meta.getAttribute('name') || undefined,
        property: meta.getAttribute('property') || undefined,
        charset: meta.getAttribute('charset') || undefined,
        httpEquiv: meta.getAttribute('http-equiv') || undefined,
        content: meta.getAttribute('content') || undefined,
        type: 'standard' as const,
        raw,
      };

      metaTags.raw.push(raw);

      const propertyValue = tag.property || '';
      const nameValue = tag.name || '';

      if (propertyValue.startsWith('og:')) {
        metaTags.opengraph.push({ ...tag, type: 'opengraph' as const });
      } else if (nameValue.startsWith('twitter:') || propertyValue.startsWith('twitter:')) {
        metaTags.twitter.push({ ...tag, type: 'twitter' as const });
      } else {
        metaTags.standard.push(tag);
      }
    });

    return metaTags;
  }

  function getLinks(): PageElements['link'] {
    const allLinks = Array.from(document.querySelectorAll('link'));
    const links: PageElements['link'] = {
      byType: {
        alternate: [] as LinkTag[],
        canonical: [] as LinkTag[],
        stylesheet: [] as LinkTag[],
        icon: [] as LinkTag[],
        manifest: [] as LinkTag[],
        other: [] as LinkTag[],
      },
      raw: [] as string[],
    };

    allLinks.forEach((link) => {
      const raw = getElementOuterHTML(link);
      const tag: LinkTag = {
        rel: link.getAttribute('rel') || '',
        href: link.getAttribute('href') || '',
        type: link.getAttribute('type') || undefined,
        hreflang: link.getAttribute('hreflang') || undefined,
        media: link.getAttribute('media') || undefined,
        sizes: link.getAttribute('sizes') || undefined,
        crossOrigin: link.getAttribute('crossorigin') || undefined,
        integrity: link.getAttribute('integrity') || undefined,
        raw,
      };

      links.raw.push(raw);

      switch (tag.rel) {
        case 'alternate':
          links.byType.alternate.push(tag);
          break;
        case 'canonical':
          links.byType.canonical.push(tag);
          break;
        case 'stylesheet':
          links.byType.stylesheet.push(tag);
          break;
        case 'icon':
        case 'apple-touch-icon':
        case 'shortcut icon':
          links.byType.icon.push(tag);
          break;
        case 'manifest':
          links.byType.manifest.push(tag);
          break;
        default:
          links.byType.other.push(tag);
      }
    });

    return links;
  }

  function getScripts(): PageElements['script'] {
    const allScripts = Array.from(document.querySelectorAll('script'));
    const scripts: PageElements['script'] = {
      byType: {
        async: [] as ScriptTag[],
        defer: [] as ScriptTag[],
        inline: [] as ScriptTag[],
        external: [] as ScriptTag[],
      },
      raw: [] as string[],
    };

    allScripts.forEach((script) => {
      const raw = getElementOuterHTML(script);
      const tag: ScriptTag = {
        type: script.getAttribute('type') || 'text/javascript',
        src: script.getAttribute('src') || undefined,
        async: script.hasAttribute('async'),
        defer: script.hasAttribute('defer'),
        integrity: script.getAttribute('integrity') || undefined,
        crossOrigin: script.getAttribute('crossorigin') || undefined,
        raw,
      };

      scripts.raw.push(raw);

      if (tag.src) {
        if (tag.async) scripts.byType.async.push(tag);
        else if (tag.defer) scripts.byType.defer.push(tag);
        else scripts.byType.external.push(tag);
      } else {
        scripts.byType.inline.push(tag);
      }
    });

    return scripts;
  }

  function getRelationships(): PageElements['relationships'] {
    const relationships: PageElements['relationships'] = {
      xfn: {
        identity: [] as XFNRelationship[],
        friendship: [] as XFNRelationship[],
        physical: [] as XFNRelationship[],
        professional: [] as XFNRelationship[],
        geographical: [] as XFNRelationship[],
        family: [] as XFNRelationship[],
        romantic: [] as XFNRelationship[],
      },
      seo: {
        nofollow: [] as Array<{ href: string; text: string; raw: string }>,
        noopener: [] as Array<{ href: string; text: string; raw: string }>,
        noreferrer: [] as Array<{ href: string; text: string; raw: string }>,
        ugc: [] as Array<{ href: string; text: string; raw: string }>,
        sponsored: [] as Array<{ href: string; text: string; raw: string }>,
      },
      social: {
        platforms: {
          facebook: [] as Array<{ href: string; text: string; raw: string }>,
          twitter: [] as Array<{ href: string; text: string; raw: string }>,
          linkedin: [] as Array<{ href: string; text: string; raw: string }>,
          instagram: [] as Array<{ href: string; text: string; raw: string }>,
          youtube: [] as Array<{ href: string; text: string; raw: string }>,
          pinterest: [] as Array<{ href: string; text: string; raw: string }>,
          other: [] as Array<{ platform: string; href: string; text: string; raw: string }>,
        },
        policies: [] as Array<{ type: string; href: string; text: string; raw: string }>,
      },
    };

    document.querySelectorAll('a[rel]').forEach((link) => {
      const raw = getElementOuterHTML(link);
      const rels = (link.getAttribute('rel') || '').split(' ');
      const href = link.getAttribute('href') || '';
      const text = link.textContent || '';

      const baseData: Omit<XFNRelationship, 'type' | 'category'> = {
        href,
        text,
        raw,
      };

      rels.forEach((rel) => {
        if (
          [
            'me',
            'friend',
            'acquaintance',
            'met',
            'co-worker',
            'colleague',
            'co-resident',
            'neighbor',
            'child',
            'parent',
            'sibling',
            'spouse',
            'partner',
          ].includes(rel)
        ) {
          const category =
            rel === 'me'
              ? 'identity'
              : ['friend', 'acquaintance'].includes(rel)
                ? 'friendship'
                : rel === 'met'
                  ? 'physical'
                  : ['co-worker', 'colleague'].includes(rel)
                    ? 'professional'
                    : ['co-resident', 'neighbor'].includes(rel)
                      ? 'geographical'
                      : ['child', 'parent', 'sibling'].includes(rel)
                        ? 'family'
                        : ['spouse', 'partner'].includes(rel)
                          ? 'romantic'
                          : null;

          if (category) {
            const xfnRel: XFNRelationship = {
              ...baseData,
              type: rel,
              category: 'xfn',
            };
            relationships.xfn[category].push(xfnRel);
          }
        }

        const seoRelTypes = ['nofollow', 'noopener', 'noreferrer', 'ugc', 'sponsored'] as const;
        type SeoRelType = (typeof seoRelTypes)[number];

        if (seoRelTypes.includes(rel as SeoRelType)) {
          const seoType = rel as SeoRelType;
          relationships.seo[seoType].push(baseData);
        }

        const socialMatch = href.match(/(?:https?:)?\/\/(?:www\.)?([^/]+)/);
        if (socialMatch) {
          const domain = socialMatch[1];
          if (domain.includes('facebook.com'))
            relationships.social.platforms.facebook.push(baseData);
          else if (domain.includes('twitter.com'))
            relationships.social.platforms.twitter.push(baseData);
          else if (domain.includes('linkedin.com'))
            relationships.social.platforms.linkedin.push(baseData);
          else if (domain.includes('instagram.com'))
            relationships.social.platforms.instagram.push(baseData);
          else if (domain.includes('youtube.com'))
            relationships.social.platforms.youtube.push(baseData);
          else if (domain.includes('pinterest.com'))
            relationships.social.platforms.pinterest.push(baseData);
          else relationships.social.platforms.other.push({ platform: domain, ...baseData });
        }

        if (
          href.toLowerCase().includes('privacy') ||
          href.toLowerCase().includes('cookie') ||
          href.toLowerCase().includes('terms')
        ) {
          relationships.social.policies.push({ type: 'policy', ...baseData });
        }
      });
    });

    return relationships;
  }

  function getTechnicalInfo(): TechnicalInfo {
    const doc = document.doctype;
    return {
      doctype: doc
        ? `<!DOCTYPE ${doc.name}${doc.publicId ? ` PUBLIC "${doc.publicId}"` : ''}${
            doc.systemId ? ` "${doc.systemId}"` : ''
          }>`
        : null,
      charset: document.characterSet || null,
      viewport: document.querySelector('meta[name="viewport"]')?.getAttribute('content') || null,
      language: document.documentElement.lang || null,
      compatMode: document.compatMode,
      renderingMode: document.contentType,
    };
  }

  function getPageLinks() {
    const allLinks = Array.from(document.querySelectorAll('a[href]'));
    const currentDomain = window.location.hostname;

    return allLinks.map((link) => {
      const href = link.getAttribute('href') || '';
      const title = link.getAttribute('title');
      const rel = link.getAttribute('rel');
      const target = link.getAttribute('target');

      let isInternal = false;
      try {
        if (href.startsWith('/') || href.startsWith('#') || href.startsWith('?')) {
          isInternal = true;
        } else if (href.startsWith('http')) {
          const linkUrl = new URL(href);
          isInternal = linkUrl.hostname === currentDomain;
        } else {
          isInternal = true;
        }
      } catch {
        isInternal = false;
      }

      return {
        href,
        text: link.textContent?.trim() || '',
        title: title === null ? undefined : title,
        rel: rel === null ? undefined : rel,
        target: target === null ? undefined : target,
        isInternal,
        raw: getElementOuterHTML(link),
      };
    });
  }

  const doc = this.document;

  if (!doc?.documentElement) {
    throw new OverviewError('NO_DOCUMENT_ACCESS', 'No access to document API');
  }

  try {
    const analysis: AnalysisResult = {
      pageAnalysis: {
        url: window.location.href,
        timestamp: Date.now(),
        technical: getTechnicalInfo(),
        elements: {
          meta: getMetaTags(),
          link: getLinks(),
          script: getScripts(),
          relationships: getRelationships(),
        },
        structure: {
          headings: {
            h1: Array.from(doc.querySelectorAll('h1')).map((h) => ({
              content: h.textContent || '',
              raw: getElementOuterHTML(h),
            })),
            h2: Array.from(doc.querySelectorAll('h2')).map((h) => ({
              content: h.textContent || '',
              raw: getElementOuterHTML(h),
            })),
            h3: Array.from(doc.querySelectorAll('h3')).map((h) => ({
              content: h.textContent || '',
              raw: getElementOuterHTML(h),
            })),
            h4: Array.from(doc.querySelectorAll('h4')).map((h) => ({
              content: h.textContent || '',
              raw: getElementOuterHTML(h),
            })),
            h5: Array.from(doc.querySelectorAll('h5')).map((h) => ({
              content: h.textContent || '',
              raw: getElementOuterHTML(h),
            })),
            h6: Array.from(doc.querySelectorAll('h6')).map((h) => ({
              content: h.textContent || '',
              raw: getElementOuterHTML(h),
            })),
          },
          images: Array.from(doc.querySelectorAll('img')).map((img) => {
            const alt = img.getAttribute('alt');
            const title = img.getAttribute('title');

            return {
              src: img.getAttribute('src') || '',
              alt: alt === null ? undefined : alt,
              title: title === null ? undefined : title,
              width: img.width || undefined,
              height: img.height || undefined,
              raw: getElementOuterHTML(img),
            };
          }),
          links: getPageLinks(),
        },
        resources: {
          preconnect: Array.from(doc.querySelectorAll('link[rel="preconnect"]')).map((link) => ({
            href: link.getAttribute('href') || '',
            as: link.getAttribute('as') || undefined,
            crossOrigin: link.getAttribute('crossorigin') || undefined,
            type: link.getAttribute('type') || undefined,
            fetchPriority: link.getAttribute('fetchpriority') || undefined,
            media: link.getAttribute('media') || undefined,
            raw: getElementOuterHTML(link),
          })),
          prefetch: Array.from(doc.querySelectorAll('link[rel="prefetch"]')).map((link) => ({
            href: link.getAttribute('href') || '',
            as: link.getAttribute('as') || undefined,
            crossOrigin: link.getAttribute('crossorigin') || undefined,
            type: link.getAttribute('type') || undefined,
            fetchPriority: link.getAttribute('fetchpriority') || undefined,
            media: link.getAttribute('media') || undefined,
            raw: getElementOuterHTML(link),
          })),
          preload: Array.from(doc.querySelectorAll('link[rel="preload"]')).map((link) => ({
            href: link.getAttribute('href') || '',
            as: link.getAttribute('as') || undefined,
            crossOrigin: link.getAttribute('crossorigin') || undefined,
            type: link.getAttribute('type') || undefined,
            fetchPriority: link.getAttribute('fetchpriority') || undefined,
            media: link.getAttribute('media') || undefined,
            raw: getElementOuterHTML(link),
          })),
          dnsPrefetch: Array.from(doc.querySelectorAll('link[rel="dns-prefetch"]')).map((link) => ({
            href: link.getAttribute('href') || '',
            as: link.getAttribute('as') || undefined,
            crossOrigin: link.getAttribute('crossorigin') || undefined,
            type: link.getAttribute('type') || undefined,
            fetchPriority: link.getAttribute('fetchpriority') || undefined,
            media: link.getAttribute('media') || undefined,
            raw: getElementOuterHTML(link),
          })),
          prerender: Array.from(doc.querySelectorAll('link[rel="prerender"]')).map((link) => ({
            href: link.getAttribute('href') || '',
            as: link.getAttribute('as') || undefined,
            crossOrigin: link.getAttribute('crossorigin') || undefined,
            type: link.getAttribute('type') || undefined,
            fetchPriority: link.getAttribute('fetchpriority') || undefined,
            media: link.getAttribute('media') || undefined,
            raw: getElementOuterHTML(link),
          })),
        },
        raw: {
          head: doc.head.innerHTML,
          body: doc.body.innerHTML,
        },
      },
      webVitals: undefined,
    };
    return analysis;
  } catch (error) {
    throw new OverviewError(
      'ANALYSIS_ERROR',
      `Failed to analyze page: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

function OverviewSkeleton() {
  return (
    <div className="h-full p-3 bg-gray-50 dark:bg-gray-900/20 overflow-auto space-y-4">
      <MetricCard title="Essential SEO Information" tooltip="Core SEO elements found on the page">
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="animate-pulse space-y-1">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}

          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="animate-pulse space-y-1">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" />
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
          <div className="grid md:grid-cols-3 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse p-2 bg-white dark:bg-gray-800 rounded space-y-1"
              >
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
              </div>
            ))}
          </div>
        </div>
      </MetricCard>
    </div>
  );
}

export default function Overview() {
  const [previewMode, setPreviewMode] = useState<'serp' | 'social' | 'twitter'>('serp');
  const [webVitals, setWebVitals] = useState<Record<string, WebVitalMetric> | undefined>(undefined);
  const [measuring, setMeasuring] = useState(false);
  const [showWebVitals, setShowWebVitals] = useState(false);

  const { state, analyzeCurrentPage } = usePageAnalysis<AnalysisResult, OverviewError>({
    initialState: initialAnalysisState,
    errorType: 'runtime',
    createError: (message: unknown) =>
      createLoggedError(
        'Overview Analysis',
        message,
        (msg) => new OverviewError('OVERVIEW_ANALYSIS_ERROR', msg)
      ),
    executeScript: async (tabId) => {
      try {
        const tab = await chrome.tabs.get(tabId);
        if (!tab?.url?.startsWith('http')) {
          throw new OverviewError('EXECUTION_ERROR', 'Can only analyze regular webpages');
        }

        const result = await chrome.scripting.executeScript({
          target: { tabId, allFrames: true },
          world: 'ISOLATED',
          func: ANALYSIS_SCRIPT,
        });

        if (!result?.[0]?.result) {
          throw new OverviewError('EXECUTION_ERROR', 'Invalid analysis result');
        }

        const validationResult = validators.analysisResult.validate(result[0].result);
        if (!validationResult.success) {
          const violations: { field: string; message: string }[] =
            validationResult.error?.violations || [];
          const errorDetails = violations
            .map((violation) => `${violation.field}: ${violation.message}`)
            .join(', ');
          throw new OverviewError('VALIDATION_ERROR', `Invalid data: ${errorDetails}`);
        }

        return validationResult.data;
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        logSystemAware('Overview Analysis', `Analysis failed: ${msg}`);

        if (error instanceof OverviewError) {
          throw error;
        }

        throw new OverviewError(
          'OVERVIEW_ANALYSIS_ERROR',
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    },
  });

  useEffect(() => {
    let mounted = true;
    if (mounted && state.status === 'idle') {
      analyzeCurrentPage();
    }
    return () => {
      mounted = false;
    };
  }, [analyzeCurrentPage, state.status]);

  if (state.error) {
    return (
      <ErrorScreen
        title="Page Analysis Failed"
        message={state.error.message}
        onRetry={analyzeCurrentPage}
      />
    );
  }

  if (state.status === 'loading') {
    return <OverviewSkeleton />;
  }

  if (!state.result?.pageAnalysis) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-brand-400">
        <p className="text-sm">No page data available</p>
      </div>
    );
  }

  const title =
    state.result.pageAnalysis.elements.meta.standard.find((m) => m.name === 'title')?.content || '';
  const description =
    state.result.pageAnalysis.elements.meta.standard.find((m) => m.name === 'description')
      ?.content || '';

  async function runWebVitals() {
    if (measuring) return;
    setShowWebVitals(true);
    setWebVitals(undefined);
    setMeasuring(true);
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const tabId = tabs[0]?.id;
      if (!tabId) return;
      await chrome.scripting.executeScript({
        target: { tabId, allFrames: true },
        world: 'ISOLATED',
        files: ['vendor/web-vitals.attribution.iife.js'],
      });
      const res = await chrome.scripting.executeScript({
        target: { tabId, allFrames: true },
        world: 'ISOLATED',
        func: WEB_VITALS_SCRIPT,
      });
      const vitals = res?.[0]?.result as Record<string, WebVitalMetric> | undefined;
      if (vitals) {
        setWebVitals(vitals);
      }
    } finally {
      setMeasuring(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="h-full p-3 bg-gray-50 dark:bg-gray-900/20 overflow-auto space-y-3">
        {previewMode === 'serp' &&
          (showWebVitals ? (
            <WebVitalsCard
              data={{ ...state.result, webVitals: webVitals ?? state.result.webVitals }}
            />
          ) : (
            <SerpPreview
              title={title}
              description={description}
              url={state.result.pageAnalysis.url}
              mode={previewMode}
              onChange={setPreviewMode}
              actions={
                <button
                  className="inline-flex items-center text-[11px] px-1.5 py-0.5 rounded border bg-gray-50 text-gray-600 border-gray-100 dark:text-gray-400 dark:bg-gray-800/60 dark:border-gray-700 disabled:opacity-50"
                  onClick={runWebVitals}
                  disabled={measuring}
                  aria-label="Run Web Vitals"
                >
                  {measuring ? (
                    'Measuring…'
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      <BiPlay className="w-3.5 h-3.5" />
                      <span>Web Vitals</span>
                    </span>
                  )}
                </button>
              }
            />
          ))}

        {previewMode === 'social' && (
          <SocialPreview
            elements={state.result.pageAnalysis.elements}
            mode={previewMode}
            onChange={setPreviewMode}
          />
        )}

        {previewMode === 'twitter' && (
          <TwitterPreview
            elements={state.result.pageAnalysis.elements}
            mode={previewMode}
            onChange={setPreviewMode}
          />
        )}

        <CompactOverviewCard data={state.result} />
        <AllMetaTagsCard data={state.result} />
        <AllScriptsCard data={state.result} />
        <ResourcesCard data={state.result} />
      </div>
    </div>
  );
}
