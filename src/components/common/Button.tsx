import React from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  loading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  fullWidth = false,
  loading = false,
  className,
  disabled,
  ...props
}) => {
  const baseStyles = clsx(
    'inline-flex items-center justify-center font-medium rounded-md',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'dark:focus:ring-offset-gray-800',
    'transition-colors duration-200',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    fullWidth && 'w-full'
  );

  const variants = {
    primary: clsx(
      'bg-brand-600 text-white',
      'hover:bg-brand-700',
      'focus:ring-brand-500',
      'dark:bg-brand-500 dark:hover:bg-brand-600'
    ),
    secondary: clsx(
      'bg-brand-50 text-brand-700',
      'hover:bg-brand-100',
      'focus:ring-brand-500',
      'dark:bg-brand-900/30 dark:text-brand-400',
      'dark:hover:bg-brand-900/50'
    ),
    ghost: clsx(
      'text-brand-600',
      'hover:bg-brand-50',
      'focus:ring-brand-500',
      'dark:text-brand-400',
      'dark:hover:bg-brand-900/30'
    ),
    outline: clsx(
      'border border-gray-300 bg-white text-gray-700',
      'hover:bg-gray-50',
      'focus:ring-brand-500',
      'dark:border-gray-600 dark:bg-gray-800',
      'dark:text-gray-300 dark:hover:bg-gray-700'
    ),
  };

  const sizes = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const iconSpacing =
    icon &&
    {
      xs: 'gap-1',
      sm: 'gap-1.5',
      md: 'gap-2',
      lg: 'gap-2',
    }[size];

  const iconStyles = clsx(
    icon && iconSpacing,
    icon && iconPosition === 'right' && 'flex-row-reverse'
  );

  return (
    <button
      className={clsx(baseStyles, variants[variant], sizes[size], iconStyles, className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
};

export default Button;
