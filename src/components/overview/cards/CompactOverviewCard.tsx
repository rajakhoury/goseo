import React from 'react';
import MetricCard from '../components/MetricCard';
import { AnalysisResult } from '../types';
import CopyButton from '../../common/CopyButton';
import { validateTitleLength, validateDescriptionLength } from '../utils/characterValidation';
import FileStatusCheck from '../components/FileStatusCheck';
import { getRobotsUrl, getSitemapUrl, getAiTxtUrl, getLlmsTxtUrl } from '../utils/urlUtils';

interface CompactOverviewCardProps {
  data: AnalysisResult;
}

export function CompactOverviewCard({ data }: CompactOverviewCardProps) {
  const {
    elements: { meta, link },
    url,
    technical,
  } = data.pageAnalysis;

  const title = meta.standard.find((m) => m.name === 'title')?.content || '';
  const description = meta.standard.find((m) => m.name === 'description')?.content || '';
  const canonical = link.byType.canonical[0]?.href || '';
  const robots = meta.standard.find((m) => m.name === 'robots')?.content || '';
  const author = meta.standard.find((m) => m.name === 'author')?.content || '';
  const publisher = meta.standard.find((m) => m.name === 'publisher')?.content || '';
  const keywords = meta.standard.find((m) => m.name === 'keywords')?.content || '';

  const language = technical.language || 'Not specified';
  const charset = technical.charset || 'Not specified';
  const viewport = technical.viewport || 'Not specified';
  const doctype = technical.doctype || 'Not specified';
  const compatMode = technical.compatMode || 'Not specified';

  const favicons = React.useMemo(
    () => (link.byType.icon || []).filter((f) => f.href && !/^data:/i.test(f.href)),
    [link.byType.icon]
  );

  const [showAllFavicons, setShowAllFavicons] = React.useState(false);
  const displayedFavicons = showAllFavicons ? favicons : favicons.slice(0, 5);

  const alternateUrls = link.byType.alternate.filter(
    (alt) => alt.hreflang && alt.hreflang !== language
  );

  const [xRobotsTag, setXRobotsTag] = React.useState<string>('');
  const [xRobotsStatus, setXRobotsStatus] = React.useState<
    'checking' | 'found' | 'not-found' | 'error'
  >('checking');

  React.useEffect(() => {
    const checkXRobotsTag = async () => {
      try {
        const response = await fetch(url, { method: 'HEAD', cache: 'no-cache' });
        const xRobots = response.headers.get('x-robots-tag');
        if (xRobots) {
          setXRobotsTag(xRobots);
          setXRobotsStatus('found');
        } else {
          setXRobotsStatus('not-found');
        }
      } catch {
        setXRobotsStatus('error');
      }
    };
    checkXRobotsTag();
  }, [url]);

  const titleValidation = React.useMemo(() => validateTitleLength(title), [title]);
  const descValidation = React.useMemo(() => validateDescriptionLength(description), [description]);

  return (
    <MetricCard title="Overview" tooltip="Essential SEO information at a glance" hideHeader>
      <div className="space-y-2">
        <div className="grid grid-cols-12 gap-y-2">
          <div className="col-span-3 text-xs text-gray-500 dark:text-gray-400">
            Meta Title{' '}
            {title && (
              <span className="text-gray-400 dark:text-gray-500">
                ({titleValidation.count} chars)
              </span>
            )}
          </div>
          <div className="col-span-9">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words flex-1">
                {title || 'Title is missing'}
              </p>
              <CopyButton
                showOnHover={false}
                className={`text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-brand-400 ${!title ? 'opacity-40 cursor-not-allowed' : ''}`}
                text={title || ''}
                size="sm"
              />
            </div>
          </div>

          <div className="col-span-3 text-xs text-gray-500 dark:text-gray-400 pt-1">
            Meta Description{' '}
            {description && (
              <span className="text-gray-400 dark:text-gray-500">
                ({descValidation.count} chars)
              </span>
            )}
          </div>
          <div className="col-span-9 pt-1">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words flex-1 leading-5">
                {description || 'Description is missing'}
              </p>
              <CopyButton
                showOnHover={false}
                className={`text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-brand-400 ${!description ? 'opacity-40 cursor-not-allowed' : ''}`}
                text={description || ''}
                size="sm"
              />
            </div>
          </div>

          <div className="col-span-12 border-t border-gray-100 dark:border-gray-700" />

          <div className="col-span-3 text-xs text-gray-500 dark:text-gray-400">Page URL</div>
          <div className="col-span-9">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-gray-900 dark:text-gray-100 break-all">{url}</span>
              <CopyButton
                showOnHover={false}
                className="text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-brand-400"
                text={url}
                size="sm"
              />
            </div>
          </div>

          <div className="col-span-3 text-xs text-gray-500 dark:text-gray-400">Canonical URL</div>
          <div className="col-span-9">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-gray-900 dark:text-gray-100 break-all">
                {canonical || 'Not specified'}
              </span>
              <CopyButton
                showOnHover={false}
                className={`text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-brand-400 ${!canonical ? 'opacity-40 cursor-not-allowed' : ''}`}
                text={canonical || ''}
                size="sm"
              />
            </div>
          </div>

          <div className="col-span-12 border-t border-gray-100 dark:border-gray-700" />

          <div className="col-span-3 text-xs text-gray-500 dark:text-gray-400">
            Robots (Meta Tag)
          </div>
          <div className="col-span-9">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-gray-900 dark:text-gray-100 truncate">
                {robots || 'Not specified'}
              </span>
            </div>
          </div>

          <div className="col-span-3 text-xs text-gray-500 dark:text-gray-400">X-Robots-Tag</div>
          <div className="col-span-9">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-gray-900 dark:text-gray-100 truncate">
                {xRobotsTag ||
                  (xRobotsStatus === 'not-found'
                    ? 'Not found'
                    : xRobotsStatus === 'error'
                      ? 'Error checking'
                      : 'Not specified')}
              </span>
              {xRobotsTag && (
                <CopyButton
                  className="text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-brand-400"
                  text={xRobotsTag}
                  size="sm"
                />
              )}
            </div>
          </div>

          <div className="col-span-3 text-xs text-gray-500 dark:text-gray-400">Author</div>
          <div className="col-span-9">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-gray-900 dark:text-gray-100 truncate">
                {author || 'Not specified'}
              </span>
              {author && (
                <CopyButton
                  className="text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-brand-400"
                  text={author}
                  size="sm"
                />
              )}
            </div>
          </div>

          <div className="col-span-3 text-xs text-gray-500 dark:text-gray-400">Publisher</div>
          <div className="col-span-9">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-gray-900 dark:text-gray-100 truncate">
                {publisher || 'Not specified'}
              </span>
              {publisher && (
                <CopyButton
                  className="text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-brand-400"
                  text={publisher}
                  size="sm"
                />
              )}
            </div>
          </div>

          {keywords && (
            <>
              <div className="col-span-3 text-xs text-gray-500 dark:text-gray-400">Keywords</div>
              <div className="col-span-9">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-900 dark:text-gray-100 break-words">
                    {keywords}
                  </span>
                  <CopyButton
                    className="text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-brand-400"
                    text={keywords}
                    size="sm"
                  />
                </div>
              </div>
            </>
          )}

          <div className="col-span-12 border-t border-gray-100 dark:border-gray-700" />

          <div className="col-span-3 text-xs text-gray-500 dark:text-gray-400 h-4 flex items-center">
            Language
          </div>
          <div className="col-span-9 h-4 flex items-center">
            <span className="text-xs text-gray-900 dark:text-gray-100 truncate">{language}</span>
          </div>

          <div className="col-span-3 text-xs text-gray-500 dark:text-gray-400 h-4 flex items-center">
            Encoding
          </div>
          <div className="col-span-9 h-4 flex items-center">
            <span className="text-xs text-gray-900 dark:text-gray-100 truncate">{charset}</span>
          </div>

          <div className="col-span-3 text-xs text-gray-500 dark:text-gray-400 h-4 flex items-center">
            DOCTYPE
          </div>
          <div className="col-span-9 h-4 flex items-center">
            <span className="text-xs text-gray-900 dark:text-gray-100 truncate">{doctype}</span>
          </div>

          <div className="col-span-3 text-xs text-gray-500 dark:text-gray-400 h-4 flex items-center">
            Viewport
          </div>
          <div className="col-span-9 h-4 flex items-center">
            <span className="text-xs text-gray-900 dark:text-gray-100 truncate">{viewport}</span>
          </div>

          <div className="col-span-3 text-xs text-gray-500 dark:text-gray-400 h-4 flex items-center">
            Compat Mode
          </div>
          <div className="col-span-9 h-4 flex items-center">
            <span className="text-xs text-gray-900 dark:text-gray-100 truncate">{compatMode}</span>
          </div>

          {favicons.length > 0 && (
            <>
              <div className="col-span-3 text-xs text-gray-500 dark:text-gray-400">
                Favicons ({favicons.length})
              </div>
              <div className="col-span-9">
                <div className="flex flex-wrap items-center gap-2">
                  {displayedFavicons.map((favicon, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 dark:bg-gray-800/50 rounded text-xs"
                    >
                      <img
                        src={favicon.href}
                        alt={`Favicon ${index + 1}`}
                        className="w-4 h-4"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <span className="text-gray-600 dark:text-gray-400 truncate max-w-[150px]">
                        {favicon.sizes || 'No size specified'}
                      </span>
                    </div>
                  ))}
                  {favicons.length > 5 && !showAllFavicons && (
                    <button
                      onClick={() => setShowAllFavicons(true)}
                      className="text-xs text-blue-600 hover:text-blue-700 dark:text-brand-400 dark:hover:text-brand-300"
                    >
                      +{favicons.length - 5} more
                    </button>
                  )}
                  {favicons.length > 5 && showAllFavicons && (
                    <button
                      onClick={() => setShowAllFavicons(false)}
                      className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                      Show less
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          <div className="col-span-12 border-t border-gray-100 dark:border-gray-700" />

          <div className="col-span-12 grid grid-cols-4 gap-1">
            <FileStatusCheck url={getRobotsUrl(url)} type="robots.txt" />
            <FileStatusCheck url={getSitemapUrl(url)} type="sitemap.xml" />
            <FileStatusCheck url={getAiTxtUrl(url)} type="ai.txt" />
            <FileStatusCheck url={getLlmsTxtUrl(url)} type="llms.txt" />
          </div>

          {alternateUrls.length > 0 && (
            <>
              <div className="col-span-12 border-t border-gray-100 dark:border-gray-700" />
              <div className="col-span-3 text-xs text-gray-500 dark:text-gray-400">
                Alternate Language Versions ({alternateUrls.length})
              </div>
              <div className="col-span-9 space-y-1">
                {alternateUrls.map((alt, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    <span className="font-medium text-gray-900 dark:text-gray-100 uppercase">
                      {alt.hreflang}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 truncate">{alt.href}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </MetricCard>
  );
}

export default React.memo(CompactOverviewCard);
