import React from 'react';
import { LinkData, LinkMetrics, FilterOptions } from './types';
import { filterLinks } from './filterUtils';

interface LinkListProps {
  links: LinkData[];
  loading: boolean;
  metrics: LinkMetrics | null;
  filters: FilterOptions;
}

const LinkList: React.FC<LinkListProps> = ({ links, loading, filters }) => {
  if (loading) {
    return (
      <div className="flex-1 overflow-auto p-4">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-md p-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const filteredLinks = filterLinks(links, filters);
  if (!Array.isArray(filteredLinks)) {
    return (
      <div className="text-center text-sm text-gray-500 dark:text-red-400 py-8">
        Error processing links
      </div>
    );
  }

  const urlOccurrences = React.useMemo(() => {
    return links.reduce(
      (acc, link) => {
        if (link?.href) {
          acc[link.href] = (acc[link.href] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>
    );
  }, [links]);

  const scrollToElement = (elementId: string) => {
    try {
      const element = document.getElementById(elementId);
      if (!element || element.getBoundingClientRect().height === 0) return;

      element.scrollIntoView({
        behavior: 'scrollBehavior' in document.documentElement.style ? 'smooth' : 'auto',
        block: 'start',
      });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('Failed to scroll to link:', error);
      }
    }
  };

  const handleLinkClick = (domId: string) => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab?.id) return;

      chrome.scripting
        .executeScript({
          target: { tabId: tab.id },
          world: 'ISOLATED',
          func: scrollToElement,
          args: [domId],
        })
        .catch(() => {
          if (import.meta.env.DEV) {
            console.warn('Failed to execute scroll script');
          }
        });
    });
  };

  return (
    <div className="flex-1 overflow-auto p-4 pt-2 bg-gray-50/50 dark:bg-gray-900/20">
      <div className="space-y-2">
        {filteredLinks.length === 0 ? (
          <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-8">
            No links match the current filters
          </div>
        ) : (
          filteredLinks.map((link) => {
            if (!link?.domPosition?.id) {
              return null;
            }

            const protocol = link.href?.split(':')?.[0] || '';
            const occurrences = link.href ? urlOccurrences[link.href] : 0;

            return (
              <div
                key={link.domPosition.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 hover:shadow-md transition-shadow cursor-pointer"
                title={link.href || 'No URL'}
                onClick={() => handleLinkClick(link.domPosition.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate"
                      title={link.text || link.href || 'Untitled link'}
                    >
                      {link.text || link.href || 'Untitled link'}
                    </p>
                    <p
                      className="text-sm text-gray-500 dark:text-gray-400 truncate"
                      title={link.href || 'No URL'}
                    >
                      {link.href || 'No URL'}
                    </p>
                    {occurrences > 1 && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Occurrences: {occurrences}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {typeof link.isInternal === 'boolean' && (
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          link.isInternal
                            ? 'bg-zinc-400/20 text-zinc-700 dark:bg-zinc-400/10 dark:text-zinc-300'
                            : 'bg-violet-400/20 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300'
                        }`}
                      >
                        {link.isInternal ? 'Internal' : 'External'}
                      </span>
                    )}
                    {link.isNoFollow && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full  bg-yellow-400/20 text-yellow-700 dark:bg-yellow-400/10 dark:text-yellow-300">
                        NoFollow
                      </span>
                    )}
                    {link.title === null && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-400/20 text-orange-700 dark:bg-orange-400/10 dark:text-orange-300">
                        No Title
                      </span>
                    )}
                    {link.type === 'communication' && protocol && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-fuchsia-400/20 text-fuchsia-700 dark:bg-fuchsia-400/10 dark:text-fuchsia-300">
                        {protocol}
                      </span>
                    )}
                    {link.broken && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-400/20 text-red-700 dark:bg-red-400/10 dark:text-red-300">
                        Broken
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default React.memo(LinkList);
