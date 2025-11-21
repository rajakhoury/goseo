import React, { ReactNode } from 'react';
import { BiInfoCircle } from 'react-icons/bi';
import Tooltip from '../../common/Tooltip';
import CopyButton from '../../common/CopyButton';

export interface MetaFieldProps {
  label: string | ReactNode;
  value: string;
  tooltip?: string;
  copyable?: boolean;
  className?: string;
  valueClassName?: string;
  emptyText?: string;
  compact?: boolean;
}

export const MetaField: React.FC<MetaFieldProps> = React.memo(
  ({
    label,
    value,
    tooltip,
    copyable = true,
    className = '',
    valueClassName = '',
    emptyText = 'Not specified',
    compact = false,
  }) => {
    const displayValue = value || emptyText;
    const isEmpty = !value;
    const innerPaddingClass = compact ? 'p-1' : 'p-1.5';

    return (
      <div className={`space-y-1 ${className}`}>
        <h3 className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
          {typeof label === 'string' ? label : label}
          {tooltip && (
            <Tooltip content={tooltip} side="top">
              <BiInfoCircle
                className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400 transition-colors duration-150"
                aria-hidden="true"
              />
            </Tooltip>
          )}
        </h3>

        <div
          className={`flex items-start gap-2 ${innerPaddingClass} bg-white dark:bg-gray-800 rounded transition-colors duration-150`}
        >
          <p
            className={`flex-1 pr-2 ${
              isEmpty
                ? 'text-gray-400 dark:text-gray-500 italic'
                : 'text-gray-900 dark:text-gray-100 break-all'
            } ${valueClassName}`}
            role={isEmpty ? 'status' : undefined}
          >
            {displayValue}
          </p>
          {copyable && !isEmpty && (
            <CopyButton
              className="text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-brand-400 opacity-100 transition-colors duration-150"
              text={value}
              size="sm"
            />
          )}
        </div>
      </div>
    );
  }
);

MetaField.displayName = 'MetaField';

export default MetaField;
