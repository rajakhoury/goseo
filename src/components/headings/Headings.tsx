import { useEffect } from 'react';
import {
  AnalysisState,
  HeadingData,
  HeadingsError,
  HeadingCount,
  HeadingLevel,
  AnalysisResult,
  HeadingDataValidator,
  HeadingCountValidator,
} from './types';
import HeadingTree from './HeadingTree';
import HeadingToolbar from './HeadingToolbar';
import ErrorScreen from '../common/ErrorScreen';
import { usePageAnalysis } from '../../hooks/usePageAnalysis';
import { createLoggedError, logSystemAware } from '../../utils/logger';
import { ValidationResult } from '../../types/validation';

const initialState: AnalysisState = {
  status: 'idle',
  error: null,
  result: {
    counts: null,
    headings: [],
  },
};

const headingDataValidator = new HeadingDataValidator();
const headingCountValidator = new HeadingCountValidator();

function isValidationSuccess<T>(
  result: ValidationResult<T>
): result is ValidationResult<T> & { success: true; data: T } {
  return result.success && result.data !== undefined;
}

const analyzeHeadings = (): AnalysisResult => {
  try {
    if (!document?.documentElement || typeof document.querySelectorAll !== 'function') {
      throw new HeadingsError('NO_DOCUMENT_ACCESS', 'No access to document API');
    }

    const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');

    const counts: HeadingCount = {
      h1: document.querySelectorAll('h1').length,
      h2: document.querySelectorAll('h2').length,
      h3: document.querySelectorAll('h3').length,
      h4: document.querySelectorAll('h4').length,
      h5: document.querySelectorAll('h5').length,
      h6: document.querySelectorAll('h6').length,
    };

    const validHeadings = Array.from(headingElements)
      .map((element, index) => {
        if (!(element instanceof HTMLHeadingElement)) {
          return null;
        }
        const text = element.textContent?.trim() || '';
        const level = parseInt(element.tagName.charAt(1)) as HeadingLevel;
        if (isNaN(level) || level < 1 || level > 6) {
          return null;
        }

        let domId = element.id;
        if (!domId || document.querySelectorAll(`#${CSS.escape(domId)}`).length > 1) {
          const safeText = text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .substring(0, 50);
          domId = `heading-${safeText}-${index}-${Date.now()}`;

          try {
            element.id = domId;
          } catch {
            domId = `heading-${index}-${Date.now()}`;
            element.id = domId;
          }
        }

        return {
          text,
          level,
          index,
          domId,
        };
      })
      .filter((heading): heading is HeadingData => heading !== null);

    return { counts, headings: validHeadings };
  } catch (error) {
    if (error instanceof HeadingsError) {
      throw error;
    }
    throw new HeadingsError(
      'HEADING_ANALYSIS_ERROR',
      'Failed to analyze headings: ' + (error instanceof Error ? error.message : String(error))
    );
  }
};

export default function Headings() {
  const { state, analyzeCurrentPage } = usePageAnalysis<AnalysisResult, HeadingsError>({
    initialState,
    errorType: 'HEADING_ANALYSIS_ERROR',
    createError: (message) =>
      createLoggedError(
        'Headings Analysis',
        message,
        (msg) => new HeadingsError('HEADING_ANALYSIS_ERROR', msg)
      ),
    executeScript: async (tabId) => {
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId },
          world: 'ISOLATED',
          func: analyzeHeadings,
        });

        if (!results?.[0]?.result) {
          throw new HeadingsError('HEADING_ANALYSIS_ERROR', 'Failed to analyze headings');
        }

        const result = results[0].result;

        const countsValidation = headingCountValidator.validate(result.counts);
        if (!isValidationSuccess(countsValidation)) {
          throw new HeadingsError(
            'HEADING_VALIDATION_ERROR',
            'Invalid heading counts: ' + countsValidation.error?.message
          );
        }

        for (const heading of result.headings) {
          const validation = headingDataValidator.validate(heading);
          if (!isValidationSuccess(validation)) {
            throw new HeadingsError(
              'HEADING_VALIDATION_ERROR',
              'Invalid heading data: ' + validation.error?.message
            );
          }
        }

        return result;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logSystemAware('Headings Analysis', `Execution error: ${msg}`);
        throw error;
      }
    },
  });

  useEffect(() => {
    if (state.status === 'idle') {
      analyzeCurrentPage();
    }
  }, [analyzeCurrentPage, state.status]);

  if (state.error) {
    return (
      <ErrorScreen
        title="Headings Analysis Failed"
        message={state.error.message}
        onRetry={analyzeCurrentPage}
      />
    );
  }

  if (!state.result?.headings.length && state.status !== 'loading') {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-brand-400">
        <p className="text-sm">No headings found on this page</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full select-none">
      <HeadingToolbar
        headings={state.result?.headings || []}
        loading={state.status === 'loading'}
        headingCounts={state.result?.counts || null}
      />
      <HeadingTree
        headings={state.result?.headings || []}
        loading={state.status === 'loading'}
        headingCounts={state.result?.counts || null}
      />
    </div>
  );
}
