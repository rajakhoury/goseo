import React from 'react';
import { ImageData, hasDimensions } from './types';
import { formatFileSize } from '../../utils/formatters';
import { BsExclamationTriangle } from 'react-icons/bs';
import { BiTime } from 'react-icons/bi';
import { logger } from '../../utils/logger';
import { getDisplayFormat } from './exportUtils';
import Button from '../common/Button';

interface ImageListProps {
  images: ImageData[];
  isLoading: boolean;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

export function ImageList({ images, isLoading, containerRef }: ImageListProps) {
  const [failedImages, setFailedImages] = React.useState<Set<string>>(new Set());
  const PAGINATION_THRESHOLD = 300;
  const PAGE_SIZE = 100;
  const [page, setPage] = React.useState(0);
  const isPaginated = images.length > PAGINATION_THRESHOLD;
  const totalPages = isPaginated ? Math.ceil(images.length / PAGE_SIZE) : 1;
  const start = isPaginated ? page * PAGE_SIZE : 0;
  const end = isPaginated ? Math.min(start + PAGE_SIZE, images.length) : images.length;
  const visibleImages = isPaginated ? images.slice(start, end) : images;

  const handleImageError = React.useCallback((src: string, target: HTMLImageElement) => {
    setFailedImages((prev) => new Set(prev).add(src));
    target.style.display = 'none';
    target.parentElement?.classList.add('placeholder-shown');
    logger.log('Image List', `Failed to load image: ${src}`, 'info');
  }, []);

  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto space-y-4 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-lg shadow p-3">
            <div className="flex gap-3">
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!images.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-gray-500 dark:text-brand-400">
        <p className="text-sm">No images found matching the current filters</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="bg-gray-50 dark:bg-gray-900 h-full overflow-x-hidden overflow-y-auto p-4 pt-0"
    >
      {isPaginated ? (
        <div className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 pt-4 pb-2">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Showing {start + 1}–{end} of {images.length}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="xs"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                Prev
              </Button>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Page {page + 1} / {totalPages}
              </div>
              <Button
                variant="secondary"
                size="xs"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      ) : null}
      {visibleImages.map((image, i) => (
        <div
          key={`${image.position}-${image.src}`}
          className={`bg-white dark:bg-gray-800 rounded-lg shadow p-3 ${i === 0 ? 'mt-2' : 'mt-4'}`}
        >
          <div className="flex gap-3">
            <div className="rounded w-12 h-12 relative flex-shrink-0 p-0">
              {image.src && (
                <img
                  src={image.src}
                  alt=""
                  loading="lazy"
                  className={`w-full h-full object-cover rounded ${failedImages.has(image.src) ? 'hidden' : ''}`}
                  onError={(e) => handleImageError(image.src, e.target as HTMLImageElement)}
                />
              )}
              <div
                className={`bg-gray-50 dark:bg-gray-900 absolute inset-0 flex items-center justify-center ${image.src && !failedImages.has(image.src) ? 'hidden' : 'flex'}`}
              >
                <svg
                  className="w-6 h-6 text-gray-400 dark:text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>

            <div className="flex-1 min-w-0 space-y-1.5">
              <div className={`grid ${image.hasTitle ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
                <div>
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    ALT Text
                  </div>
                  {image.hasAltContent ? (
                    <div className="text-sm text-gray-900 dark:text-white truncate">
                      {image.alt}
                    </div>
                  ) : (
                    <div className="flex items-center text-xs text-amber-500">
                      <BsExclamationTriangle className="mr-1 flex-shrink-0 hidden" />
                      Missing ALT text
                    </div>
                  )}
                </div>

                {image.hasTitle ? (
                  <div>
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Title
                    </div>
                    <div className="text-sm text-gray-900 dark:text-white truncate">
                      {image.title}
                    </div>
                  </div>
                ) : null}
              </div>

              {image.caption ? (
                <div>
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Caption
                  </div>
                  <div className="text-xs text-gray-700 dark:text-gray-300 truncate">
                    {image.caption}
                  </div>
                </div>
              ) : null}

              <a
                href={image.src}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 truncate"
              >
                {image.src}
              </a>

              <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-400 flex-wrap">
                {image.fileSize && image.fileSize > 0 ? (
                  <div className="flex-shrink-0">Size: {formatFileSize(image.fileSize)}</div>
                ) : null}
                {hasDimensions(image) ? (
                  <div className="flex-shrink-0">
                    Dimensions: {image.width} × {image.height}
                  </div>
                ) : null}
                {image.format &&
                  (() => {
                    const served = getDisplayFormat(image.src, image.format || undefined);
                    return served ? (
                      <div className="flex-shrink-0 flex items-center gap-0">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Format:&nbsp;
                        </span>
                        {image.isNextGen && (
                          <svg
                            className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                          </svg>
                        )}
                        <span
                          className={`truncate ${image.isNextGen ? 'text-brand-600 dark:text-brand-400 italic' : 'text-gray-900 dark:text-gray-100'}`}
                        >
                          {served.toUpperCase()}
                        </span>
                      </div>
                    ) : null;
                  })()}
                {!hasDimensions(image) && image.format !== 'svg' && image.format !== 'ico' ? (
                  <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border bg-gray-50 text-rose-600 border-gray-100 dark:text-rose-300 dark:bg-gray-800/60 dark:border-gray-700">
                    <BsExclamationTriangle className="h-3 w-3" />
                    <span>No dimensions</span>
                  </div>
                ) : null}
                {!image.isLazy ? (
                  <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border bg-gray-50 text-amber-600 border-gray-100 dark:text-amber-300 dark:bg-gray-800/60 dark:border-gray-700">
                    <BiTime className="h-3 w-3" />
                    <span>Non-lazy</span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ))}
      {isPaginated ? (
        <div className="sticky bottom-0 z-10 bg-gray-50 dark:bg-gray-900 py-2">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Showing {start + 1}–{end} of {images.length}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="xs"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                Prev
              </Button>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Page {page + 1} / {totalPages}
              </div>
              <Button
                variant="secondary"
                size="xs"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default React.memo(ImageList);
