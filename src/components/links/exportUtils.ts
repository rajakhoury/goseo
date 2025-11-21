import { LinkData } from './types';
import { logger } from '../../utils/logger';
import { buildExportSlug } from '../overview/utils/urlUtils';

const CODE_PATTERNS = [
  /^void\(0\)$/,
  /^return false$/,
  /^undefined$/,
  /^null$/,
  /^\{.*\}$/,
  /^\[.*\]$/,
  /^function\s*\(.*\).*$/,
  /^=>.*$/,
  /^[{}<>[\]].*$/,
];

export const getDisplayType = (type: string | undefined | null): string => {
  if (!type?.trim()) {
    return 'Unknown';
  }

  switch (type.toLowerCase().trim()) {
    case 'standard':
      return 'Standard';
    case 'communication':
      return 'Communication';
    case 'anchor':
      return 'Anchor';
    case 'unknown':
      return 'Unknown';
    default:
      return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  }
};

export const getFollowStatus = (isNoFollow: boolean | undefined | null): string => {
  if (isNoFollow === undefined || isNoFollow === null) {
    return 'Unknown';
  }
  return isNoFollow ? 'NoFollow' : 'Follow';
};

export const getLinkType = (isInternal: boolean | undefined | null): string => {
  if (isInternal === undefined || isInternal === null) {
    return 'Unknown';
  }
  return isInternal ? 'Internal' : 'External';
};

const isValidLink = (href: string | null | undefined): boolean => {
  if (!href?.trim()) {
    return false;
  }

  if (
    href.startsWith('javascript:') ||
    href.startsWith('data:') ||
    href.startsWith('#') ||
    href.toLowerCase() === 'about:blank'
  ) {
    return false;
  }

  return !CODE_PATTERNS.some((pattern) => pattern.test(href.trim()));
};

export const exportToCSV = async (links: LinkData[] | null | undefined) => {
  try {
    if (!Array.isArray(links) || links.length === 0) {
      throw new Error('Invalid or empty links data provided');
    }

    const headers = [
      'DOM Index',
      'URL',
      'Text',
      'Title',
      'Internal/External',
      'Follow/NoFollow',
      'DoFollow',
      'NoOpener',
      'NoReferrer',
      'Target',
      'Broken',
      'Type',
      'Rel',
    ];

    const validLinks = links.filter(
      (link) => link && typeof link === 'object' && isValidLink(link.href)
    );

    const rows = validLinks.map((link, index) => {
      if (!link || typeof link !== 'object') {
        logger.log('Export Utils', 'Unexpected null/undefined link in filtered array', 'error');
        return Array(headers.length).fill('');
      }

      return [
        (index + 1).toString(),
        link.href?.trim() || '',
        link.text?.trim() || '',
        link.title?.trim() || '',
        getLinkType(link.isInternal),
        getFollowStatus(link.isNoFollow),
        link.isDoFollow ? 'Yes' : 'No',
        link.isNoOpener ? 'Yes' : 'No',
        link.isNoReferrer ? 'Yes' : 'No',
        link.target?.trim() || '',
        link.broken ? 'Yes' : 'No',
        getDisplayType(link.type),
        Array.isArray(link.rel) ? link.rel.join(' ') : '',
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row
          .map((cell) => {
            if (cell === undefined || cell === null) {
              return '';
            }
            const escaped = String(cell).replace(/"/g, '""');
            return /[,"\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
          })
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab?.url?.trim()) {
        throw new Error('No active tab URL found');
      }

      const fullUrl = tab.url;
      const slug = buildExportSlug(fullUrl);

      const now = new Date();
      const date = now.toISOString().split('T')[0];
      const time = now.toTimeString().split(' ')[0].replace(/:/g, '-');

      try {
        const filename = `links-${slug}-${date}-${time}.csv`.replace(/[<>:"/\\|?*]/g, '-');

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        logger.log('Export Utils', 'Failed to trigger download', 'error', error);
      } finally {
        URL.revokeObjectURL(url);
      }
    });
  } catch (error) {
    logger.log('Export Utils', 'Failed to export links to CSV', 'error', error);
    throw error;
  }
};
