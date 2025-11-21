import React, { ReactNode } from 'react';
import { BiInfoCircle } from 'react-icons/bi';
import Tooltip from '../../common/Tooltip';

export interface Metric {
  label: string | ReactNode;
  value: number | string;
  tooltip?: string;
  variant?: 'default' | 'success' | 'warning' | 'error';
}

export interface StructureMetricsProps {
  metrics: Metric[];
  className?: string;
}

export const StructureMetrics: React.FC<StructureMetricsProps> = React.memo(
  ({ metrics, className = '' }) => {
    const getVariantClasses = React.useCallback((variant?: string) => {
      switch (variant) {
        case 'success':
          return 'bg-green-50 dark:bg-gray-800/40 border-green-200 dark:border-gray-700';
        case 'warning':
          return 'bg-yellow-50 dark:bg-gray-800/40 border-yellow-200 dark:border-gray-700';
        case 'error':
          return 'bg-red-50 dark:bg-gray-800/40 border-red-200 dark:border-gray-700';
        default:
          return 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700';
      }
    }, []);

    const getValueColorClass = React.useCallback((variant?: string) => {
      switch (variant) {
        case 'success':
          return 'text-emerald-700 dark:text-emerald-300';
        case 'warning':
          return 'text-amber-700 dark:text-amber-300';
        case 'error':
          return 'text-rose-700 dark:text-rose-300';
        default:
          return 'text-gray-900 dark:text-gray-100';
      }
    }, []);

    return (
      <div className={`grid gap-2 ${className}`} role="region" aria-label="Page structure metrics">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className={`rounded-md p-1.5 border transition-all duration-200 ${getVariantClasses(metric.variant)}`}
            role="status"
            aria-label={`${metric.label}: ${metric.value}`}
          >
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-1">
              {typeof metric.label === 'string' ? (
                <span className="truncate">{metric.label}</span>
              ) : (
                metric.label
              )}
              {metric.tooltip && (
                <Tooltip content={metric.tooltip} side="top" align="center">
                  <BiInfoCircle
                    className="h-3 w-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400 flex-shrink-0 transition-colors duration-150"
                    aria-hidden="true"
                  />
                </Tooltip>
              )}
            </div>
            <div className={`text-sm font-semibold ${getValueColorClass(metric.variant)}`}>
              {metric.value}
            </div>
          </div>
        ))}
      </div>
    );
  }
);

StructureMetrics.displayName = 'StructureMetrics';

export default StructureMetrics;
