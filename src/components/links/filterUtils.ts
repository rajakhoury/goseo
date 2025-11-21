import { LinkData, FilterOptions } from './types';

export function filterLinks(links: LinkData[], filters: FilterOptions): LinkData[] {
  if (!Array.isArray(links)) {
    return [];
  }

  if (!filters || typeof filters !== 'object') {
    return links;
  }

  return links.filter((link) => {
    if (!link || typeof link !== 'object') {
      return false;
    }

    const noFiltersActive = !Object.values(filters).some((value) => Boolean(value));
    if (noFiltersActive) return true;

    const locationFilters = {
      internal: Boolean(filters.internal) && Boolean(link.isInternal),
      external: Boolean(filters.external) && !link.isInternal,
    };
    const hasLocationFilter = Boolean(filters.internal) || Boolean(filters.external);
    const passesLocationFilter =
      !hasLocationFilter || locationFilters.internal || locationFilters.external;

    const statusFilters = {
      broken: !filters.broken || Boolean(link.broken),
      nofollow: !filters.nofollow || Boolean(link.isNoFollow),
      missingTitle: !filters.missingTitle || link.title === null,
      communication: !filters.communication || link.type === 'communication',
    };
    const passesStatusFilters = Object.values(statusFilters).every(Boolean);

    return passesLocationFilter && passesStatusFilters;
  });
}
