import { MOCK_EVAL_RESULT } from '@/data/mock';
import { RagasMetricKey, EvalSample } from '@/types';
import { Check, RotateCcw, ListFilter } from 'lucide-react';
import { SavedParamsSnapshot } from '../settings/SettingsModal';
import { CollapsibleSampleRow } from './CollapsibleSampleRow';
import { MetricCard } from './MetricCard';
import { useRagStore } from '@/hooks/useRagStore';
import { formatMetrics } from '@/lib/utils';
import { useMemo } from 'react';

interface EvalResultDisplayProps {
  hasEvaluated: boolean;
  lastEvalParams: SavedParamsSnapshot | null;
  isEvalButtonDisabled: boolean;
  onStartEvaluation: () => void;
}

export const EvalResultDisplay = ({
  hasEvaluated,
  lastEvalParams,
  isEvalButtonDisabled,
  onStartEvaluation,
}: EvalResultDisplayProps) => {
  const evalResult = useRagStore((s) => s.evalResult);
  const prevEvalResult = useRagStore((s) => s.prevEvalResult);

  const result = hasEvaluated ? evalResult ?? MOCK_EVAL_RESULT : null;

  const topMetricValues = useMemo(
    () => formatMetrics(evalResult?.metrics),
    [evalResult?.metrics],
  );

  const previousMetricValues = useMemo(
    () => formatMetrics(prevEvalResult?.metrics),
    [prevEvalResult?.metrics],
  );

  return (
    <div className="relative flex flex-col w-full bg-gray-50/30 gap-5">
      <div className="flex justify-between items-end mb-1">
        <div>
          <h2 className="text-lg font-bold text-gray-900">评测结果</h2>
          {lastEvalParams && (
            <p className="text-xs text-gray-400 mt-1">
              基于参数: 温度 {lastEvalParams.temperature}, 文本块召回数量{' '}
              {lastEvalParams.chunkTopK}
            </p>
          )}
        </div>

        <div className="relative group/btn">
          <button
            onClick={onStartEvaluation}
            disabled={isEvalButtonDisabled}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm ${
              isEvalButtonDisabled
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 hover:shadow-md'
            }`}
          >
            {isEvalButtonDisabled ? (
              <>
                <Check size={16} />
                当前参数已评测
              </>
            ) : (
              <>
                <RotateCcw size={16} />
                {hasEvaluated ? '重新评测' : '开始评测'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* 顶部四个指标卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {(
          [
            'faithfulness',
            'answer_relevance',
            'context_recall',
            'context_precision',
          ] as RagasMetricKey[]
        ).map((key) => (
          <MetricCard
            key={key}
            metricKey={key}
            value={topMetricValues[key]}
            previousValue={previousMetricValues[key]}
          />
        ))}
      </div>

      {/* 下部：样例列表 */}
      <div className="w-full max-w-5xl mx-auto pr-1 custom-scrollbar">
        {result && (
          <div className="flex flex-col gap-2 animate-fade-in pb-10 pt-1">
            <div className="flex items-center justify-between px-1 mb-1">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-500">
                <ListFilter className="w-3.5 h-3.5" />
                <span>详情列表</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-2 mr-3 text-xs font-medium text-gray-600 px-3 py-1.5">
                  <span>{result.total_samples} 样本已评测</span>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-3 text-[12px] text-gray-400">
                <span className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> 通过
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" /> 需优化
                </span>
              </div>
            </div>

            {result.samples.map((sample: EvalSample, idx: number) => (
              <CollapsibleSampleRow key={sample.id} sample={sample} index={idx} />
            ))}

            <div className="text-center text-[12px] text-gray-300 py-6">
              —— 已显示全部内容 ——
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
