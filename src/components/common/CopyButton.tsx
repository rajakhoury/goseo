import React, { ButtonHTMLAttributes, useEffect, useRef, useState } from 'react';
import { BiClipboard } from 'react-icons/bi';
import clsx from 'clsx';

interface CopyButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  text: string;
  size?: 'sm' | 'md' | 'lg';
  showOnHover?: boolean;
  className?: string;
}

const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  size = 'md',
  showOnHover = true,
  className,
  ...props
}) => {
  const [showCopied, setShowCopied] = useState(false);
  const [placement, setPlacement] = useState<'top' | 'bottom'>('top');
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const handleCopy = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  useEffect(() => {
    if (!showCopied) return;
    const el = containerRef.current;
    if (!el) return;
    const root = el.closest('[data-scroll-container]') as HTMLElement | null;
    const boundaryTop = root ? root.getBoundingClientRect().top : 0;
    const btnRect = el.getBoundingClientRect();
    const bubbleHeight = tooltipRef.current?.offsetHeight || 20;
    const margin = 6;
    if (btnRect.top - bubbleHeight - margin < boundaryTop) {
      setPlacement('bottom');
    } else {
      setPlacement('top');
    }
  }, [showCopied]);

  const sizeClasses = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={handleCopy}
        className={clsx(
          showOnHover && 'transition-all duration-300 opacity-0 group-hover/item:opacity-100',
          className
        )}
        {...props}
      >
        <BiClipboard className={sizeClasses[size]} />
      </button>
      {showCopied && (
        <div
          ref={tooltipRef}
          className={
            placement === 'top'
              ? 'absolute bottom-full right-0 mb-1 px-2 py-1 text-xs font-medium text-white bg-gray-800 dark:bg-brand-500 rounded shadow-sm z-50 pointer-events-none'
              : 'absolute top-full right-0 mt-1 px-2 py-1 text-xs font-medium text-white bg-gray-800 dark:bg-brand-500 rounded shadow-sm z-50 pointer-events-none'
          }
        >
          Copied!
        </div>
      )}
    </div>
  );
};

export default CopyButton;
