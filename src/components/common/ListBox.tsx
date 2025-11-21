import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
  Transition,
} from '@headlessui/react';
import { BiCheck, BiChevronDown } from 'react-icons/bi';
import clsx from 'clsx';
import { Fragment } from 'react';

export interface ListBoxProps<T> {
  options: readonly T[] | T[];
  value: T;
  onChange: (option: T) => void;
  className?: string;
  buttonClassName?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  size?: 'xs' | 'sm' | 'md';
}

const ListBox = <T extends { id: string | number; name: string }>({
  options,
  value,
  onChange,
  className,
  buttonClassName,
  placeholder = 'Select option',
  disabled = false,
  error,
  size = 'sm',
}: ListBoxProps<T>) => {
  const sizeClasses =
    size === 'xs' ? 'py-1 text-xs' : size === 'md' ? 'py-2 text-sm' : 'py-1.5 text-sm';

  const chevronSize = size === 'xs' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  const buttonStyles = clsx(
    'relative w-full cursor-default rounded-md pl-3 pr-8 text-left',
    sizeClasses,
    'transition-colors duration-200',
    'bg-white dark:bg-gray-800',
    'text-gray-900 dark:text-gray-100',
    'outline outline-1 -outline-offset-1',
    disabled && 'opacity-50 cursor-not-allowed',
    error ? 'outline-red-300 dark:outline-red-700' : 'outline-gray-300 dark:outline-gray-700',
    !disabled && [
      'hover:bg-gray-50 dark:hover:bg-gray-700/50',
      'focus:outline-2 focus:-outline-offset-2',
      'focus:outline-brand-500 dark:focus:outline-brand-400',
    ]
  );

  const optionsStyles = clsx(
    'absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md py-1 text-sm',
    'bg-white dark:bg-gray-800',
    'outline outline-1 outline-gray-200 dark:outline-gray-700',
    'shadow-lg'
  );

  const optionStyles = ({ active, selected }: { active: boolean; selected: boolean }) =>
    clsx(
      'relative cursor-default select-none py-1.5 pl-3 pr-9',
      'transition-colors duration-200',
      active
        ? 'bg-brand-500/10 text-brand-600 dark:bg-brand-400/10 dark:text-brand-400'
        : 'text-gray-900 dark:text-gray-100',
      selected && 'font-medium'
    );

  return (
    <div className={clsx('relative', className)}>
      <Listbox value={value} onChange={onChange} disabled={disabled}>
        <ListboxButton className={clsx(buttonStyles, buttonClassName)}>
          <span className="block truncate">{value?.name || placeholder}</span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <BiChevronDown
              className={clsx(chevronSize, 'text-gray-400 dark:text-gray-500')}
              aria-hidden="true"
            />
          </span>
        </ListboxButton>

        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <ListboxOptions className={optionsStyles}>
            {options.map((option) => (
              <ListboxOption key={option.id} className={optionStyles} value={option}>
                {({ selected, active }) => (
                  <>
                    <span
                      className={clsx('block truncate', selected ? 'font-semibold' : 'font-normal')}
                    >
                      {option.name}
                    </span>
                    {selected && (
                      <span
                        className={clsx(
                          'absolute inset-y-0 right-0 flex items-center pr-3',
                          active
                            ? 'text-brand-600 dark:text-brand-400'
                            : 'text-brand-600/70 dark:text-brand-400/70'
                        )}
                      >
                        <BiCheck className="h-4 w-4" aria-hidden="true" />
                      </span>
                    )}
                  </>
                )}
              </ListboxOption>
            ))}
          </ListboxOptions>
        </Transition>
      </Listbox>
      {error && <div className="mt-1 text-sm text-red-500 dark:text-red-400">{error}</div>}
    </div>
  );
};

export default ListBox;
