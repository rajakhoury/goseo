import React, { useEffect } from 'react';
import { BiDownload, BiLinkExternal } from 'react-icons/bi';
import {
  SchemaError,
  initialAnalysisState,
  AnalysisResult,
  SchemaObject,
  AnalysisResultValidator,
} from './types';
import ErrorScreen from '../common/ErrorScreen';
import SchemaCard from './SchemaCard';
import Button from '../common/Button';
import { usePageAnalysis } from '../../hooks/usePageAnalysis';
import { logger, createLoggedError } from '../../utils/logger';
import { buildExportSlug } from '../overview/utils/urlUtils';

function analyzeSchemas(): AnalysisResult {
  try {
    if (!document?.documentElement || typeof document.querySelectorAll !== 'function') {
      throw new Error('No access to document API');
    }

    const schemaScripts = document.querySelectorAll('script[type="application/ld+json"]');
    const schemas: SchemaObject[] = [];

    schemaScripts.forEach((script, index) => {
      const content = script.textContent?.trim() || '';

      if (!content) return;

      try {
        const parsed = JSON.parse(content);
        const pushObject = (obj: Record<string, unknown>, subIndex?: number) => {
          const rawType = (obj['@type'] as unknown) ?? (obj['type'] as unknown);
          let type: string | string[] | 'Unknown' = 'Unknown';
          if (Array.isArray(rawType)) {
            const types = rawType.filter((v) => typeof v === 'string') as string[];
            type = types.length ? types : 'Unknown';
          } else if (typeof rawType === 'string') {
            type = rawType;
          }
          schemas.push({
            id: subIndex == null ? `schema-${index}` : `schema-${index}-${subIndex}`,
            type,
            raw: content,
            parsed: obj,
            position: index,
          });
        };

        if (Array.isArray(parsed)) {
          parsed.forEach((item, i) => {
            if (item && typeof item === 'object') {
              pushObject(item as Record<string, unknown>, i);
            }
          });
        } else if (parsed && typeof parsed === 'object') {
          pushObject(parsed as Record<string, unknown>);
        } else {
          logger.warn('Schema', 'Script JSON is not an object or array of objects');
        }
      } catch (error) {
        logger.warn('Schema', 'Failed to parse script as JSON', error);
      }
    });

    return { schemas };
  } catch (error) {
    throw new Error(
      'Failed to analyze schemas: ' + (error instanceof Error ? error.message : String(error))
    );
  }
}

const Schema: React.FC = () => {
  const { state, analyzeCurrentPage } = usePageAnalysis<AnalysisResult, SchemaError>({
    initialState: initialAnalysisState,
    errorType: 'SCHEMA_ERROR',
    createError: (message) =>
      createLoggedError('Schema Analysis', message, (msg) => new SchemaError('SCHEMA_ERROR', msg)),
    executeScript: async (tabId) => {
      try {
        const result = await chrome.scripting.executeScript({
          target: { tabId },
          func: analyzeSchemas,
          world: 'ISOLATED',
        });

        if (!result?.[0]?.result) {
          throw new SchemaError('EXECUTION_ERROR', 'No result returned from content script');
        }
        const validator = new AnalysisResultValidator();
        const validation = validator.validate(result[0].result);
        if (!validation.success || !validation.data) {
          const violations = validation.error?.violations
            ?.map((v) => `${v.field}: ${v.message}`)
            .join(', ');
          throw new SchemaError(
            'VALIDATION_ERROR',
            'Invalid data received from content script' + (violations ? `: ${violations}` : '')
          );
        }
        return validation.data;
      } catch (error) {
        if (error instanceof SchemaError) {
          throw error;
        }
        const msg = (error as Error).message || '';
        if (msg.includes('No access to document API')) {
          throw new SchemaError('NO_DOCUMENT_ACCESS', 'No access to document API');
        }
        throw new SchemaError('SCHEMA_ERROR', 'Failed to analyze schemas: ' + msg);
      }
    },
  });

  useEffect(() => {
    if (state.status === 'idle') {
      analyzeCurrentPage();
    }
  }, [analyzeCurrentPage, state.status]);

  const handleExport = async () => {
    if (!state.result?.schemas) return;

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab.url || '';
    const slug = buildExportSlug(url);

    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0].replace(/:/g, '-');

    if (state.result.schemas.length === 1) {
      const schema = state.result.schemas[0];
      const jsonData = JSON.stringify(schema.parsed, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `schema-${slug}-${date}-${time}.json`;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } else {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      state.result.schemas.forEach((schema, index) => {
        const schemaType = Array.isArray(schema.type) ? schema.type.join('-') : schema.type;
        const filename = `schema-${index + 1}-${schemaType}.json`;
        const jsonData = JSON.stringify(schema.parsed, null, 2);
        zip.file(filename, jsonData);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const blobUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `schemas-${slug}-${date}-${time}.zip`;
      a.click();
      URL.revokeObjectURL(blobUrl);
    }
  };

  if (state.error) {
    return (
      <ErrorScreen
        title="Schema Analysis Failed"
        message={state.error.message}
        onRetry={analyzeCurrentPage}
      />
    );
  }

  if (!state.result?.schemas.length && state.status !== 'loading') {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-brand-400">
        <p className="text-sm">This page does not contain any JSON-LD structured data</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-auto p-4 bg-gray-50 dark:bg-gray-900">
        {state.status === 'loading' ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : state.result?.schemas.length ? (
          <div className="space-y-3">
            {state.result.schemas.map((schema, index) => (
              <SchemaCard key={schema.id} schema={schema} index={index} />
            ))}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="xs"
                icon={<BiLinkExternal className="h-4 w-4" />}
                onClick={() => {
                  try {
                    window.dispatchEvent(
                      new CustomEvent('navigate-tab', { detail: { tab: 'tools' } })
                    );
                  } catch {
                    void 0;
                  }
                }}
                className="!bg-gray-50 !text-gray-600 !border !border-gray-100 dark:!text-gray-400 dark:!bg-gray-800/60 dark:!border-gray-700"
              >
                Validate
              </Button>
              <Button
                variant="outline"
                size="xs"
                icon={<BiDownload className="h-4 w-4" />}
                onClick={handleExport}
                className="!bg-gray-50 !text-gray-600 !border !border-gray-100 dark:!text-gray-400 dark:!bg-gray-800/60 dark:!border-gray-700"
              >
                Download
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Schema;
