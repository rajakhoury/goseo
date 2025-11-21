import React from 'react';
import type { WordCount } from './types';
import { useSettings } from '../../contexts/settingsCore';
import clsx from 'clsx';

interface DensityChartProps {
  words: WordCount[];
}

const DensityChart: React.FC<DensityChartProps> = ({ words }) => {
  const { settings } = useSettings();
  const ranges = settings.components.wordAnalysis.densityRanges;

  const getDensityCategory = (density: number) => {
    if (density <= ranges.underOptimized) {
      return 'under-optimized';
    } else if (density <= ranges.optimal.max) {
      return 'optimal';
    } else {
      return 'over-optimized';
    }
  };

  const getDensityColor = (density: number) => {
    const category = getDensityCategory(density);
    switch (category) {
      case 'under-optimized':
        return 'bg-yellow-500';
      case 'optimal':
        return 'bg-green-500';
      case 'over-optimized':
        return 'bg-red-500';
    }
  };

  const topWords = [...words].sort((a, b) => b.density - a.density).slice(0, 15);

  const maxDensity = topWords.length ? Math.max(...topWords.map((w) => w.density)) : 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-medium text-gray-900 dark:text-gray-100">
            Top Keywords by Density
          </h3>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Recommended density: {ranges.underOptimized}% - {ranges.optimal.max}%
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-1">
        {topWords.map((word) => (
          <div key={word.text} className="flex items-center gap-2 py-1">
            <div className="w-32 text-xs text-gray-900 dark:text-gray-100 truncate">
              {word.text}
            </div>
            <div className="flex-1 h-6 flex items-center">
              <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800/50 rounded-full overflow-hidden">
                <div
                  className={clsx(
                    'h-full rounded-full transition-all duration-500',
                    getDensityColor(word.density)
                  )}
                  style={{ width: `${maxDensity > 0 ? (word.density / maxDensity) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div className="w-12 text-right text-xs text-gray-500 dark:text-gray-400">
              {word.density.toFixed(2)}%
            </div>
            <div className="w-8 text-right text-xs text-gray-500 dark:text-gray-400">
              {word.count}x
            </div>
          </div>
        ))}
      </div>

      <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700 flex items-center gap-3 text-[10px] text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-yellow-500" />
          <span>Under (≤{ranges.underOptimized}%)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span>
            Good ({ranges.underOptimized}-{ranges.optimal.max}%)
          </span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span>Over (&gt;{ranges.optimal.max}%)</span>
        </div>
      </div>
    </div>
  );
};

export default DensityChart;
