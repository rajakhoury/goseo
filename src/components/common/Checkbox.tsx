import React from 'react';
import clsx from 'clsx';

interface CheckboxProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  id = undefined,
  className = '',
}) => {
  const checkboxId = id || label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={clsx('relative flex items-start', className)}>
      <div className="flex h-5 items-center">
        <input
          type="checkbox"
          id={checkboxId}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className={clsx(
            'form-checkbox h-4 w-4 rounded',
            'border-gray-300 dark:border-gray-600',
            'text-brand-600 dark:text-brand-500',
            'bg-white dark:bg-gray-800',
            'focus:ring-2 focus:ring-brand-500/20 focus:ring-offset-white',
            'dark:focus:ring-brand-400/20 dark:focus:ring-offset-gray-900',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-colors duration-200'
          )}
          aria-describedby={description ? `${checkboxId}-description` : undefined}
        />
      </div>
      <div className="ml-2 text-sm">
        <label
          htmlFor={checkboxId}
          className={clsx(
            'font-medium text-gray-700 dark:text-gray-200',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {label}
        </label>
        {description && (
          <p
            id={`${checkboxId}-description`}
            className={clsx('text-gray-500 dark:text-gray-400', disabled && 'opacity-50')}
          >
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

export default Checkbox;
