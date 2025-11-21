import React from 'react';
import { QuickMetricsProps } from './types';

const MetricItem: React.FC<{ tag: string; count: number }> = ({ tag, count }) => (
  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-md p-2 w-[80px]">
    <div className="text-xs font-medium text-gray-500 dark:text-gray-400">{tag}</div>
    <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">{count}</div>
  </div>
);

const LoadingSkeleton: React.FC = () => (
  <div className="grid grid-cols-6 gap-4">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="bg-gray-50 dark:bg-gray-800/50 rounded-md p-2 animate-pulse">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-1" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12" />
      </div>
    ))}
  </div>
);

const QuickMetrics: React.FC<QuickMetricsProps> = ({ headingCounts, loading, className = '' }) => {
  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!headingCounts) {
    return <LoadingSkeleton />;
  }

  return (
    <div className={`grid grid-cols-6 gap-4 ${className}`}>
      <MetricItem tag="H1" count={headingCounts.h1} />
      <MetricItem tag="H2" count={headingCounts.h2} />
      <MetricItem tag="H3" count={headingCounts.h3} />
      <MetricItem tag="H4" count={headingCounts.h4} />
      <MetricItem tag="H5" count={headingCounts.h5} />
      <MetricItem tag="H6" count={headingCounts.h6} />
    </div>
  );
};

export default QuickMetrics;
