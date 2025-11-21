import React from 'react';
import { BiGlobe } from 'react-icons/bi';
import {
  formatSerpTitle,
  formatSerpDescription,
  formatSerpUrl,
  extractDomain,
} from '../utils/serpUtils';

export interface SerpPreviewProps {
  title: string;
  description: string;
  url: string;
  className?: string;
  mode: 'serp' | 'social' | 'twitter';
  onChange: (mode: 'serp' | 'social' | 'twitter') => void;
  actions?: React.ReactNode;
}

export const SerpPreview: React.FC<SerpPreviewProps> = React.memo(
  ({ title, description, url, className = '', mode, onChange, actions }) => {
    const formattedTitle = React.useMemo(() => formatSerpTitle(title || 'Untitled Page'), [title]);

    const formattedDescription = React.useMemo(
      () => formatSerpDescription(description || 'No description available'),
      [description]
    );

    const formattedUrl = React.useMemo(() => formatSerpUrl(url), [url]);

    const domain = React.useMemo(() => extractDomain(url), [url]);
    const domainDisplay = React.useMemo(() => domain || '[URL missing]', [domain]);

    const displayFavicon = React.useMemo(() => {
      if (!domain) return '';
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    }, [domain]);

    return (
      <div
        className={`bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 transition-all duration-200 ${className}`}
        role="region"
        aria-label="SERP preview"
      >
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs" aria-label="URL breadcrumb">
              {displayFavicon ? (
                <img
                  src={displayFavicon}
                  alt="favicon"
                  className="h-3.5 w-3.5 rounded-sm border border-gray-200 dark:border-gray-700 object-cover"
                />
              ) : (
                <BiGlobe
                  className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400"
                  aria-hidden="true"
                />
              )}
              <span className="text-gray-700 dark:text-gray-300">{domainDisplay}</span>
              {formattedUrl && domain && formattedUrl !== domain && (
                <>
                  <span className="text-gray-400 dark:text-gray-600" aria-hidden="true">
                    ›
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 truncate">
                    {formattedUrl.replace(domain, '')}
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
              {actions ? (
                <div className="ml-1 pl-2 border-l border-gray-200 dark:border-gray-700">
                  {actions}
                </div>
              ) : null}
            </div>
          </div>

          <h3 className="text-base font-medium leading-tight px-0.5">
            <span className="text-blue-600 dark:text-blue-300">{formattedTitle}</span>
          </h3>

          <p className="text-sm text-gray-700 dark:text-gray-400 leading-relaxed px-0.5">
            {formattedDescription}
          </p>
        </div>

        <div className="hidden">
          <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">SERP Preview</span>
        </div>
      </div>
    );
  }
);

SerpPreview.displayName = 'SerpPreview';

export default SerpPreview;
