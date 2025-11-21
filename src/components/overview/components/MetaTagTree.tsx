import React, { useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import { BiChevronDown, BiChevronRight } from 'react-icons/bi';
import { MetaCategory } from '../utils/metaCategories';
import { MetaTag } from '../types';

interface MetaTagTreeProps {
  categories: MetaCategory[];
  searchQuery?: string;
}

export const MetaTagTree = forwardRef<
  { expandAll: () => void; collapseAll: () => void },
  MetaTagTreeProps
>(({ categories, searchQuery = '' }, ref) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const expandAll = useCallback(() => {
    const allIds = new Set<string>();
    const collectIds = (cats: MetaCategory[]) => {
      cats.forEach((cat) => {
        allIds.add(cat.id);
        if (cat.subcategories) {
          collectIds(cat.subcategories);
        }
      });
    };
    collectIds(categories);
    setExpandedCategories(allIds);
  }, [categories]);

  const collapseAll = useCallback(() => {
    setExpandedCategories(new Set());
  }, []);

  useImperativeHandle(ref, () => ({ expandAll, collapseAll }), [expandAll, collapseAll]);

  const filterCategory = (category: MetaCategory): MetaCategory | null => {
    if (!searchQuery) return category;

    const query = searchQuery.toLowerCase();

    const filteredTags = category.tags.filter((tag) => {
      const searchableText = [tag.name, tag.property, tag.content, tag.charset, tag.httpEquiv]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(query);
    });

    const filteredSubcategories = category.subcategories
      ?.map((sub) => filterCategory(sub))
      .filter((sub): sub is MetaCategory => sub !== null);

    if (filteredTags.length > 0 || (filteredSubcategories && filteredSubcategories.length > 0)) {
      return {
        ...category,
        tags: filteredTags,
        subcategories: filteredSubcategories,
      };
    }

    return null;
  };

  const filteredCategories = categories
    .map((cat) => filterCategory(cat))
    .filter((cat): cat is MetaCategory => cat !== null);

  return (
    <div>
      <div className="space-y-2">
        {filteredCategories.map((category) => (
          <CategoryNode
            key={category.id}
            category={category}
            level={0}
            expanded={expandedCategories.has(category.id)}
            onToggle={() => toggleCategory(category.id)}
            expandedCategories={expandedCategories}
            onToggleSubcategory={toggleCategory}
          />
        ))}
      </div>

      {filteredCategories.length === 0 && searchQuery && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No meta tags found matching {searchQuery}
        </div>
      )}
    </div>
  );
});

interface CategoryNodeProps {
  category: MetaCategory;
  level: number;
  expanded: boolean;
  onToggle: () => void;
  expandedCategories: Set<string>;
  onToggleSubcategory: (id: string) => void;
}

const CategoryNode: React.FC<CategoryNodeProps> = ({
  category,
  level,
  expanded,
  onToggle,
  expandedCategories,
  onToggleSubcategory,
}) => {
  const hasContent =
    category.tags.length > 0 || (category.subcategories && category.subcategories.length > 0);

  return (
    <div className="rounded-md outline outline-1 -outline-offset-1 outline-gray-200 dark:outline-gray-700">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 p-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-t-md transition-colors text-left"
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {hasContent &&
          (expanded ? (
            <BiChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
          ) : (
            <BiChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
          ))}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
              {category.name}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              (
              {category.tags.length +
                (category.subcategories?.reduce((sum, sub) => sum + sub.tags.length, 0) || 0)}
              )
            </span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
            {category.description}
          </p>
        </div>
      </button>

      {expanded && hasContent && (
        <div className="p-2 space-y-2 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-b-md">
          {category.subcategories?.map((subcategory) => (
            <CategoryNode
              key={subcategory.id}
              category={subcategory}
              level={level + 1}
              expanded={expandedCategories.has(subcategory.id)}
              onToggle={() => onToggleSubcategory(subcategory.id)}
              expandedCategories={expandedCategories}
              onToggleSubcategory={onToggleSubcategory}
            />
          ))}

          {category.tags.map((tag, index) => (
            <MetaTagItem key={index} tag={tag} level={level} />
          ))}
        </div>
      )}
    </div>
  );
};

interface MetaTagItemProps {
  tag: MetaTag;
  level: number;
}

const MetaTagItem: React.FC<MetaTagItemProps> = ({ tag, level }) => {
  const displayKey = tag.property || tag.name || tag.httpEquiv || 'charset';
  const displayValue =
    typeof tag.content === 'string' && tag.content.length > 0 ? tag.content : tag.charset || '';

  return (
    <div
      className="p-2 bg-white dark:bg-gray-800 rounded-md outline outline-1 -outline-offset-1 outline-gray-200 dark:outline-gray-700 hover:outline-gray-300 dark:hover:outline-gray-600 transition-colors"
      style={{ marginLeft: `${level * 16}px` }}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="mb-0.5">
            <code className="text-xs font-mono text-blue-600 dark:text-blue-300 break-all">
              {displayKey}
            </code>
          </div>
          {displayValue && (
            <p className="text-xs text-gray-700 dark:text-gray-300 break-all">{displayValue}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MetaTagTree;
MetaTagTree.displayName = 'MetaTagTree';
