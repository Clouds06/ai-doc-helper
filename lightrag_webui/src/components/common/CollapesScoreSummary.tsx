import { METRIC_ORDER } from '@/lib/constants';
import { toPercent } from '@/lib/utils';
import { RagasMetrics } from '@/types';

interface CollapsedScoreSummaryProps {
  metrics: RagasMetrics;
};

export const CollapsedScoreSummary = ({
  metrics,
}: CollapsedScoreSummaryProps) => {
  return (
    <div className="flex items-center text-sm font-mono text-gray-500 bg-gray-50/80 px-2 py-1.5 rounded border border-gray-100">
      {METRIC_ORDER.map((key, idx) => {
        const val = metrics[key];
        const percent = toPercent(val);

        let colorClass = 'text-gray-600';
        if (percent !== null) {
          if (percent < 60) colorClass = 'text-red-600';
          else if (percent < 80) colorClass = 'text-amber-600';
          else colorClass = 'text-emerald-600';
        }

        return (
          <div key={key} className="flex items-center">
            {idx > 0 && <span className="text-gray-300 mx-1">/</span>}
            <span className={`w-7 text-center font-normal ${colorClass}`}>
              {percent ?? '-'}
            </span>
          </div>
        );
      })}
    </div>
  );
};
