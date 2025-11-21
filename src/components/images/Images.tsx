import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  AnalysisState,
  FilterOptions,
  SortField,
  SortDirection,
  ImagesError,
  AnalysisResult,
  AnalysisResultValidator,
  hasDimensions,
} from './types';
import QuickMetrics from './QuickMetrics';
import ImageList from './ImageList';
import ImageToolbar from './ImageToolbar';
import ErrorScreen from '../common/ErrorScreen';
import { exportToCSV, downloadImagesAsZip, getImageFormat } from './exportUtils';
import { usePageAnalysis } from '../../hooks/usePageAnalysis';
import { logger, createLoggedError, logSystemAware } from '../../utils/logger';
import { ValidationResult } from '../../types/validation';

const initialState: AnalysisState = {
  status: 'idle',
  error: null,
  result: null,
};

function isValidationSuccess<T>(
  result: ValidationResult<T>
): result is ValidationResult<T> & { success: true; data: T } {
  return result.success && result.data !== undefined;
}

const analyzeImages = (): AnalysisResult => {
  try {
    if (!document?.documentElement || typeof document.querySelectorAll !== 'function') {
      throw new ImagesError('NO_DOCUMENT_ACCESS', 'No access to document API');
    }

    const canonicalize = (format: string | null): string | null => {
      if (!format) return null;
      const f = format.toLowerCase();
      const MAP: Record<string, string | undefined> = {
        avif: undefined,
        jxl: undefined,
        webp: undefined,
        webp2: 'webp',
        heif: undefined,
        heic: 'heif',
        jpeg: undefined,
        jpg: 'jpeg',
        jfif: 'jpeg',
        pjpeg: 'jpeg',
        pjp: 'jpeg',
        png: undefined,
        gif: undefined,
        svg: undefined,
        'svg+xml': 'svg',
        svgz: 'svg',
        bmp: undefined,
        ico: undefined,
        cur: 'ico',
        'x-icon': 'ico',
        'vnd.microsoft.icon': 'ico',
        apng: 'png',
        jxr: undefined,
        hdp: 'jxr',
        wdp: 'jxr',
        tiff: undefined,
        tif: 'tiff',
        jpeg2000: undefined,
        jp2: 'jpeg2000',
        j2k: 'jpeg2000',
        jpf: 'jpeg2000',
        jpx: 'jpeg2000',
        j2c: 'jpeg2000',
        jpc: 'jpeg2000',
      };
      const canonical = MAP[f];
      return canonical === undefined ? f : (canonical ?? f);
    };

    const isVector = (fmt: string | null): boolean => {
      const f = fmt ? canonicalize(fmt) : null;
      return f === 'svg' || f === 'ico';
    };

    const nextGen = new Set(['avif', 'jxl', 'webp', 'heif', 'heic']);

    const images = Array.from(document.querySelectorAll('img')).map((img, index) => {
      try {
        const isLazyLoaded = (imgEl: HTMLImageElement): boolean => {
          try {
            const loadingAttr = (imgEl.loading || '').toLowerCase();
            if (loadingAttr === 'lazy') return true;
            if (loadingAttr === 'eager') return false;
            const lazyAttrs = [
              'data-lazy-src',
              'data-src',
              'data-original',
              'data-lazy',
              'data-lazyloaded',
              'data-wpfc-original-src',
              'data-srcset',
            ];
            if (lazyAttrs.some((attr) => imgEl.hasAttribute(attr))) return true;
            const lazyClasses = [
              'lazyload',
              'lazy',
              'lozad',
              'litespeed-lazy',
              'wpfc-lazy-loading',
              'perfmatters-lazy',
              'jetpack-lazy-image',
              'b-lazy',
            ];
            if (lazyClasses.some((cls) => imgEl.classList.contains(cls))) return true;
            const placeholderPatterns = [
              /^data:image\/svg\+xml/i,
              /^data:image\/gif;base64,R0lGOD/i,
              /placeholder\.(?:jpg|png|gif|webp)$/i,
              /lazy-placeholder/i,
              /^about:blank$/i,
            ];
            if (placeholderPatterns.some((p) => p.test(imgEl.src))) return true;
          } catch (e) {
            logger.log('Images Analysis', 'Lazy load detection failed', 'warn', e);
          }
          return false;
        };
        const src = img.currentSrc || img.src || '';
        let format: string | null = null;

        if (src.startsWith('data:')) {
          const matches = src.match(/^data:image\/([a-zA-Z0-9+.-]+)/);
          format = matches?.[1]?.toLowerCase() || null;
        } else {
          const cleanUrl = src.split(/[?#]/)[0];
          format = cleanUrl.split('.').pop()?.toLowerCase() || null;
        }

        format = canonicalize(format);

        if (format && format.length > 10) {
          format = null;
        }

        const isNextGen = format ? nextGen.has(format) : false;
        const isLazy = isLazyLoaded(img);

        const picture = img.closest('picture');
        const sources: string[] = [];
        if (picture) {
          const sourceEls = Array.from(picture.querySelectorAll('source'));
          for (const s of sourceEls) {
            const typeAttr = s.getAttribute('type') || '';
            if (typeAttr.startsWith('image/')) {
              const t = typeAttr.replace(/^image\//, '').toLowerCase();
              const c = canonicalize(t);
              if (c) sources.push(c);
            } else {
              const srcset = s.getAttribute('srcset') || '';
              const first = srcset.split(',')[0]?.trim() || '';
              const clean = first.split(/[?#]/)[0];
              const ext = clean.split('.').pop()?.toLowerCase() || '';
              if (ext) {
                const c = canonicalize(ext);
                if (c) sources.push(c);
              }
            }
          }
        }

        const caption =
          img.closest('figure')?.querySelector('figcaption')?.textContent?.trim() || null;
        const loadingAttr = img.getAttribute('loading');

        return {
          src: img.src || '',
          alt: img.alt || null,
          title: img.title || null,
          width: img.naturalWidth > 0 ? img.naturalWidth : img.width || null,
          height: img.naturalHeight > 0 ? img.naturalHeight : img.height || null,
          fileSize: null,
          hasAlt: img.hasAttribute('alt'),
          hasAltContent: !!img.alt,
          hasTitle: !!img.title,
          format: format,
          isNextGen,
          caption,
          loading: loadingAttr || null,
          sources: sources.length ? Array.from(new Set(sources)) : undefined,
          isLazy,
          position: index,
        };
      } catch (error) {
        logger.log(
          'Image Analysis',
          `Failed to analyze image: ${error instanceof Error ? error.message : String(error)}`,
          'warn'
        );
        return {
          src: img.src || '',
          alt: null,
          title: null,
          width: null,
          height: null,
          fileSize: null,
          hasAlt: false,
          hasAltContent: false,
          hasTitle: false,
          format: null,
          isNextGen: false,
          caption: null,
          loading: null,
          isLazy: false,
          position: index,
        };
      }
    });

    const totalCount = images.length;
    const missingAltCount = images.filter((img) => !img.hasAltContent).length;
    const optimizedCount = images.filter((img) => img.isNextGen).length;
    const needsOptimizationCount = images.filter(
      (img) => !img.isNextGen && !isVector(img.format)
    ).length;
    const missingDimensionsCount = images.filter(
      (img) =>
        !isVector(img.format) && (!(img.width && img.width > 0) || !(img.height && img.height > 0))
    ).length;
    const lazyCandidatesCount = images.filter((img) => !img.isLazy).length;

    return {
      metrics: {
        totalCount,
        missingAltCount,
        missingTitleCount: 0,
        totalFileSize: 0,
        averageFileSize: 0,
        needsOptimizationCount,
        optimizedCount,
        missingDimensionsCount,
        lazyCandidatesCount,
      },
      images,
    };
  } catch (error) {
    if (error instanceof ImagesError) {
      throw error;
    }
    throw new ImagesError(
      'ANALYSIS_ERROR',
      'Failed to analyze images: ' + (error instanceof Error ? error.message : String(error))
    );
  }
};

const Images: React.FC = () => {
  const [filters, setFilters] = useState<FilterOptions>({
    showMissingAlt: false,
    showNeedsOptimization: false,
    showOversized: false,
    showMissingDimensions: false,
    showLazyCandidates: false,
  });

  const [sort, setSort] = useState<{ field: SortField; direction: SortDirection }>({
    field: 'appearance',
    direction: 'asc',
  });

  const listRef = useRef<HTMLDivElement>(null);

  const validator = new AnalysisResultValidator();

  const abortControllersRef = useRef<AbortController[]>([]);
  const timeoutsRef = useRef<number[]>([]);

  const { state, analyzeCurrentPage } = usePageAnalysis<AnalysisResult, ImagesError>({
    initialState,
    errorType: 'IMAGES_ERROR',
    createError: (message) =>
      createLoggedError('Images Analysis', message, (msg) => new ImagesError('UNKNOWN_ERROR', msg)),
    executeScript: async (tabId) => {
      try {
        const activeTab = await chrome.tabs.get(tabId);
        const results = await chrome.scripting.executeScript({
          target: { tabId },
          world: 'ISOLATED',
          func: analyzeImages,
        });

        if (!results?.[0]?.result) {
          throw new ImagesError('EXECUTION_ERROR', 'Failed to analyze images');
        }

        const result = results[0].result;

        const validationResult = validator.validate(result);
        if (!isValidationSuccess(validationResult)) {
          const errorMessage =
            validationResult.error?.violations?.map((v) => `${v.field}: ${v.message}`).join(', ') ||
            'Unknown validation error';

          throw new ImagesError(
            'VALIDATION_ERROR',
            'Invalid data received from content script: ' + errorMessage
          );
        }

        const validatedData = validationResult.data;

        const FETCH_TIMEOUT = 5000;
        const fetchWithTimeout = async (
          url: string,
          options?: RequestInit,
          timeout?: number
        ): Promise<Response> => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeout ?? FETCH_TIMEOUT);
          abortControllersRef.current.push(controller);
          timeoutsRef.current.push(Number(timeoutId));

          try {
            const response = await fetch(url, { signal: controller.signal, ...(options || {}) });
            clearTimeout(timeoutId);
            {
              const i = timeoutsRef.current.indexOf(Number(timeoutId));
              if (i !== -1) timeoutsRef.current.splice(i, 1);
            }
            {
              const j = abortControllersRef.current.indexOf(controller);
              if (j !== -1) abortControllersRef.current.splice(j, 1);
            }
            return response;
          } catch (error) {
            clearTimeout(timeoutId);
            {
              const i = timeoutsRef.current.indexOf(Number(timeoutId));
              if (i !== -1) timeoutsRef.current.splice(i, 1);
            }
            {
              const j = abortControllersRef.current.indexOf(controller);
              if (j !== -1) abortControllersRef.current.splice(j, 1);
            }
            throw error;
          }
        };

        const isSameOrigin = (url: string, origin: string): boolean => {
          try {
            const u = new URL(url);
            return Boolean(origin) && u.origin === origin;
          } catch {
            return false;
          }
        };
        const pageOrigin = (() => {
          try {
            return activeTab?.url ? new URL(activeTab.url).origin : '';
          } catch {
            return '';
          }
        })();
        const HEAD_TIMEOUT_CROSS = 2500;
        const CONCURRENCY_LIMIT = 10;
        const sizeCache = new Map<string, { size: number | null; format: string | null }>();
        const sizeInFlight = new Map<
          string,
          Promise<{ size: number | null; format: string | null }>
        >();
        const NEXT_GEN = new Set(['avif', 'jxl', 'webp', 'heif', 'heic']);

        const computeImageSize = async (
          url: string
        ): Promise<{ size: number | null; format: string | null }> => {
          try {
            const urlOrigin = (() => {
              try {
                return new URL(url).origin;
              } catch {
                return '';
              }
            })();

            const isCross = Boolean(pageOrigin) && Boolean(urlOrigin) && pageOrigin !== urlOrigin;
            const headTimeout = isCross ? HEAD_TIMEOUT_CROSS : FETCH_TIMEOUT;

            try {
              const headResp = await fetchWithTimeout(url, { method: 'HEAD' }, headTimeout);
              const len = headResp.headers.get('content-length');
              const sizeNum = len ? parseInt(len, 10) : NaN;
              const ct = headResp.headers.get('content-type') || '';
              const fmt = getImageFormat(url, ct);
              if (Number.isFinite(sizeNum) && sizeNum > 0) {
                return { size: sizeNum, format: fmt || null };
              }
              return { size: null, format: fmt || null };
            } catch (e) {
              logger.log('Images Analysis', 'HEAD size failed', 'info', e);
            }

            if (isSameOrigin(url, pageOrigin)) {
              try {
                const response = await fetchWithTimeout(url, undefined, FETCH_TIMEOUT);
                const blob = await response.blob();
                const ct = response.headers.get('content-type') || '';
                const fmt = getImageFormat(url, ct);
                return { size: blob.size || null, format: fmt || null };
              } catch (e) {
                logger.log('Images Analysis', 'GET size failed', 'info', e);
                return { size: null, format: null };
              }
            }

            return { size: null, format: null };
          } catch (e) {
            logger.log('Images Analysis', 'Size fetch failed', 'info', e);
            return { size: null, format: null };
          }
        };

        const fetchImageSize = async (img: (typeof validatedData.images)[number]) => {
          const cached = sizeCache.get(img.src);
          if (cached !== undefined) {
            const updatedFormat = cached.format || img.format || null;
            const updatedNextGen = updatedFormat ? NEXT_GEN.has(updatedFormat) : img.isNextGen;
            return {
              ...img,
              fileSize: cached.size ?? img.fileSize ?? null,
              format: updatedFormat,
              isNextGen: updatedNextGen,
            };
          }
          let inFlight = sizeInFlight.get(img.src);
          if (!inFlight) {
            inFlight = computeImageSize(img.src);
            sizeInFlight.set(img.src, inFlight);
          }
          const info = await inFlight;
          sizeInFlight.delete(img.src);
          sizeCache.set(img.src, info);
          const updatedFormat = info.format || img.format || null;
          const updatedNextGen = updatedFormat ? NEXT_GEN.has(updatedFormat) : img.isNextGen;
          return {
            ...img,
            fileSize: info.size ?? img.fileSize ?? null,
            format: updatedFormat,
            isNextGen: updatedNextGen,
          };
        };

        const runWithConcurrency = async <T, R>(
          items: T[],
          limit: number,
          task: (item: T, index: number) => Promise<R>
        ): Promise<R[]> => {
          const results = new Array<R>(items.length);
          let nextIndex = 0;
          const workers = new Array(Math.min(limit, items.length)).fill(0).map(async () => {
            while (true) {
              const current = nextIndex++;
              if (current >= items.length) break;
              try {
                results[current] = await task(items[current], current);
              } catch {
                void 0;
              }
            }
          });
          await Promise.all(workers);
          return results;
        };

        const updatedImages = await runWithConcurrency(
          validatedData.images,
          CONCURRENCY_LIMIT,
          async (img) => fetchImageSize(img)
        );

        const totalFileSize = updatedImages.reduce((sum, img) => sum + (img.fileSize || 0), 0);
        const imagesWithSize = updatedImages.filter((img) => img.fileSize !== null);
        const averageFileSize =
          imagesWithSize.length > 0 ? totalFileSize / imagesWithSize.length : 0;

        const oversizedCount = updatedImages.filter(
          (img) => img.format !== 'svg' && img.format !== 'ico' && (img.fileSize || 0) > 100 * 1024
        ).length;

        const optimizedCount = updatedImages.filter((img) => img.isNextGen).length;
        const needsOptimizationCount = updatedImages.filter(
          (img) => !img.isNextGen && img.format !== 'svg' && img.format !== 'ico'
        ).length;

        return {
          metrics: {
            ...validatedData.metrics,
            totalFileSize,
            averageFileSize,
            oversizedCount,
            optimizedCount,
            needsOptimizationCount,
          },
          images: updatedImages,
        };
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        logSystemAware('Images Analysis', `Execution error: ${msg}`);
        throw error;
      }
    },
  });

  useEffect(() => {
    if (state.status === 'idle') {
      analyzeCurrentPage();
    }

    return () => {
      abortControllersRef.current.forEach((ctrl) => {
        ctrl.abort();
      });
      timeoutsRef.current.forEach((id) => {
        clearTimeout(id);
      });
      abortControllersRef.current = [];
      timeoutsRef.current = [];
    };
  }, [analyzeCurrentPage, state.status]);

  const handleExport = () => {
    if (!state.result) return;

    const data = state.result.images.map((img) => ({
      src: img.src,
      alt: img.alt || '',
      title: img.title || '',
      width: img.width || 0,
      height: img.height || 0,
      fileSize: img.fileSize || 0,
      hasAlt: img.hasAlt,
      hasAltContent: img.hasAltContent,
      hasTitle: img.hasTitle,
      format: img.format || '',
      isNextGen: img.isNextGen,
      isLazy: img.isLazy,
      caption: img.caption || '',
      sources: img.sources,
      position: img.position,
    }));

    exportToCSV(data);
  };

  const handleDownloadImages = () => {
    if (!state.result) return;
    downloadImagesAsZip(filteredImages);
  };

  const filteredImages = useMemo(() => {
    if (!state.result) return [];
    let filtered = [...state.result.images];

    if (filters.showMissingAlt) {
      filtered = filtered.filter((img) => !img.hasAltContent);
    }
    if (filters.showNeedsOptimization) {
      filtered = filtered.filter(
        (img) => !img.isNextGen && img.format !== 'svg' && img.format !== 'ico'
      );
    }
    if (filters.showOversized) {
      filtered = filtered.filter(
        (img) => (img.fileSize || 0) > 100 * 1024 && img.format !== 'svg' && img.format !== 'ico'
      );
    }
    if (filters.showMissingDimensions) {
      filtered = filtered.filter(
        (img) => img.format !== 'svg' && img.format !== 'ico' && !hasDimensions(img)
      );
    }
    if (filters.showLazyCandidates) {
      filtered = filtered.filter((img) => !img.isLazy);
    }

    const direction = sort.direction === 'asc' ? 1 : -1;
    return filtered.sort((a, b) => {
      switch (sort.field) {
        case 'appearance':
          return direction * (a.position - b.position);
        case 'url': {
          const categorize = (src: string): number => {
            if (!src) return 3;
            if (src.startsWith('data:')) return 2;
            try {
              const u = new URL(src);
              return u.protocol === 'http:' || u.protocol === 'https:' ? 0 : 1;
            } catch {
              return 1;
            }
          };
          const aCat = categorize(a.src);
          const bCat = categorize(b.src);
          if (aCat !== bCat) return direction * (aCat - bCat);
          return direction * a.src.localeCompare(b.src);
        }
        case 'dimensions':
          return direction * ((a.width || 0) * (a.height || 0) - (b.width || 0) * (b.height || 0));
        case 'fileSize':
          return direction * ((a.fileSize || 0) - (b.fileSize || 0));
        case 'missingAlt': {
          const aHasAlt = a.hasAltContent ? 1 : 0;
          const bHasAlt = b.hasAltContent ? 1 : 0;
          return direction * (aHasAlt - bHasAlt);
        }
        case 'optimized': {
          const aLegacy = a.isNextGen ? 0 : 1;
          const bLegacy = b.isNextGen ? 0 : 1;
          return direction * (aLegacy - bLegacy);
        }
        case 'lazy': {
          const aNonLazy = !a.isLazy ? 1 : 0;
          const bNonLazy = !b.isLazy ? 1 : 0;
          return direction * (aNonLazy - bNonLazy);
        }
        case 'missingDimensions': {
          const aMissing = !hasDimensions(a) ? 1 : 0;
          const bMissing = !hasDimensions(b) ? 1 : 0;
          return direction * (aMissing - bMissing);
        }
        case 'format': {
          const aFmt = (a.format || '').toLowerCase();
          const bFmt = (b.format || '').toLowerCase();
          return direction * aFmt.localeCompare(bFmt);
        }
        case 'oversized': {
          const isOversizedA =
            (a.fileSize || 0) > 100 * 1024 && a.format !== 'svg' && a.format !== 'ico' ? 1 : 0;
          const isOversizedB =
            (b.fileSize || 0) > 100 * 1024 && b.format !== 'svg' && b.format !== 'ico' ? 1 : 0;
          return direction * (isOversizedA - isOversizedB);
        }
        default:
          return 0;
      }
    });
  }, [state.result, filters, sort]);

  const handleSortChange = (s: { field: SortField; direction: SortDirection }) => {
    setSort(s);
    if (listRef.current) {
      try {
        listRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      } catch {
        listRef.current.scrollTop = 0;
      }
    }
  };

  if (state.error) {
    return (
      <ErrorScreen
        title="Images Analysis Failed"
        message={state.error.message}
        onRetry={analyzeCurrentPage}
      />
    );
  }

  if (
    !state.result?.images.length &&
    state.status !== 'loading' &&
    state.status !== 'loading-sizes'
  ) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-brand-400">
        <p className="text-sm">No images found on this page</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <QuickMetrics
        metrics={state.result?.metrics || null}
        isLoading={state.status === 'loading' || state.status === 'loading-sizes'}
      />

      <ImageToolbar
        filters={filters}
        sort={sort}
        onFilterChange={setFilters}
        onSortChange={handleSortChange}
        onExport={handleExport}
        onDownloadImages={handleDownloadImages}
        disabled={state.status === 'loading' || state.status === 'loading-sizes'}
        filterCounts={{
          missingAlt: state.result?.metrics.missingAltCount || 0,
          needsOptimization: state.result?.metrics.needsOptimizationCount || 0,
          oversized: state.result?.metrics.oversizedCount || 0,
          missingDimensions: state.result?.metrics.missingDimensionsCount || 0,
          lazyCandidates: state.result?.metrics.lazyCandidatesCount || 0,
        }}
      />

      <div className="flex-1 min-h-0" ref={listRef}>
        <ImageList
          images={filteredImages}
          isLoading={state.status === 'loading' || state.status === 'loading-sizes'}
          containerRef={listRef}
        />
      </div>
    </div>
  );
};

export default Images;
