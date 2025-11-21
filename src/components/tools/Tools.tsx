import React, { useEffect, useMemo, useState } from 'react';
import { BiX } from 'react-icons/bi';
import ToolCard from './ToolCard';
import { SEO_TOOLS, buildToolUrl } from './toolsList';
import type { ToolCategory } from './types';

const Tools: React.FC = () => {
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<ToolCategory | null>(null);

  useEffect(() => {
    const getCurrentUrl = async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.url) {
        setCurrentUrl(tab.url);
      }
    };

    getCurrentUrl();
  }, []);

  const categories = useMemo(() => {
    const cats = new Map<ToolCategory, number>();
    SEO_TOOLS.forEach((tool) => {
      cats.set(tool.category, (cats.get(tool.category) || 0) + 1);
    });
    return cats;
  }, []);

  const filteredTools = useMemo(() => {
    const tools = activeFilter
      ? SEO_TOOLS.filter((tool) => tool.category === activeFilter)
      : SEO_TOOLS;

    const grouped: Record<string, typeof SEO_TOOLS> = {};
    tools.forEach((tool) => {
      if (!grouped[tool.category]) {
        grouped[tool.category] = [];
      }
      grouped[tool.category].push(tool);
    });

    return grouped;
  }, [activeFilter]);

  const categoryLabels: Record<ToolCategory, string> = {
    technical: 'Technical SEO',
    performance: 'Performance',
    content: 'Content & Social',
    keywords: 'Keywords',
    backlinks: 'Backlinks',
    search: 'Search Operators',
  };

  const categoryColors: Record<ToolCategory, string> = {
    technical:
      'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 hover:bg-purple-200 dark:hover:bg-purple-900/50',
    performance:
      'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-900/50',
    content:
      'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-900/50',
    keywords:
      'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 hover:bg-yellow-200 dark:hover:bg-yellow-900/50',
    backlinks:
      'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-200 hover:bg-pink-200 dark:hover:bg-pink-900/50',
    search:
      'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 hover:bg-orange-200 dark:hover:bg-orange-900/50',
  };

  const activeColors: Record<ToolCategory, string> = {
    technical: 'bg-purple-600 text-white hover:bg-purple-700',
    performance: 'bg-blue-600 text-white hover:bg-blue-700',
    content: 'bg-green-600 text-white hover:bg-green-700',
    keywords: 'bg-yellow-600 text-white hover:bg-yellow-700',
    backlinks: 'bg-pink-600 text-white hover:bg-pink-700',
    search: 'bg-orange-600 text-white hover:bg-orange-700',
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-3 py-2.5 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-1.5 flex-wrap">
          {Array.from(categories.entries()).map(([category, count]) => (
            <button
              key={category}
              onClick={() => setActiveFilter(activeFilter === category ? null : category)}
              className={`
                px-2 py-1 rounded-md text-xs font-medium transition-colors
                ${activeFilter === category ? activeColors[category] : categoryColors[category]}
              `}
            >
              {categoryLabels[category]} ({count})
            </button>
          ))}

          {activeFilter && (
            <button
              onClick={() => setActiveFilter(null)}
              className="ml-1 p-1 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              title="Clear filter"
            >
              <BiX className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 bg-gray-50 dark:bg-gray-900">
        {Object.entries(filteredTools).map(([category, tools]) => (
          <div key={category} className="mb-6 last:mb-0">
            {!activeFilter && (
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
                {categoryLabels[category as ToolCategory]}
              </h2>
            )}

            <div className="grid grid-cols-2 gap-4">
              {tools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} url={buildToolUrl(tool, currentUrl)} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tools;
