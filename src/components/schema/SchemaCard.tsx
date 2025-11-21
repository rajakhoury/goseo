import React, { useState } from 'react';
import { BiChevronDown, BiChevronRight } from 'react-icons/bi';
import { SchemaObject } from './types';
import CopyButton from '../common/CopyButton';

const MAX_DEPTH = 20;

const getTypeFromObject = (value: unknown): string | null => {
  if (!value || typeof value !== 'object') return null;
  const obj = value as Record<string, unknown>;
  const raw = (obj['@type'] as unknown) ?? (obj['type'] as unknown);
  if (Array.isArray(raw)) {
    const types = raw.filter((v) => typeof v === 'string') as string[];
    return types.length ? types[0] : null;
  }
  return typeof raw === 'string' ? raw : null;
};

interface SchemaCardProps {
  schema: SchemaObject;
  index: number;
}

interface JsonNodeProps {
  data: unknown;
  name?: string;
  depth?: number;
}

const JsonNode: React.FC<JsonNodeProps> = ({ data, name, depth = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(depth < 2);
  if (depth > MAX_DEPTH) {
    return <span className="text-gray-500 dark:text-gray-400">[Too deep]</span>;
  }

  if (data === null) {
    return (
      <div className="flex">
        {name && <span className="text-orange-600 dark:text-orange-400 font-medium">{name}: </span>}
        <span className="text-gray-400 dark:text-gray-500">null</span>
      </div>
    );
  }

  if (data === undefined) {
    return (
      <div className="flex">
        {name && <span className="text-orange-600 dark:text-orange-400 font-medium">{name}: </span>}
        <span className="text-gray-400 dark:text-gray-500">undefined</span>
      </div>
    );
  }

  if (typeof data === 'boolean') {
    return (
      <div className="flex">
        {name && <span className="text-orange-600 dark:text-orange-400 font-medium">{name}: </span>}
        <span className="text-purple-600 dark:text-purple-400">{String(data)}</span>
      </div>
    );
  }

  if (typeof data === 'number') {
    return (
      <div className="flex">
        {name && <span className="text-orange-600 dark:text-orange-400 font-medium">{name}: </span>}
        <span className="text-blue-600 dark:text-blue-400">{data}</span>
      </div>
    );
  }

  if (typeof data === 'string') {
    const isUrl = /^https?:\/\//i.test(data);
    return (
      <div className="flex flex-wrap">
        {name && (
          <span className="text-orange-600 dark:text-orange-400 font-medium mr-1">{name}: </span>
        )}
        {isUrl ? (
          <a
            href={data}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-600 dark:text-brand-400 hover:underline break-all"
          >
            &quot;{data}&quot;
          </a>
        ) : (
          <span className="text-green-600 dark:text-green-400 break-all">&quot;{data}&quot;</span>
        )}
      </div>
    );
  }

  if (Array.isArray(data)) {
    const arr = data as unknown[];
    if (arr.length === 0) {
      return (
        <div className="flex">
          {name && (
            <span className="text-orange-600 dark:text-orange-400 font-medium">{name}: </span>
          )}
          <span className="text-gray-500 dark:text-gray-400">[]</span>
        </div>
      );
    }

    return (
      <div>
        <div
          className="flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 -mx-1 px-1 rounded"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <BiChevronDown className="h-3 w-3 text-gray-500 dark:text-gray-400 flex-shrink-0 mr-1" />
          ) : (
            <BiChevronRight className="h-3 w-3 text-gray-500 dark:text-gray-400 flex-shrink-0 mr-1" />
          )}
          {name && (
            <span className="text-orange-600 dark:text-orange-400 font-medium">{name}: </span>
          )}
          <span className="text-gray-500 dark:text-gray-400 text-xs ml-1">[{arr.length}]</span>
        </div>
        {isExpanded && (
          <div className="ml-4 border-l border-gray-300 dark:border-gray-700 pl-2 mt-1">
            {arr.map((item, i) => {
              const itemType = getTypeFromObject(item);
              const displayName = itemType ? `[${itemType}]` : `[${i}]`;
              return (
                <div key={i} className="mb-1">
                  <JsonNode data={item} name={displayName} depth={depth + 1} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    const entries = Object.entries(obj);
    const summary = (() => {
      const t = getTypeFromObject(obj);
      return t;
    })();
    if (entries.length === 0) {
      return (
        <div className="flex">
          {name && (
            <span className="text-orange-600 dark:text-orange-400 font-medium">{name}: </span>
          )}
          <span className="text-gray-500 dark:text-gray-400">{'{}'}</span>
        </div>
      );
    }

    return (
      <div>
        <div
          className="flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 -mx-1 px-1 rounded"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <BiChevronDown className="h-3 w-3 text-gray-500 dark:text-gray-400 flex-shrink-0 mr-1" />
          ) : (
            <BiChevronRight className="h-3 w-3 text-gray-500 dark:text-gray-400 flex-shrink-0 mr-1" />
          )}
          {name && (
            <span className="text-orange-600 dark:text-orange-400 font-medium">{name}: </span>
          )}
          <span className="text-gray-500 dark:text-gray-400 text-xs ml-1">{`{${entries.length}}`}</span>
          {(() => {
            const bracketMatch = name?.match(/^\[([^\]]+)\]$/);
            const bracketType = bracketMatch ? bracketMatch[1] : null;
            const shouldShowSummary = summary && (!bracketType || summary !== bracketType);
            return shouldShowSummary ? (
              <span className="text-gray-500 dark:text-gray-400 text-[11px] ml-2 truncate">
                {summary}
              </span>
            ) : null;
          })()}
        </div>
        {isExpanded && (
          <div className="ml-4 border-l border-gray-300 dark:border-gray-700 pl-2 mt-1">
            {entries.map(([key, val]) => (
              <div key={key} className="mb-1">
                <JsonNode data={val} name={key} depth={depth + 1} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return <span>{String(data)}</span>;
};

const SchemaCard: React.FC<SchemaCardProps> = ({ schema, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getSchemaTypeDisplay = (): string => {
    if (Array.isArray(schema.type)) {
      return schema.type.join(', ');
    }
    return schema.type || 'Unknown';
  };

  return (
    <div className="group/item bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isExpanded ? (
            <BiChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
          ) : (
            <BiChevronRight className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
          )}

          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
              {getSchemaTypeDisplay()}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Schema #{index + 1}</p>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-900 relative">
          <div className="font-mono text-xs">
            <JsonNode data={schema.parsed} />
          </div>
          <div className="absolute top-2 right-2">
            <CopyButton
              text={schema.raw}
              size="md"
              showOnHover={true}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              title="Copy schema"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SchemaCard;
