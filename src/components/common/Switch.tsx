import React from 'react';
import clsx from 'clsx';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  description?: React.ReactNode;
  labelPosition?: 'left' | 'right';
  icon?: {
    checked?: React.ReactNode;
    unchecked?: React.ReactNode;
  };
  disabled?: boolean;
  srText?: string;
  className?: string;
}

const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  label,
  description,
  labelPosition = 'left',
  icon,
  disabled = false,
  srText,
  className,
}) => {
  const switchStyles = clsx(
    'group relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full',
    'border-2 border-transparent',
    'transition-colors duration-200 ease-in-out',
    'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-brand-400 dark:focus:ring-offset-gray-900',
    checked ? 'bg-brand-600 dark:bg-brand-500' : 'bg-gray-200 dark:bg-gray-700',
    disabled && 'opacity-50 cursor-not-allowed',
    className
  );

  const thumbStyles = clsx(
    'pointer-events-none relative inline-block h-5 w-5',
    'transform rounded-full bg-white shadow ring-0',
    'transition duration-200 ease-in-out',
    checked ? 'translate-x-5' : 'translate-x-0'
  );

  const labelStyles = clsx(
    'text-sm font-medium text-gray-900 dark:text-gray-100',
    disabled && 'text-gray-500 dark:text-gray-400'
  );

  const descriptionStyles = clsx(
    'text-sm text-gray-500 dark:text-gray-400',
    disabled && 'text-gray-400 dark:text-gray-500'
  );

  const containerStyles = clsx(
    'flex items-center',
    labelPosition === 'left' && 'justify-between',
    description && labelPosition === 'left' && 'items-start'
  );

  const renderLabel = () => {
    if (!label) return null;

    return (
      <span className={clsx('flex flex-col', labelPosition === 'left' && 'flex-grow')}>
        <span className={labelStyles}>{label}</span>
        {description && <span className={clsx(descriptionStyles, 'mt-0.5')}>{description}</span>}
      </span>
    );
  };

  const renderSwitch = () => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={switchStyles}
    >
      {srText && <span className="sr-only">{srText}</span>}
      <span className={thumbStyles}>
        {icon && (
          <>
            <span
              className={clsx(
                'absolute inset-0 flex h-full w-full items-center justify-center',
                'transition-opacity duration-200 ease-in',
                checked ? 'opacity-0' : 'opacity-100'
              )}
            >
              {icon.unchecked}
            </span>
            <span
              className={clsx(
                'absolute inset-0 flex h-full w-full items-center justify-center',
                'transition-opacity duration-200 ease-in',
                checked ? 'opacity-100' : 'opacity-0'
              )}
            >
              {icon.checked}
            </span>
          </>
        )}
      </span>
    </button>
  );

  return (
    <div className={containerStyles}>
      {labelPosition === 'left' && renderLabel()}
      {renderSwitch()}
      {labelPosition === 'right' && <div className="ml-3">{renderLabel()}</div>}
    </div>
  );
};

export default Switch;
