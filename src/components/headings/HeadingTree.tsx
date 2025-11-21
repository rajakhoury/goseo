import React, { useState, useCallback, useEffect } from 'react';
import { HeadingTreeProps, HeadingNodeProps } from './types';
import { BiChevronRight, BiChevronDown } from 'react-icons/bi';
import CopyButton from '../common/CopyButton';
import { logger } from '../../utils/logger';

const STYLES = {
  headingLevel: {
    1: 'text-sm font-medium text-gray-900 dark:text-gray-100',
    2: 'text-sm text-gray-800 dark:text-gray-200',
    3: 'text-xs text-gray-600 dark:text-gray-300/90',
    4: 'text-xs text-gray-600 dark:text-gray-300/80',
    5: 'text-xs text-gray-600 dark:text-gray-300/80',
    6: 'text-xs text-gray-600 dark:text-gray-300/80',
  },
  button: {
    base: 'relative flex items-center gap-1.5 w-full text-left px-2 py-px rounded focus:outline-none focus-visible:outline-none',
    interactive: 'hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer',
    static: 'cursor-default',
  },
  icon: {
    wrapper: 'text-gray-400 dark:text-gray-500 flex-shrink-0',
    size: 'h-3.5 w-3.5',
  },
  tagBase:
    'flex-shrink-0 inline-flex items-center justify-center text-xs font-medium px-1 py-0.5 min-w-[1.5rem]',
  tagByLevel: {
    1: 'bg-gray-100 text-gray-700 dark:bg-gray-700/20 dark:text-gray-100',
    2: 'bg-gray-100 text-gray-700 dark:bg-gray-700/20 dark:text-gray-300',
    3: 'bg-gray-100 text-gray-700 dark:bg-gray-700/20 dark:text-gray-300',
    4: 'bg-gray-100 text-gray-700 dark:bg-gray-700/20 dark:text-gray-400',
    5: 'bg-gray-100 text-gray-700 dark:bg-gray-700/20 dark:text-gray-400',
    6: 'bg-gray-100 text-gray-700 dark:bg-gray-700/20 dark:text-gray-400',
  },
} as const;

const LoadingSkeleton: React.FC = () => (
  <>
    {[...Array(8)].map((_, i) => (
      <div
        key={i}
        className="flex items-start mt-3 pl-3 animate-pulse"
        style={{ marginLeft: `${(i % 3) * 1.5}rem` }}
      >
        <div className="mt-1.5 h-3.5 w-3.5 bg-gray-200 dark:bg-gray-700 rounded-sm flex-shrink-0" />
        <div className="ml-3 flex-1">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        </div>
      </div>
    ))}
  </>
);

const HeadingNode: React.FC<HeadingNodeProps> = React.memo(
  ({ heading, isExpanded, hasChildNodes, onToggle, isVisible }) => {
    const handleClick = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        if ((e.target as HTMLElement).closest('button[aria-label="Copy"]')) {
          return;
        }

        if (!heading.domId) {
          if (hasChildNodes) {
            onToggle();
          }
          return;
        }

        chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
          if (!tab?.id) return;

          chrome.scripting
            .executeScript({
              target: { tabId: tab.id },
              world: 'MAIN',
              func: (domId) => {
                try {
                  const element = document.getElementById(domId);
                  if (!element) return;

                  const rect = element.getBoundingClientRect();
                  if (rect.height === 0 || rect.width === 0) return;
                  if ('scrollBehavior' in document.documentElement.style) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  } else {
                    element.scrollIntoView({ block: 'start' });
                  }
                } catch {
                  void 0;
                }
              },
              args: [heading.domId],
            })
            .catch(() => {
              logger.log('Headings', 'Failed to execute scroll script', 'warn');
            });
        });

        if (hasChildNodes) {
          onToggle();
        }
      },
      [heading.domId, hasChildNodes, onToggle]
    );

    if (!isVisible) return null;

    const buttonClassName = `${STYLES.button.base} ${hasChildNodes ? STYLES.button.interactive : STYLES.button.static}`;
    const headingStyle = STYLES.headingLevel[heading.level as keyof typeof STYLES.headingLevel];

    return (
      <div
        style={{ marginLeft: `${Math.max(0, heading.level - 1) * 1.25}rem` }}
        className="py-0.5 group/item"
      >
        <button onClick={handleClick} className={buttonClassName}>
          {hasChildNodes ? (
            <span className={STYLES.icon.wrapper}>
              {isExpanded ? (
                <BiChevronDown className={STYLES.icon.size} />
              ) : (
                <BiChevronRight className={STYLES.icon.size} />
              )}
            </span>
          ) : (
            <span className={STYLES.icon.size} />
          )}
          <span
            className={`${STYLES.tagBase} ${STYLES.tagByLevel[heading.level as keyof typeof STYLES.tagByLevel]}`}
          >
            H{heading.level}
          </span>
          <CopyButton
            text={heading.text}
            className="transition-opacity duration-200 ease-in-out text-gray-500 hover:text-gray-700 dark:text-brand-400 dark:hover:text-brand-500"
          />
          <span className={`truncate flex-1 cursor-pointer ${headingStyle}`}>{heading.text}</span>
        </button>
      </div>
    );
  }
);

HeadingNode.displayName = 'HeadingNode';

const HeadingTree: React.FC<HeadingTreeProps> = ({ headings, loading }) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (headings.length > 0) {
      setExpandedNodes(new Set(headings.map((_, index) => index)));
    }
  }, [headings]);

  const hasChildren = useCallback(
    (index: number): boolean => {
      if (index >= headings.length - 1) return false;
      const currentLevel = headings[index].level;
      const nextLevel = headings[index + 1].level;
      return nextLevel > currentLevel;
    },
    [headings]
  );

  const isVisible = useCallback(
    (index: number): boolean => {
      if (index === 0) return true;

      for (let i = index - 1; i >= 0; i--) {
        const currentHeading = headings[index];
        const potentialParent = headings[i];

        if (potentialParent.level < currentHeading.level) {
          return expandedNodes.has(i);
        }

        if (potentialParent.level === currentHeading.level) {
          continue;
        }
      }

      return true;
    },
    [headings, expandedNodes]
  );

  const getChildrenIndices = useCallback(
    (index: number): number[] => {
      const children: number[] = [];
      const parentLevel = headings[index].level;

      for (let i = index + 1; i < headings.length; i++) {
        const currentLevel = headings[i].level;

        if (currentLevel <= parentLevel) {
          break;
        }

        children.push(i);
      }

      return children;
    },
    [headings]
  );

  const toggleNode = useCallback(
    (index: number) => {
      if (!hasChildren(index)) return;

      setExpandedNodes((prev) => {
        const newExpanded = new Set(prev);
        const isCurrentlyExpanded = newExpanded.has(index);

        if (isCurrentlyExpanded) {
          newExpanded.delete(index);
          const childrenIndices = getChildrenIndices(index);
          childrenIndices.forEach((childIndex) => {
            newExpanded.delete(childIndex);
          });
        } else {
          newExpanded.add(index);
        }

        return newExpanded;
      });
    },
    [hasChildren, getChildrenIndices]
  );

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="flex-1 overflow-auto p-2" data-scroll-container>
      {headings.map((heading, index) => (
        <HeadingNode
          key={index}
          heading={heading}
          isExpanded={expandedNodes.has(index)}
          hasChildNodes={hasChildren(index)}
          onToggle={() => toggleNode(index)}
          isVisible={isVisible(index)}
        />
      ))}
    </div>
  );
};

export default React.memo(HeadingTree);
