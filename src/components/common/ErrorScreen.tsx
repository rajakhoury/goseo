import React from 'react';
import { BiError } from 'react-icons/bi';
import Button from './Button';

interface ErrorScreenProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

const ErrorScreen: React.FC<ErrorScreenProps> = ({
  title = 'Analysis Failed',
  message,
  onRetry,
}) => {
  return (
    <div className="p-4">
      <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <BiError className="mx-auto h-12 w-12 text-red-600 dark:text-red-400" />
        <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{message}</p>
        {onRetry && (
          <div className="mt-4">
            <Button variant="primary" size="sm" onClick={onRetry}>
              Try Again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorScreen;
