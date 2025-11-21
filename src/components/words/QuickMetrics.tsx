import React from 'react';
import type { WordAnalysisResult } from './types';
import { BiInfoCircle } from 'react-icons/bi';
import Tooltip from '../common/Tooltip';

interface QuickMetricsProps {
  analysis: WordAnalysisResult | null;
  loading: boolean;
  className?: string;
}

const QuickMetrics: React.FC<QuickMetricsProps> = ({ analysis, loading, className }) => {
  if (loading) {
    return (
      <div className={className}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-gray-50 dark:bg-gray-800/50 rounded-md p-2 animate-pulse">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-1" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12" />
          </div>
        ))}
      </div>
    );
  }

  if (!analysis) return null;

  const metrics = [
    { label: 'Total Words', value: analysis.totalWords },
    { label: 'Unique Words', value: analysis.uniqueWords },
    { label: 'Avg Word Length', value: analysis.avgWordLength?.toFixed(1) || '0' },
    { label: 'Reading Time', value: `${analysis.readingTime} min` },
    {
      label: (
        <div className="flex items-center gap-1">
          Text/HTML Ratio
          <Tooltip
            content="Ratio of visible text compared to HTML code"
            side="top"
            align="end"
            delay={200}
          >
            <BiInfoCircle
              className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 transition-colors"
              aria-hidden="true"
            />
          </Tooltip>
        </div>
      ),
      value: `${analysis.textHtmlRatio}%`,
    },
  ];

  return (
    <div className={className}>
      {metrics.map((metric, i) => (
        <div key={i} className="bg-gray-50 dark:bg-gray-800/50 rounded-md p-2">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400">{metric.label}</div>
          <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
            {metric.value}
          </div>
        </div>
      ))}
    </div>
  );
};

export default QuickMetrics;
