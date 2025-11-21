import React from 'react';
import { BiLinkExternal } from 'react-icons/bi';
import { SEOTool } from './types';

interface ToolCardProps {
  tool: SEOTool;
  url: string;
}

const categoryColors: Record<string, string> = {
  technical: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  performance: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  content: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  keywords: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  backlinks: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
  search: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
};

const ToolCard: React.FC<ToolCardProps> = ({ tool, url }) => {
  const handleClick = () => {
    chrome.tabs.create({ url });
  };

  return (
    <div
      className="group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md hover:border-brand-500 dark:hover:border-brand-600 transition-all cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
              {tool.name}
            </h3>
            <BiLinkExternal className="flex-shrink-0 h-4 w-4 text-gray-400 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors" />
          </div>

          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
            {tool.description}
          </p>

          <span
            className={`inline-block px-2 py-1 text-xs font-medium rounded ${categoryColors[tool.category]}`}
          >
            {tool.category.charAt(0).toUpperCase() + tool.category.slice(1)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ToolCard;
