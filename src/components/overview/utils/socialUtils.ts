import { truncateSerpText, extractDomain } from './serpUtils';
import type { PageElements } from '../types';

export const TWITTER_LIMITS = {
  TITLE_MAX: 70,
  DESCRIPTION_MAX: 200,
} as const;

export const OG_LIMITS = {
  TITLE_MAX_DESKTOP: 60,
  TITLE_MAX_MOBILE: 40,
  DESCRIPTION_MAX: 200,
} as const;

type PreviewData = {
  title: string;
  description: string;
  url: string;
  image?: string;
  domain: string;
};

export function getOgPreviewData(elements: PageElements): PreviewData {
  const og = elements.meta.opengraph;
  const std = elements.meta.standard;

  const title =
    og.find((m) => (m.property || '').toLowerCase() === 'og:title')?.content ||
    std.find((m) => (m.name || '').toLowerCase() === 'title')?.content ||
    '';

  const description =
    og.find((m) => (m.property || '').toLowerCase() === 'og:description')?.content ||
    std.find((m) => (m.name || '').toLowerCase() === 'description')?.content ||
    '';

  const image =
    og.find((m) => (m.property || '').toLowerCase() === 'og:image')?.content || undefined;

  const url =
    elements?.meta?.opengraph.find((m) => (m.property || '').toLowerCase() === 'og:url')?.content ||
    elements?.link?.byType?.canonical[0]?.href ||
    '';

  const domain = extractDomain(url);
  const formattedTitle = truncateSerpText(title || '[Title missing]', OG_LIMITS.TITLE_MAX_DESKTOP);
  const formattedDescription = truncateSerpText(
    description || '[Description missing]',
    OG_LIMITS.DESCRIPTION_MAX
  );

  return {
    title: formattedTitle,
    description: formattedDescription,
    url,
    image,
    domain: domain || '[URL missing]',
  };
}

export function getTwitterPreviewData(elements: PageElements): PreviewData {
  const tw = elements.meta.twitter;
  const og = elements.meta.opengraph;
  const std = elements.meta.standard;

  const title =
    tw.find((m) => (m.name || m.property || '').toLowerCase() === 'twitter:title')?.content ||
    og.find((m) => (m.property || '').toLowerCase() === 'og:title')?.content ||
    std.find((m) => (m.name || '').toLowerCase() === 'title')?.content ||
    '';

  const description =
    tw.find((m) => (m.name || m.property || '').toLowerCase() === 'twitter:description')?.content ||
    og.find((m) => (m.property || '').toLowerCase() === 'og:description')?.content ||
    std.find((m) => (m.name || '').toLowerCase() === 'description')?.content ||
    '';

  const image =
    tw.find((m) => (m.name || m.property || '').toLowerCase() === 'twitter:image')?.content ||
    tw.find((m) => (m.name || m.property || '').toLowerCase() === 'twitter:image:src')?.content ||
    og.find((m) => (m.property || '').toLowerCase() === 'og:image')?.content ||
    undefined;

  const url =
    tw.find((m) => (m.name || m.property || '').toLowerCase() === 'twitter:url')?.content ||
    elements?.meta?.opengraph.find((m) => (m.property || '').toLowerCase() === 'og:url')?.content ||
    elements?.link?.byType?.canonical[0]?.href ||
    '';

  const domain = extractDomain(url);

  const formattedTitle = truncateSerpText(title || '[Title missing]', TWITTER_LIMITS.TITLE_MAX);
  const formattedDescription = truncateSerpText(
    description || '[Description missing]',
    TWITTER_LIMITS.DESCRIPTION_MAX
  );

  return {
    title: formattedTitle,
    description: formattedDescription,
    url,
    image,
    domain: domain || '[URL missing]',
  };
}
