import { METRIC_ORDER, METRIC_META } from '@/lib/constants';
import { toPercent } from '@/lib/utils';
import { RagasMetrics } from '@/types';

interface DetailScoreBadgesProps {
  metrics: RagasMetrics;
};

export const DetailScoreBadges = ({ metrics }: DetailScoreBadgesProps) => {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      {METRIC_ORDER.map((key) => {
        const val = metrics[key];
        if (typeof val !== 'number') return null;

        const percent = toPercent(val);
        if (percent === null) return null;
        const meta = METRIC_META[key];

        let scoreColorClass = 'text-gray-900';
        if (percent >= 80) scoreColorClass = 'text-emerald-600';
        else if (percent >= 60) scoreColorClass = 'text-amber-600';
        else scoreColorClass = 'text-red-600';

        return (
          <div
            key={key}
            className="flex items-center gap-1 pr-2 border-r border-gray-200 last:border-0 last:pr-0"
          >
            <meta.icon className="w-3 h-3 text-gray-400" />
            <span className="text-sm text-gray-500">{meta.label}</span>
            <span className={`text-sm font-mono ${scoreColorClass}`}>
              {percent}%
            </span>
          </div>
        );
      })}
    </div>
  );
};