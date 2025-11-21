import MetricCard from '../components/MetricCard';
import type { AnalysisResult, WebVitalMetric } from '../types';

interface WebVitalsCardProps {
  data: AnalysisResult;
}

const ORDER: Array<WebVitalMetric['name']> = ['LCP', 'CLS', 'FCP', 'TTFB'];

function formatValue(name: WebVitalMetric['name'], value: number): string {
  if (name === 'CLS') return value.toFixed(3);
  return `${Math.round(value)} ms`;
}

function ratingColor(rating: WebVitalMetric['rating']): string {
  switch (rating) {
    case 'good':
      return 'text-brand-600 dark:text-brand-400';
    case 'needs-improvement':
      return 'text-amber-600 dark:text-amber-400';
    case 'poor':
      return 'text-rose-600 dark:text-rose-400';
  }
}

function gaugeColor(score: number): string {
  if (score >= 90) return 'rgb(var(--brand-500))';
  if (score >= 50) return '#f59e0b';
  return '#f43f5e';
}

function computeScore(metrics: Record<string, WebVitalMetric>): number {
  const w: Record<string, number> = { LCP: 0.6, CLS: 0.4 };
  let s = 0;
  let t = 0;
  (['LCP', 'CLS'] as const).forEach((k) => {
    const m = metrics[k];
    const weight = w[k];
    if (m) {
      t += weight;
      const v = m.rating === 'good' ? 1 : m.rating === 'needs-improvement' ? 0.5 : 0;
      s += v * weight;
    }
  });
  if (!t) return 0;
  return Math.round(100 * (s / t));
}

export function WebVitalsCard({ data }: WebVitalsCardProps) {
  const metricsRecord = data.webVitals || {};
  const slots = ORDER.map((name) => ({
    name,
    metric: metricsRecord[name] as WebVitalMetric | undefined,
  }));
  const score = computeScore(metricsRecord as Record<string, WebVitalMetric>);
  const deg = Math.round((score / 100) * 360);
  const color = gaugeColor(score);
  const isDark =
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const track = isDark ? 'rgba(255,255,255,0.12)' : '#e5e7eb';
  const hasCoreMetrics = Boolean(
    (metricsRecord as Record<string, WebVitalMetric>).LCP ||
      (metricsRecord as Record<string, WebVitalMetric>).CLS
  );

  return (
    <MetricCard
      contentClassName="p-0"
      title="Web Vitals"
      tooltip="Core Web Vitals measured on demand"
      hideHeader
    >
      <div className="grid sm:grid-cols-5 grid-cols-2 gap-2 p-2">
        <div className="sm:col-span-1 col-span-2 flex items-center justify-center">
          {hasCoreMetrics ? (
            <div className="relative sm:h-16 sm:w-16 h-20 w-20">
              <div
                className="absolute inset-0 rounded-full"
                style={{ backgroundImage: `conic-gradient(${color} ${deg}deg, ${track} 0)` }}
              />
              <div className="absolute inset-1.5 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center">
                <div className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                  {score}
                </div>
              </div>
            </div>
          ) : (
            <span className="h-6 w-6 border-2 border-gray-300 dark:border-gray-600 border-t-gray-500 dark:border-t-gray-400 rounded-full animate-spin" />
          )}
        </div>
        {slots.map(({ name, metric }) => (
          <div
            key={name}
            className="rounded-md p-2 border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800"
            role="status"
            aria-label={`${name}: ${metric ? metric.value : 'pending'}`}
          >
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">{name}</div>
            <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
              {metric ? (
                formatValue(name, metric.value)
              ) : (
                <span className="inline-flex items-center gap-1">
                  <span className="h-3 w-3 border-2 border-gray-300 dark:border-gray-600 border-t-gray-500 dark:border-t-gray-400 rounded-full animate-spin" />
                  <span className="sr-only">Loading</span>
                </span>
              )}
            </div>
            {metric && (
              <div className={`text-xs mt-0.5 ${ratingColor(metric.rating)}`}>
                {metric.rating === 'good'
                  ? 'Good'
                  : metric.rating === 'needs-improvement'
                    ? 'Needs improvement'
                    : 'Poor'}
              </div>
            )}
          </div>
        ))}
      </div>
    </MetricCard>
  );
}

export default WebVitalsCard;
