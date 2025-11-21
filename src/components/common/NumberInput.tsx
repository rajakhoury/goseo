import React from 'react';
import clsx from 'clsx';
import { BiX } from 'react-icons/bi';

interface NumberInputProps {
  id?: string;
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  min?: number;
  max?: number;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const NumberInput: React.FC<NumberInputProps> = ({
  id,
  label,
  value,
  onChange,
  min,
  max,
  placeholder = '0',
  disabled = false,
  className,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      onChange(null);
      return;
    }

    const num = parseInt(val, 10);
    if (isNaN(num)) return;
    if (min !== undefined && num < min) return;
    if (max !== undefined && num > max) return;
    onChange(num);
  };

  const handleClear = () => {
    onChange(null);
  };

  return (
    <div className={clsx('flex flex-col gap-1', className)}>
      <label
        htmlFor={id}
        className={clsx(
          'text-sm font-medium',
          disabled ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'
        )}
      >
        {label}
      </label>
      <div className="relative">
        <input
          type="number"
          id={id}
          value={value ?? ''}
          onChange={handleChange}
          min={min}
          max={max}
          placeholder={placeholder}
          disabled={disabled}
          className={clsx(
            'w-full rounded-md py-1.5 px-3 text-sm',
            'transition-colors',
            'placeholder:text-gray-400 dark:placeholder:text-gray-500',
            disabled
              ? 'bg-gray-50 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
              : [
                  'bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100',
                  'border border-gray-300 dark:border-gray-700',
                  'hover:border-gray-400 dark:hover:border-gray-600',
                  'focus:border-brand-500 dark:focus:border-brand-400',
                  'focus:ring-2 focus:ring-brand-500/20 dark:focus:ring-brand-400/20',
                  'focus:outline-none',
                ]
          )}
        />
        {value !== null && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className={clsx(
              'absolute right-2 top-1/2 -translate-y-1/2',
              'text-gray-400 hover:text-gray-500',
              'dark:text-gray-500 dark:hover:text-gray-400'
            )}
          >
            <BiX className="w-4 h-4" />
            <span className="sr-only">Clear</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default NumberInput;
