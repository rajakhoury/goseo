import React from 'react';
import { LinkMetrics } from './types';
import { BiInfoCircle } from 'react-icons/bi';
import Tooltip from '../common/Tooltip';

interface QuickMetricsProps {
  metrics: LinkMetrics | null;
  isLoading: boolean;
  isBrokenLinksLoading?: boolean;
}

const MetricItem: React.FC<{
  label: React.ReactNode;
  value: number | React.ReactNode;
}> = ({ label, value }) => (
  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-md p-2">
    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 truncate">
      {label}
    </div>
    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{value}</div>
  </div>
);

const LoadingSkeleton: React.FC = () => (
  <div className="grid grid-cols-8 gap-4 px-4">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="bg-gray-50 dark:bg-gray-800/50 rounded-md p-2 animate-pulse">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-1" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12" />
      </div>
    ))}
  </div>
);

const QuickMetrics: React.FC<QuickMetricsProps> = ({
  metrics,
  isLoading,
  isBrokenLinksLoading = false,
}) => {
  if (isLoading || !metrics) {
    return (
      <div className="flex items-center justify-center flex-shrink-0 m-0 p-0 mt-3">
        <LoadingSkeleton />
      </div>
    );
  }

  const metricsData = [
    {
      label: (
        <div className="flex items-center gap-1">
          Total
          <Tooltip content="All links on page" side="top" align="end" delay={200}>
            <BiInfoCircle
              className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 transition-colors"
              aria-hidden="true"
            />
          </Tooltip>
        </div>
      ),
      value: metrics.total,
    },
    {
      label: (
        <div className="flex items-center gap-1">
          No Title
          <Tooltip content="Missing title attribute" side="top" align="end" delay={200}>
            <BiInfoCircle
              className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 transition-colors"
              aria-hidden="true"
            />
          </Tooltip>
        </div>
      ),
      value: metrics.missingTitles,
    },
    {
      label: (
        <div className="flex items-center gap-1">
          Internal
          <Tooltip content="Links on same domain" side="top" align="end" delay={200}>
            <BiInfoCircle
              className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 transition-colors"
              aria-hidden="true"
            />
          </Tooltip>
        </div>
      ),
      value: metrics.internal,
    },
    {
      label: (
        <div className="flex items-center gap-1">
          External
          <Tooltip content="Links to other domains" side="top" align="end" delay={200}>
            <BiInfoCircle
              className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 transition-colors"
              aria-hidden="true"
            />
          </Tooltip>
        </div>
      ),
      value: metrics.external,
    },
    {
      label: (
        <div className="flex items-center gap-1">
          Unique
          <Tooltip content="Unique links" side="top" align="end" delay={200}>
            <BiInfoCircle
              className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 transition-colors"
              aria-hidden="true"
            />
          </Tooltip>
        </div>
      ),
      value: metrics.unique,
    },
    {
      label: (
        <div className="flex items-center gap-1">
          NoFollow
          <Tooltip content="Links with rel='nofollow'" side="top" align="end" delay={200}>
            <BiInfoCircle
              className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 transition-colors"
              aria-hidden="true"
            />
          </Tooltip>
        </div>
      ),
      value: metrics.noFollow,
    },
    {
      label: (
        <div className="flex items-center gap-1">
          COMM.
          <Tooltip content="Email/Tel/SMS links" side="top" align="end" delay={200}>
            <BiInfoCircle
              className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 transition-colors"
              aria-hidden="true"
            />
          </Tooltip>
        </div>
      ),
      value: metrics.communication,
    },
    {
      label: (
        <div className="flex items-center gap-1">
          Broken
          <Tooltip content="Broken links" side="top" align="end" delay={200}>
            <BiInfoCircle
              className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 transition-colors"
              aria-hidden="true"
            />
          </Tooltip>
        </div>
      ),
      value: isBrokenLinksLoading ? (
        <div className="flex items-center justify-center ml-4 mt-1">
          <div className="h-4 w-4 border-2 border-gray-500/20 dark:border-gray-300/20 border-t-blue-500 dark:border-t-brand-200  rounded-full animate-spin" />
        </div>
      ) : (
        metrics.broken
      ),
    },
  ];

  return (
    <div className="flex items-center justify-center flex-shrink-0 m-0 p-0 mt-3">
      <div className="grid grid-cols-8 gap-3 px-4">
        {metricsData.map((metric, index) => (
          <MetricItem key={index} label={metric.label} value={metric.value} />
        ))}
      </div>
    </div>
  );
};

export default QuickMetrics;
