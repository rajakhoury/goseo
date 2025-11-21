import React, { ReactNode } from 'react';
import { BiInfoCircle } from 'react-icons/bi';
import Tooltip from '../../common/Tooltip';

export interface CountBadgeProps {
  label: string | ReactNode;
  count: number | string;
  tooltip?: string;
  className?: string;
  variant?: 'default' | 'success' | 'warning' | 'error';
}

export const CountBadge: React.FC<CountBadgeProps> = React.memo(
  ({ label, count, tooltip, className = '', variant = 'default' }) => {
    const variantClasses = React.useMemo(() => {
      switch (variant) {
        case 'success':
          return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
        case 'warning':
          return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
        case 'error':
          return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
        default:
          return 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700';
      }
    }, [variant]);

    const countColorClass = React.useMemo(() => {
      switch (variant) {
        case 'success':
          return 'text-green-700 dark:text-green-300';
        case 'warning':
          return 'text-yellow-700 dark:text-yellow-300';
        case 'error':
          return 'text-red-700 dark:text-red-300';
        default:
          return 'text-gray-900 dark:text-gray-100';
      }
    }, [variant]);

    return (
      <div
        className={`rounded-md p-2 border transition-all duration-200 ${variantClasses} ${className}`}
        role="status"
        aria-label={`${label}: ${count}`}
      >
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
          {typeof label === 'string' ? label : label}
          {tooltip && (
            <Tooltip content={tooltip} side="top" align="center">
              <BiInfoCircle
                className="h-3 w-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400 transition-colors duration-150"
                aria-hidden="true"
              />
            </Tooltip>
          )}
        </div>
        <div className={`mt-1 text-sm font-semibold ${countColorClass}`}>{count}</div>
      </div>
    );
  }
);

CountBadge.displayName = 'CountBadge';

export default CountBadge;
