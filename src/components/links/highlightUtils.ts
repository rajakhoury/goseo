import { LinkCategory, LinkData } from './types';
import { logger } from '../../utils/logger';

/**
 * TODO - add feature
 */
const HIGHLIGHT_CLASS = 'seo-link-highlight';
const HIGHLIGHT_COLORS = {
  internal: '#4ade80',
  external: '#60a5fa',
  nofollow: '#f87171',
  dofollow: '#34d399',
  noopener: '#a78bfa',
  noreferrer: '#818cf8',
  communication: '#fbbf24',
  broken: '#ef4444',
  'missing-title': '#f97316',
} as const;

const injectHighlightStyles = (): void => {
  try {
    if (!isDocumentAvailable()) return;

    const styleId = 'seo-link-highlight-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    if (!style) return;

    style.id = styleId;
    style.textContent = `
      .${HIGHLIGHT_CLASS} {
        transition: all 0.2s ease-in-out !important;
        border-radius: 2px !important;
        box-shadow: 0 0 0 2px currentColor !important;
      }
      ${Object.entries(HIGHLIGHT_COLORS)
        .map(
          ([category, color]) => `
        .${HIGHLIGHT_CLASS}-${category} {
          color: ${color} !important;
          box-shadow: 0 0 0 2px ${color} !important;
        }
      `
        )
        .join('\n')}
    `;

    document.head?.appendChild(style);
  } catch (error) {
    logger.log('Link Highlight', 'Failed to inject highlight styles', 'warn', error);
  }
};

const getLinkElement = (id: string | undefined | null): HTMLAnchorElement | null => {
  if (!id?.trim()) return null;
  try {
    const element = document.getElementById(id);
    return element instanceof HTMLAnchorElement ? element : null;
  } catch (error) {
    logger.log('Link Highlight', `Failed to get element by ID: ${id}`, 'info', error);
    return null;
  }
};

const getCategoryClass = (category: LinkCategory): string => {
  return category === 'all' ? HIGHLIGHT_CLASS : `${HIGHLIGHT_CLASS}-${category}`;
};

const hasClassList = (element: Element | null): element is Element => {
  return element !== null && 'classList' in element && element.classList instanceof DOMTokenList;
};

const isDocumentAvailable = (): boolean => {
  return (
    typeof document !== 'undefined' && document !== null && 'body' in document && 'head' in document
  );
};

export const removeAllHighlights = (): void => {
  if (!isDocumentAvailable()) return;

  try {
    const elements = document.querySelectorAll(`.${HIGHLIGHT_CLASS}`);
    if (!elements) return;

    elements.forEach((element) => {
      if (hasClassList(element)) {
        element.classList.remove(HIGHLIGHT_CLASS);
        Object.keys(HIGHLIGHT_COLORS).forEach((category) => {
          element.classList.remove(`${HIGHLIGHT_CLASS}-${category}`);
        });
      }
    });
  } catch (error) {
    logger.log('Link Highlight', 'Failed to remove highlights', 'warn', error);
  }
};

export const highlightLink = (
  linkId: string | undefined | null,
  category: LinkCategory = 'all',
  shouldScroll: boolean = false
): void => {
  if (!isDocumentAvailable()) return;

  try {
    const element = getLinkElement(linkId);
    if (!element || !hasClassList(element)) return;

    injectHighlightStyles();

    element.classList.add(HIGHLIGHT_CLASS);
    if (category !== 'all') {
      element.classList.add(getCategoryClass(category));
    }

    if (shouldScroll && typeof element.scrollIntoView === 'function') {
      try {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      } catch {
        try {
          element.scrollIntoView(true);
        } catch (scrollError) {
          logger.log('Link Highlight', 'Failed to scroll to element', 'info', scrollError);
        }
      }
    }
  } catch (error) {
    logger.log('Link Highlight', `Failed to highlight link ${linkId}`, 'info', error);
  }
};

export const highlightLinksByCategory = (
  links: LinkData[] | null | undefined,
  category: LinkCategory,
  shouldScroll: boolean = false
): void => {
  if (!Array.isArray(links) || !links.length) return;

  try {
    removeAllHighlights();

    const linksToHighlight = links.filter((link) => {
      if (!link || typeof link !== 'object') return false;

      switch (category) {
        case 'internal':
          return Boolean(link.isInternal);
        case 'external':
          return !link.isInternal;
        case 'nofollow':
          return Boolean(link.isNoFollow);
        case 'dofollow':
          return !link.isNoFollow;
        case 'noopener':
          return Boolean(link.isNoOpener);
        case 'noreferrer':
          return Boolean(link.isNoReferrer);
        case 'communication':
          return link.type === 'communication';
        case 'missing-title':
          return link.title === null;
        case 'broken':
          return Boolean(link.broken);
        case 'all':
          return true;
        default:
          return false;
      }
    });

    linksToHighlight.forEach((link, index) => {
      if (link?.domPosition?.id) {
        highlightLink(
          link.domPosition.id,
          category,
          shouldScroll && index === 0 // Only scroll to first link
        );
      }
    });

    logger.log(
      'Link Highlight',
      `Highlighted ${linksToHighlight.length} ${category} links`,
      'debug'
    );
  } catch (error) {
    logger.log('Link Highlight', `Failed to highlight ${category} links`, 'info', error);
  }
};

export const toggleCategoryHighlight = (
  links: LinkData[] | null | undefined,
  category: LinkCategory,
  shouldScroll: boolean = false
): void => {
  if (!isDocumentAvailable() || !Array.isArray(links)) return;

  try {
    const categoryClass = getCategoryClass(category);
    const hasHighlight = document.querySelector(`.${categoryClass}`);

    if (hasHighlight) {
      removeAllHighlights();
    } else {
      highlightLinksByCategory(links, category, shouldScroll);
    }
  } catch (error) {
    logger.log('Link Highlight', `Failed to toggle ${category} highlights`, 'info', error);
  }
};
