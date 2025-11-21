import React from 'react';
import {
  validateTitleLength,
  validateDescriptionLength,
  getValidationColorClass,
} from '../utils/characterValidation';

export interface CharacterCounterProps {
  text: string;
  type: 'title' | 'description';
  className?: string;
}

export const CharacterCounter: React.FC<CharacterCounterProps> = React.memo(
  ({ text, type, className = '' }) => {
    const validation = React.useMemo(
      () => (type === 'title' ? validateTitleLength(text) : validateDescriptionLength(text)),
      [text, type]
    );

    const colorClass = React.useMemo(
      () => getValidationColorClass(validation.status),
      [validation.status]
    );

    const optimalRange = type === 'title' ? '55-60' : '150-160';

    return (
      <div
        className={`flex items-center gap-2 text-xs ${className}`}
        role="status"
        aria-live="polite"
      >
        <span
          className={`font-semibold ${colorClass}`}
          aria-label={`Character count: ${validation.count}`}
        >
          {validation.count} chars
        </span>
        <span className="text-gray-400 dark:text-gray-500" aria-hidden="true">
          |
        </span>
        <span className="text-gray-500 dark:text-gray-400">Optimal: {optimalRange}</span>
        {validation.status !== 'good' && (
          <>
            <span className="text-gray-400 dark:text-gray-500" aria-hidden="true">
              |
            </span>
            <span className={`${colorClass}`} role="alert">
              {validation.message}
            </span>
          </>
        )}
      </div>
    );
  }
);

CharacterCounter.displayName = 'CharacterCounter';

export default CharacterCounter;
