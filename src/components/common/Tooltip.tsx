import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  side?: 'top' | 'bottom';
  align?: 'center' | 'start' | 'end';
  maxWidth?: string;
  delay?: number;
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  className,
  side = 'top',
  align = 'center',
  maxWidth = '200px',
  delay = 0,
}) => {
  const [show, setShow] = useState(false);
  const [position, setPosition] = useState<'center' | 'start' | 'end'>(align);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (show && tooltipRef.current && containerRef.current) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;

      if (tooltipRect.right > viewportWidth - 8) {
        setPosition('end');
      } else if (tooltipRect.left < 8) {
        setPosition('start');
      } else {
        setPosition(align);
      }
    }
  }, [show, align]);

  const handleMouseEnter = () => {
    if (delay) {
      timeoutRef.current = setTimeout(() => setShow(true), delay);
    } else {
      setShow(true);
    }
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setShow(false);
  };

  const tooltipStyles = clsx(
    'fixed z-50 px-2 py-1.5',
    'text-xs',
    'bg-gray-900 dark:bg-gray-800',
    'text-white dark:text-gray-100',
    'rounded shadow-lg',
    'transition-opacity duration-150',
    'whitespace-normal',
    className
  );

  return (
    <div
      ref={containerRef}
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-describedby="tooltip-content"
    >
      {children}
      {show && (
        <div
          id="tooltip-content"
          ref={tooltipRef}
          className={tooltipStyles}
          role="tooltip"
          aria-live="polite"
          style={{
            maxWidth,
            top: containerRef.current
              ? side === 'top'
                ? containerRef.current.getBoundingClientRect().top - 8
                : containerRef.current.getBoundingClientRect().bottom + 8
              : 0,
            left:
              position === 'end'
                ? 'auto'
                : containerRef.current
                  ? containerRef.current.getBoundingClientRect().left +
                    (position === 'center' ? containerRef.current.offsetWidth / 2 : 0)
                  : 0,
            right:
              position === 'end' && containerRef.current
                ? window.innerWidth - containerRef.current.getBoundingClientRect().right
                : 'auto',
            transform: position === 'center' ? 'translateX(-50%)' : 'none',
          }}
        >
          {typeof content === 'string' ? <span className="sr-only">Tooltip:</span> : null}
          {content}
        </div>
      )}
    </div>
  );
};

export default Tooltip;
