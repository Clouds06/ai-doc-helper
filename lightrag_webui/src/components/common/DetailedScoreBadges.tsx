import { METRIC_ORDER, METRIC_META } from '@/lib/constants';
import { toPercent } from '@/lib/utils';
import { RagasMetrics } from '@/types';

interface DetailScoreBadgesProps {
  metrics: RagasMetrics;
};

export const DetailScoreBadges = ({
  metrics,
}: DetailScoreBadgesProps) => {
  return (
    <div className="flex flex-wrap gap-4 items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
      {METRIC_ORDER.map((key) => {
        const val = metrics[key];
        if (typeof val !== 'number') return null;

        const percent = toPercent(val);
        const meta = METRIC_META[key];

        let scoreColorClass = 'text-gray-900';
        if (percent! >= 80) scoreColorClass = 'text-emerald-600';
        else if (percent! >= 60) scoreColorClass = 'text-amber-600';
        else scoreColorClass = 'text-red-600';

        return (
          <div
            key={key}
            className="flex items-center gap-2 pr-4 border-r border-gray-200 last:border-0 last:pr-0"
          >
            <div className="p-1.5 text-gray-500">
              <meta.icon className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-medium text-gray-500">
                {meta.label}
              </span>
              <span className={`text-sm font-medium font-mono ${scoreColorClass}`}>
                {percent}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
