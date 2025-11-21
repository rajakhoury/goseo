import { useState, useCallback, useRef, useEffect } from 'react';
import { RuntimeError } from '../types/errors';

export type AnalysisStatus = 'idle' | 'loading' | 'loading-sizes' | 'success' | 'error';

export interface BaseError extends RuntimeError {
  type: 'runtime';
  code: string;
  message: string;
  stack?: string;
}

export interface AnalysisState<TResult, TError extends BaseError> {
  status: AnalysisStatus;
  error: TError | null;
  result: TResult | null;
}

interface UsePageAnalysisOptions<TResult, TError extends BaseError> {
  initialState?: AnalysisState<TResult, TError>;
  errorType: string;
  createError: (message: string) => TError;
  executeScript: (tabId: number) => Promise<TResult>;
  onError?: (error: TError) => void;
  onSuccess?: (result: TResult) => void;
  maxRetries?: number;
  retryDelay?: number;
  postProcess?: (result: TResult, setStatus: (status: AnalysisStatus) => void) => Promise<TResult>;
}

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY = 1000;

export function usePageAnalysis<TResult, TError extends BaseError>({
  initialState = { status: 'idle', error: null, result: null },
  createError,
  executeScript,
  onError,
  onSuccess,
  maxRetries = DEFAULT_MAX_RETRIES,
  retryDelay = DEFAULT_RETRY_DELAY,
  postProcess,
}: UsePageAnalysisOptions<TResult, TError>) {
  const [state, setState] = useState<AnalysisState<TResult, TError>>(initialState);
  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);
  const analysisInProgressRef = useRef(false);

  const safeSetState = useCallback(
    (update: (prev: AnalysisState<TResult, TError>) => AnalysisState<TResult, TError>) => {
      if (mountedRef.current) {
        setState(update);
      }
    },
    []
  );

  const handleError = useCallback(
    (customError: TError) => {
      if (!mountedRef.current) return;
      safeSetState((prev) => ({
        ...prev,
        status: 'error',
        error: customError,
        result: prev.result,
      }));
      onError?.(customError);
    },
    [onError, safeSetState]
  );

  const executeWithRetry = useCallback(
    async <TOk>(
      operation: () => Promise<TOk>,
      signal: AbortSignal,
      retries = maxRetries
    ): Promise<TOk> => {
      try {
        if (signal.aborted) throw new Error('Operation aborted');
        return await operation();
      } catch (error) {
        if (signal.aborted) throw new Error('Operation aborted');
        if (retries > 0 && error instanceof Error) {
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(resolve, retryDelay);
            signal.addEventListener('abort', () => {
              clearTimeout(timeout);
              reject(new Error('Operation aborted'));
            });
          });
          return executeWithRetry(operation, signal, retries - 1);
        }
        throw error;
      }
    },
    [maxRetries, retryDelay]
  );

  const analyzeCurrentPage = useCallback(async () => {
    if (!mountedRef.current || analysisInProgressRef.current) return;

    analysisInProgressRef.current = true;

    try {
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();
      const { signal } = abortControllerRef.current;

      safeSetState((prev) => ({ ...prev, status: 'loading', error: null }));

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (signal.aborted || !mountedRef.current) return;

      if (!tab?.id) {
        throw new Error('No active tab found');
      }

      if (
        !tab.url ||
        tab.url.startsWith('chrome://') ||
        tab.url.startsWith('edge://') ||
        tab.url.startsWith('about:')
      ) {
        throw new Error(
          'Browser system pages cannot be analyzed. Please try on a regular webpage.'
        );
      }

      const result = await executeWithRetry(() => executeScript(tab.id!), signal);

      if (signal.aborted || !mountedRef.current) return;

      let finalResult = result;
      if (postProcess) {
        safeSetState((prev) => ({ ...prev, status: 'loading-sizes', error: null }));
        finalResult = await postProcess(result, (status) => {
          safeSetState((prev) => ({ ...prev, status }));
        });
      }

      safeSetState((prev) => ({
        ...prev,
        status: 'success',
        error: null,
        result: finalResult,
      }));

      if (mountedRef.current) {
        onSuccess?.(finalResult);
      }
    } catch (error) {
      if (mountedRef.current && !abortControllerRef.current?.signal.aborted) {
        const customError = createError(error instanceof Error ? error.message : String(error));
        handleError(customError as TError);
      }
    } finally {
      analysisInProgressRef.current = false;
    }
  }, [executeScript, executeWithRetry, handleError, onSuccess, safeSetState, createError]);

  const resetState = useCallback(() => {
    if (!mountedRef.current) return;
    abortControllerRef.current?.abort();
    analysisInProgressRef.current = false;
    safeSetState(() => ({ ...initialState }));
  }, [safeSetState, initialState]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortControllerRef.current?.abort();
      analysisInProgressRef.current = false;
    };
  }, []);

  return {
    state,
    analyzeCurrentPage,
    resetState,
  } as const;
}
