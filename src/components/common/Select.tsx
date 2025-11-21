import clsx from 'clsx';
import { BiChevronDown } from 'react-icons/bi';

export interface SelectProps<T> {
  options: readonly T[] | T[];
  value: T;
  onChange: (option: T) => void;
  className?: string;
  disabled?: boolean;
  error?: string;
  placeholder?: string;
}

const Select = <T extends { id: string | number; name: string }>({
  options,
  value,
  onChange,
  className,
  disabled = false,
  error,
  placeholder,
}: SelectProps<T>) => {
  const selectStyles = clsx(
    'block w-full rounded-md py-1.5 pl-3 pr-8 text-sm',
    'transition-colors duration-200',
    'bg-white dark:bg-gray-800',
    'text-gray-900 dark:text-gray-100',
    'outline outline-1 -outline-offset-1',
    disabled && 'opacity-50 cursor-not-allowed',
    error ? 'outline-red-300 dark:outline-red-700' : 'outline-gray-300 dark:outline-gray-700',
    !disabled && [
      'cursor-pointer',
      'hover:bg-gray-50 dark:hover:bg-gray-700/50',
      'focus:outline-2 focus:-outline-offset-2',
      'focus:outline-brand-500 dark:focus:outline-brand-400',
    ],
    'appearance-none',
    className
  );

  return (
    <div className="relative">
      <select
        value={value.id}
        onChange={(e) => {
          const option = options.find((opt) => opt.id === e.target.value);
          if (option) onChange(option);
        }}
        disabled={disabled}
        className={selectStyles}
      >
        {placeholder && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.id}
            value={option.id}
            className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            {option.name}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
        <BiChevronDown
          className={clsx(
            'h-4 w-4',
            disabled ? 'text-gray-400 dark:text-gray-600' : 'text-gray-500 dark:text-gray-400'
          )}
          aria-hidden="true"
        />
      </div>
      {error && <div className="mt-1 text-sm text-red-500 dark:text-red-400">{error}</div>}
    </div>
  );
};

export default Select;
