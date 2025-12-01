import { METRIC_META } from '@/lib/constants';
import { RagasMetricKey } from '@/types';
import { HelpCircle, ArrowUp, ArrowDown } from 'lucide-react';
import { CircularProgress } from './CircularProgress';

type MetricCardProps = {
  metricKey: RagasMetricKey;
  value: number;
  previousValue?: number;
};

export const MetricCard = ({ metricKey, value, previousValue } : MetricCardProps) => {
  const def = METRIC_META[metricKey];
  const Icon = def.icon;
  const diff = previousValue !== undefined ? value - previousValue : 0;
  const isPositive = diff > 0;

  return (
    <div className="bg-white p-3.5 rounded-xl shadow-xs border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all relative">
      <div className="flex-1">
        <div className="flex items-center gap-1 mb-2 relative">
          <Icon className="w-4 h-4" />
          <span className="text-sm font-medium">{def.label}</span>
          <div className="group/tooltip relative">
            <HelpCircle
              size={12}
              className="text-gray-300 cursor-help hover:text-indigo-500 transition-colors"
            />
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-20 shadow-xl pointer-events-none">
              {def.desc}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {previousValue !== undefined && (
            <div
              className={`flex items-center text-xs font-medium px-1.5 py-0.5 rounded ${
                isPositive
                  ? 'bg-green-50 text-green-700'
                  : diff === 0 ? 'bg-gray-50 text-gray-700' : 'bg-red-50 text-red-700'
              }`}
            >
              {isPositive ? (
                <ArrowUp size={10} className="mr-0.5" />
              ) : diff === 0 ? (
                <></>
              ) : (
                <ArrowDown size={10} className="mr-0.5" />
              )}
              {Math.abs(diff)}%
            </div>
          )}
        </div>
      </div>
      <div className="opacity-90 group-hover:opacity-100 transition-opacity pl-4 border-l border-gray-50">
        <CircularProgress value={value} color={def.color} />
      </div>
    </div>
  );
};
