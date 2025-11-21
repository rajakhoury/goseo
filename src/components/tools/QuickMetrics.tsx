import React from 'react';

interface QuickMetricsProps {
  totalTools: number;
  isLoading: boolean;
}

const QuickMetrics: React.FC<QuickMetricsProps> = ({ totalTools, isLoading }) => {
  if (isLoading) {
    return (
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-4">
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Available Tools:
        </span>
        <span className="text-sm font-bold text-brand-600 dark:text-brand-400">{totalTools}</span>
      </div>
    </div>
  );
};

export default QuickMetrics;
