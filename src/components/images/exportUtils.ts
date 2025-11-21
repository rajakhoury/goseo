import { ImageData, IMAGE_FORMATS, CANONICAL_FORMATS, ImagesError } from './types';
import { logger } from '../../utils/logger';
import { buildExportSlug } from '../overview/utils/urlUtils';

export const getCleanFileName = (
  url: string,
  format?: string | null
): { name: string; ext: string } => {
  try {
    if (url.startsWith('data:')) {
      const matches = url.match(/^data:image\/([a-zA-Z0-9+.-]+)(?:;[^,]*)?,/);
      const fmt = matches?.[1]?.toLowerCase();
      const canonicalFormat = fmt ? (IMAGE_FORMATS[fmt] ?? fmt) : 'jpg';
      return { name: 'image', ext: `.${canonicalFormat}` };
    }

    const cleanUrl = url.split(/[?#]/)[0];

    const fileName = cleanUrl.split('/').pop() || '';

    const match = fileName.match(/^(.+?)(\.[^.]*$|$)/);
    let name = match ? match[1] : 'image';
    let ext = '';

    name = Array.from(name)
      .map((c) => (c.charCodeAt(0) < 32 ? '-' : c))
      .join('');
    name = name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
    name = name.replace(/[<>:"/\\|?*]/g, '-');
    name = name.trim().replace(/[ .]+$/g, '');
    name = name.replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (!name) name = 'image';
    const reserved = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
    if (reserved.test(name)) {
      name = `image-${name.toLowerCase()}`;
    }

    if (match && match[2]) {
      ext = match[2].toLowerCase().replace(/^\./, '');
    }

    if (!ext && format) {
      ext = format.toLowerCase().replace(/^\./, '');
    }

    if (ext) {
      ext = ext.replace(/[^a-z0-9]/gi, '').toLowerCase();

      if (ext.length > 10) {
        ext = '';
      }
    }

    if (!ext || !CANONICAL_FORMATS.has(ext)) {
      ext = 'jpg';
    }

    return { name, ext: `.${ext}` };
  } catch (error) {
    logger.log('Export Utils', `Failed to clean filename for URL: ${url}`, 'warn', error);
    return { name: 'image', ext: '.jpg' };
  }
};

export const getImageFormat = (
  url: string,
  contentTypeOrFormat: string | null | undefined
): string => {
  try {
    if (url.startsWith('data:')) {
      const matches = url.match(/^data:image\/([a-zA-Z0-9+.-]+)(?:;[^,]*)?,/);
      const format = matches?.[1]?.toLowerCase();
      if (format) {
        return IMAGE_FORMATS[format] ?? (CANONICAL_FORMATS.has(format) ? format : '');
      }
      return '';
    }

    const ct = contentTypeOrFormat || '';
    if (ct) {
      const headerMatch = ct.match(/image\/([a-zA-Z0-9+.-]+)/i);
      const headerFormat = headerMatch?.[1]?.toLowerCase();
      if (headerFormat) {
        return (
          IMAGE_FORMATS[headerFormat] ?? (CANONICAL_FORMATS.has(headerFormat) ? headerFormat : '')
        );
      }
      const raw = ct.toLowerCase().replace(/^\./, '');
      if (raw) {
        return IMAGE_FORMATS[raw] ?? (CANONICAL_FORMATS.has(raw) ? raw : '');
      }
    }

    const cleanUrl = url.split(/[?#]/)[0];

    const extension = cleanUrl.split('.').pop()?.toLowerCase();
    if (extension) {
      return IMAGE_FORMATS[extension] ?? (CANONICAL_FORMATS.has(extension) ? extension : '');
    }

    return '';
  } catch (error) {
    logger.log('Export Utils', `Failed to extract format from URL: ${url}`, 'warn', error);
    return '';
  }
};

export const getDisplayFormat = (url: string, format: string | null | undefined): string => {
  if (format) {
    const cleanFormat = format.toLowerCase().replace(/^\./, '');
    return IMAGE_FORMATS[cleanFormat] ?? (CANONICAL_FORMATS.has(cleanFormat) ? cleanFormat : '');
  }
  return getImageFormat(url, format);
};

export const exportToCSV = async (images: ImageData[]) => {
  const headers = [
    'DOM Order',
    'URL',
    'ALT Text',
    'Title',
    'Width',
    'Height',
    'File Size (bytes)',
    'Has ALT',
    'Has Title',
    'Format',
    'Is Next Gen',
    'Is Lazy',
    'Has Dimensions',
    'Is Oversized',
    'Caption',
    'Sources',
  ];

  const rows = images.map((img, index) => {
    const format = getImageFormat(img.src, img.format);
    const hasDimensions = Boolean((img.width || 0) > 0 && (img.height || 0) > 0);
    const isOversized = Boolean(
      format !== 'svg' && format !== 'ico' && (img.fileSize || 0) > 100 * 1024
    );
    const sources = Array.isArray(img.sources) ? img.sources.join('|') : '';

    return [
      index + 1,
      img.src,
      img.alt || '',
      img.title || '',
      img.width || '',
      img.height || '',
      img.fileSize || '',
      img.hasAltContent ? 'Yes' : 'No',
      img.hasTitle ? 'Yes' : 'No',
      format || '',
      img.isNextGen ? 'Yes' : 'No',
      img.isLazy ? 'Yes' : 'No',
      hasDimensions ? 'Yes' : 'No',
      isOversized ? 'Yes' : 'No',
      img.caption || '',
      sources,
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row
        .map((cell) => {
          const escaped = String(cell).replace(/"/g, '""');
          return /[,"\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    const fullUrl = tab.url || '';
    const slug = buildExportSlug(fullUrl);

    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0].replace(/:/g, '-');

    const filename = `images-${slug}-${date}-${time}.csv`;

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });
};

const processDataUrl = (dataUrl: string) => {
  const m = dataUrl.match(/^data:([^;,]+)(?:;([^,]*))?,([\s\S]*)$/);
  if (!m) return null;
  const mimeType = m[1];
  const params = m[2] || '';
  const payload = m[3] || '';
  const isBase64 = /\bbase64\b/i.test(params);
  if (isBase64) {
    const normalized = payload.replace(/\s+/g, '');
    return { data: atob(normalized), extension: (mimeType.split('/')[1] || '').toLowerCase() };
  }
  if (mimeType.toLowerCase() === 'image/svg+xml') {
    return { data: decodeURIComponent(payload), extension: 'svg' };
  }
  return {
    data: decodeURIComponent(payload),
    extension: (mimeType.split('/')[1] || '').toLowerCase(),
  };
};

export async function downloadImagesAsZip(images: ImageData[]) {
  try {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    let successCount = 0;
    let failureCount = 0;
    const totalCount = images.length;
    const usedNames = new Set<string>();

    for (const img of images) {
      try {
        let blob: Blob;
        const FETCH_TIMEOUT = 10000;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

        if (img.src.startsWith('data:')) {
          const processed = processDataUrl(img.src);
          if (!processed) {
            throw new ImagesError('INVALID_DATA_URL', 'Invalid data URL');
          }
          const { name, ext } = getCleanFileName(img.src);
          let finalName = name;
          let counter = 1;
          while (usedNames.has(finalName + ext)) {
            finalName = `${name}-${counter}`;
            counter++;
          }
          usedNames.add(finalName + ext);

          {
            const ext = (processed.extension || 'jpg').toLowerCase();
            const mime = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;
            blob = new Blob([processed.data], { type: mime });
            zip.file(`${finalName}.${ext}`, blob);
          }
          successCount++;
        } else {
          try {
            const response = await fetch(img.src, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) {
              failureCount++;
              throw new ImagesError('FETCH_ERROR', `Failed to fetch image: ${response.statusText}`);
            }

            blob = await response.blob();
            const extension = img.format?.toLowerCase() || blob.type.split('/')[1] || 'jpg';
            const { name, ext } = getCleanFileName(img.src, extension);
            let finalName = name;
            let counter = 1;
            while (usedNames.has(finalName + ext)) {
              finalName = `${name}-${counter}`;
              counter++;
            }
            usedNames.add(finalName + ext);

            zip.file(`${finalName}${ext}`, blob);
            successCount++;
          } catch (error) {
            clearTimeout(timeoutId);
            throw error;
          }
        }

        logger.log(
          'Export Utils',
          `Processing images: ${successCount}/${totalCount} (${failureCount} failed)`,
          'info'
        );
      } catch (error) {
        logger.log(
          'Export Utils',
          `Failed to process image: ${img.src} - ${error instanceof Error ? error.message : String(error)}`,
          'info',
          error
        );
        failureCount++;
        continue;
      }
    }
    if (failureCount > 0) {
      logger.info('Export Utils', `Failed to download ${failureCount} out of ${totalCount} images`);
    }

    if (successCount === 0) {
      throw new ImagesError('EXPORT_ERROR', 'No images could be downloaded');
    }

    const content = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 6,
      },
    });
    const url = URL.createObjectURL(content);

    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      const fullUrl = tab.url || '';
      const slug = buildExportSlug(fullUrl);

      const now = new Date();
      const date = now.toISOString().split('T')[0];
      const time = now.toTimeString().split(' ')[0].replace(/:/g, '-');

      const filename = `images-${slug}-${date}-${time}.zip`;

      chrome.downloads.download(
        {
          url: url,
          filename: filename,
          saveAs: true,
        },
        (_) => {
          if (chrome.runtime.lastError) {
            logger.log('Export Utils', 'Download failed', 'error', chrome.runtime.lastError);
          }
          URL.revokeObjectURL(url);
        }
      );
    });
  } catch (error) {
    logger.log(
      'Export Utils',
      `Failed to create zip file: ${error instanceof Error ? error.message : String(error)}`,
      'error'
    );
    throw new ImagesError('EXPORT_ERROR', 'Failed to create zip file');
  }
}
