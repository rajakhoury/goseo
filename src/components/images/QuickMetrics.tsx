import React from 'react';
import { BiInfoCircle, BiChevronDown, BiChevronUp } from 'react-icons/bi';
import Tooltip from '../common/Tooltip';
import { formatBytes } from '../../utils/formatters';
import type { QuickMetricsProps } from './types';

const QuickMetrics: React.FC<QuickMetricsProps> = ({ metrics, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center flex-shrink-0 m-0 p-0 mt-2">
        <div className="grid grid-cols-4 gap-3 px-3 w-full">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-50 dark:bg-gray-800/50 rounded-md p-2 animate-pulse">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-1" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  const metricsData = [
    { label: 'Total Images', value: metrics.totalCount },
    {
      label: (
        <div className="flex items-center gap-1">
          Missing ALT
          <Tooltip content="ALT text is empty or missing" side="top" align="end" delay={200}>
            <BiInfoCircle
              className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 transition-colors"
              aria-hidden="true"
            />
          </Tooltip>
        </div>
      ),
      value: metrics.missingAltCount,
    },
    {
      label: (
        <div className="flex items-center gap-1">
          Lazy Candidates
          <Tooltip content="Not detected as lazy-loaded" side="top" align="end" delay={200}>
            <BiInfoCircle
              className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 transition-colors"
              aria-hidden="true"
            />
          </Tooltip>
        </div>
      ),
      value: metrics.lazyCandidatesCount ?? 0,
    },
    {
      label: (
        <div className="flex items-center gap-1">
          Oversized (&gt;100KB)
          <Tooltip content="Over 100 KB (SVG/ICO excluded)" side="top" align="end" delay={200}>
            <BiInfoCircle
              className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 transition-colors"
              aria-hidden="true"
            />
          </Tooltip>
        </div>
      ),
      value: metrics.oversizedCount ?? 0,
    },
    {
      label: (
        <div className="flex items-center gap-1">
          Missing Dimensions
          <Tooltip
            content="Width or height missing (SVG/ICO excluded)"
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
      value: metrics.missingDimensionsCount ?? 0,
    },
    {
      label: (
        <div className="flex items-center gap-1">
          Next-Gen
          <Tooltip
            content="Uses next‑gen formats (WebP, AVIF, JXL, HEIF/HEIC)"
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
      value: metrics.optimizedCount,
    },
    {
      label: (
        <div className="flex items-center gap-1">
          Total Size
          <Tooltip content="Combined file size (measured)" side="top" align="end" delay={200}>
            <BiInfoCircle
              className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 transition-colors"
              aria-hidden="true"
            />
          </Tooltip>
        </div>
      ),
      value: formatBytes(metrics.totalFileSize),
    },
    {
      label: (
        <div className="flex items-center gap-1">
          Average Size
          <Tooltip content="Average file size (measured)" side="top" align="end" delay={200}>
            <BiInfoCircle
              className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 transition-colors"
              aria-hidden="true"
            />
          </Tooltip>
        </div>
      ),
      value: formatBytes(metrics.averageFileSize),
    },
  ];

  const [expanded, setExpanded] = React.useState(false);
  const primary = metricsData.slice(0, 4);

  return (
    <div className="relative flex-shrink-0 m-0 p-0 mt-2">
      <div className="grid grid-cols-4 gap-3 px-24">
        {(expanded ? metricsData : primary).map((metric, i) => (
          <div key={i} className="bg-gray-50 dark:bg-gray-800/50 rounded-md p-2">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 truncate">
              {metric.label}
            </div>
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {metric.value}
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="absolute right-3 bottom-1 inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded border bg-gray-50 text-gray-600 border-gray-100 dark:text-gray-400 dark:bg-gray-800/60 dark:border-gray-700"
        aria-label={expanded ? 'Show fewer metrics' : 'Show more metrics'}
        title={expanded ? 'Show fewer metrics' : 'Show more metrics'}
      >
        {expanded ? <BiChevronUp className="h-3 w-3" /> : <BiChevronDown className="h-3 w-3" />}
        {expanded ? 'Less' : 'More'}
      </button>
    </div>
  );
};

export default QuickMetrics;
