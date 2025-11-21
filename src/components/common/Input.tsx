import React, { InputHTMLAttributes, ChangeEvent } from 'react';
import clsx from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  icon?: React.ReactNode;
  prefix?: string;
  wrapperClassName?: string;
  enforcePositiveInteger?: boolean;
}

const Input: React.FC<InputProps> = ({
  className,
  error,
  icon,
  prefix,
  wrapperClassName,
  enforcePositiveInteger,
  onChange,
  ...props
}) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (enforcePositiveInteger) {
      const value = e.target.value;
      if (!/^[1-9][0-9]*$/.test(value) && value !== '') {
        return;
      }
    }
    onChange?.(e);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (enforcePositiveInteger) {
      const pastedText = e.clipboardData.getData('text');
      if (!/^[1-9][0-9]*$/.test(pastedText)) {
        e.preventDefault();
      }
    }
  };

  const inputStyles = clsx(
    'block w-full min-w-0 py-1.5 text-sm',
    'text-gray-900 dark:text-gray-100',
    'placeholder:text-gray-400 dark:placeholder:text-gray-500',
    'bg-white dark:bg-gray-800',
    'focus:outline focus:outline-0',
    {
      'pl-[60px] pr-3': prefix,
      'pl-10 pr-3': icon && !prefix,
      'px-3': !icon && !prefix,
    },
    className
  );

  const wrapperStyles = clsx(
    'relative',
    'rounded-md',
    'outline outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-700',
    'has-[input:focus-within]:outline-2 has-[input:focus-within]:-outline-offset-2',
    'has-[input:focus-within]:outline-brand-500 dark:has-[input:focus-within]:outline-brand-400',
    {
      'outline-red-300 dark:outline-red-700': error,
    },
    wrapperClassName
  );

  return (
    <div>
      <div className={wrapperStyles}>
        {icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 dark:text-gray-500">
            {icon}
          </div>
        )}
        {prefix && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="text-sm text-gray-500 dark:text-gray-400 w-[45px]">{prefix}</span>
          </div>
        )}
        <input className={inputStyles} onChange={handleChange} onPaste={handlePaste} {...props} />
      </div>
      {error && <div className="mt-1 text-sm text-red-500 dark:text-red-400">{error}</div>}
    </div>
  );
};

export default Input;
