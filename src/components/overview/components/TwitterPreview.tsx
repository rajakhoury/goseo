import React from 'react';
import { BiGlobe } from 'react-icons/bi';
import { getTwitterPreviewData } from '../utils/socialUtils';
import { formatSerpUrl } from '../utils/serpUtils';
import clsx from 'clsx';
import type { PageElements } from '../types';

export interface TwitterPreviewProps {
  elements: PageElements;
  className?: string;
  mode: 'serp' | 'social' | 'twitter';
  onChange: (mode: 'serp' | 'social' | 'twitter') => void;
}

export const TwitterPreview: React.FC<TwitterPreviewProps> = React.memo(
  ({ elements, className = '', mode, onChange }) => {
    const data = getTwitterPreviewData(elements);

    const formattedUrl = React.useMemo(() => formatSerpUrl(data.url), [data.url]);

    return (
      <div
        className={`bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 transition-all duration-200 ${className}`}
        role="region"
        aria-label="X preview"
      >
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs">
              {data.domain ? (
                <BiGlobe
                  className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400"
                  aria-hidden="true"
                />
              ) : null}
              <span className="text-gray-700 dark:text-gray-300">{data.domain}</span>
              {data.url && data.domain && formattedUrl && formattedUrl !== data.domain && (
                <>
                  <span className="text-gray-400 dark:text-gray-600" aria-hidden="true">
                    ›
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 truncate">
                    {formattedUrl.replace(data.domain, '')}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onChange('serp')}
                className={`text-[11px] px-1.5 py-0.5 rounded border ${
                  mode === 'serp'
                    ? 'bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-900/40 dark:text-brand-300 dark:border-brand-700'
                    : 'bg-gray-50 text-gray-600 border-gray-100 dark:text-gray-400 dark:bg-gray-800/60 dark:border-gray-700'
                }`}
              >
                SERP
              </button>
              <button
                onClick={() => onChange('social')}
                className={`text-[11px] px-1.5 py-0.5 rounded border ${
                  mode === 'social'
                    ? 'bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-900/40 dark:text-brand-300 dark:border-brand-700'
                    : 'bg-gray-50 text-gray-600 border-gray-100 dark:text-gray-400 dark:bg-gray-800/60 dark:border-gray-700'
                }`}
              >
                Social
              </button>
              <button
                onClick={() => onChange('twitter')}
                className={`text-[11px] px-1.5 py-0.5 rounded border ${
                  mode === 'twitter'
                    ? 'bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-900/40 dark:text-brand-300 dark:border-brand-700'
                    : 'bg-gray-50 text-gray-600 border-gray-100 dark:text-gray-400 dark:bg-gray-800/60 dark:border-gray-700'
                }`}
              >
                X
              </button>
            </div>
          </div>

          {data.image ? (
            <div
              className="w-full overflow-hidden rounded-md border border-gray-100 dark:border-gray-700"
              style={{ aspectRatio: '1.91 / 1', maxHeight: 200 }}
            >
              <img src={data.image} alt="share image" className="w-full h-full object-cover" />
            </div>
          ) : null}

          <h3 className={clsx('text-base font-medium leading-tight px-0.5', data.image && 'mt-2')}>
            <span className="text-blue-600 dark:text-blue-300">{data.title}</span>
          </h3>

          <p className="text-sm text-gray-700 dark:text-gray-400 leading-relaxed px-0.5">
            {data.description}
          </p>
        </div>
      </div>
    );
  }
);

TwitterPreview.displayName = 'TwitterPreview';

export default TwitterPreview;
