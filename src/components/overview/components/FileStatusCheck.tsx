import React, { useState, useEffect } from 'react';
import { BiCheckCircle, BiXCircle, BiError, BiLinkExternal } from 'react-icons/bi';

export type FileStatus = 'checking' | 'available' | 'missing' | 'error';

export interface FileStatusCheckProps {
  url: string;
  type: 'robots.txt' | 'sitemap.xml' | 'ai.txt' | 'llms.txt';
  onStatusChange?: (status: FileStatus) => void;
}

export const FileStatusCheck: React.FC<FileStatusCheckProps> = ({ url, type, onStatusChange }) => {
  const [status, setStatus] = useState<FileStatus>('checking');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let mounted = true;

    const checkFile = async () => {
      if (!url) {
        if (mounted) {
          setStatus('error');
          setError('Invalid URL');
          onStatusChange?.('error');
        }
        return;
      }

      let resolved = false;

      try {
        const headResponse = await fetch(url, {
          method: 'HEAD',
          cache: 'no-cache',
        });

        if (mounted) {
          if (headResponse.ok) {
            setStatus('available');
            onStatusChange?.('available');
            resolved = true;
          } else if (headResponse.status === 404) {
            setStatus('missing');
            setError('File not found (404)');
            onStatusChange?.('missing');
            resolved = true;
          }
        }
      } catch {
        void 0;
      }

      if (mounted && !resolved) {
        try {
          const getResponse = await fetch(url, {
            method: 'GET',
            cache: 'no-cache',
          });

          if (getResponse.ok) {
            setStatus('available');
            onStatusChange?.('available');
          } else if (getResponse.status === 404) {
            setStatus('missing');
            setError('File not found (404)');
            onStatusChange?.('missing');
          } else {
            setStatus('error');
            setError(`HTTP ${getResponse.status}`);
            onStatusChange?.('error');
          }
        } catch {
          setStatus('error');
          setError('Cannot check (CORS or network issue)');
          onStatusChange?.('error');
        }
      }
    };

    checkFile();

    return () => {
      mounted = false;
    };
  }, [url, onStatusChange]);

  const handleOpenFile = () => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'available':
        return <BiCheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />;
      case 'missing':
        return <BiXCircle className="w-4 h-4 text-red-600 dark:text-red-400" />;
      case 'error':
        return <BiError className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />;
      case 'checking':
        return (
          <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 border-t-blue-500 dark:border-t-brand-400 rounded-full animate-spin" />
        );
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'missing':
        return 'Not Found';
      case 'error':
        return error || 'Error';
      case 'checking':
        return 'Checking...';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'available':
        return 'text-green-700 dark:text-green-300';
      case 'missing':
        return 'text-red-700 dark:text-red-300';
      case 'error':
        return 'text-yellow-700 dark:text-yellow-300';
      case 'checking':
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div
      className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border border-gray-100 dark:border-gray-700 transition-all duration-200"
      role="status"
      aria-label={`${type} status: ${getStatusText()}`}
    >
      <div className="flex items-center gap-2 flex-1">
        {getStatusIcon()}
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{type}</p>
          <p className={`text-xs ${getStatusColor()}`}>{getStatusText()}</p>
        </div>
      </div>

      {(status === 'available' || status === 'error') && (
        <button
          onClick={handleOpenFile}
          className="p-1.5 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-brand-400 transition-colors duration-150"
          title="Open in new tab"
          aria-label={`Open ${type} in new tab`}
        >
          <BiLinkExternal className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

FileStatusCheck.displayName = 'FileStatusCheck';

export default React.memo(FileStatusCheck);
