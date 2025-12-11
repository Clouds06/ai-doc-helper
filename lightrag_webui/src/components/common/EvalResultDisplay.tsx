import { RagasMetricKey, EvalSample } from '@/types'
import { ListFilter, RefreshCw } from 'lucide-react'
import { CollapsibleSampleRow } from './CollapsibleSampleRow'
import { MetricCard } from './MetricCard'
import { useRagStore } from '@/hooks/useRagStore'
import { formatMetrics, getSampleStatus } from '@/lib/utils'
import { useMemo, useState } from 'react'

interface EvalResultDisplayProps {
  onStartEvaluation: () => void
}

export const EvalResultDisplay = ({ onStartEvaluation }: EvalResultDisplayProps) => {
  const evalResult = useRagStore((s) => s.evalResult)
  const result = evalResult ?? null

  const topMetricValues = useMemo(() => formatMetrics(evalResult?.averages), [evalResult?.averages])

  const [filter, setFilter] = useState<'all' | 'pass' | 'fail'>('all')

  const filteredSamples = useMemo(() => {
    if (!result) return []
    if (filter === 'all') return result.samples
    return result.samples.filter((s: EvalSample) => {
      const status = s.metrics ? getSampleStatus(s.metrics) : 'fail'
      return filter === 'pass' ? status === 'pass' : status === 'fail'
    })
  }, [result, filter])

  return (
    <div className="relative flex w-full flex-col gap-2 bg-gray-50/30">
      <div className="mb-1 flex items-end justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">评测结果</h2>
        </div>
        <button
          onClick={onStartEvaluation}
          className="flex items-center gap-1.5 rounded-md bg-indigo-500 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-700"
        >
          <RefreshCw className="h-4 w-4" />
          重新评测
        </button>
      </div>

      {/* 顶部四个指标卡片 */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {(
          [
            'faithfulness',
            'answer_relevancy',
            'context_recall',
            'context_precision'
          ] as RagasMetricKey[]
        ).map((key) => (
          <MetricCard key={key} metricKey={key} value={topMetricValues[key]} />
        ))}
      </div>

      {/* 下部：样例列表 */}
      <div className="custom-scrollbar mx-auto w-full max-w-5xl pr-1">
        {result && (
          <div className="animate-fade-in flex flex-col gap-1 pt-1 pb-10">
            <div className="mb-1 flex items-center px-1">
              <div className="text-md flex flex-1 items-center gap-2 font-bold text-gray-900">
                <ListFilter className="h-3.5 w-3.5" />
                <span>详情列表</span>
              </div>
              <div className="mx-auto hidden items-center gap-3 px-3 py-1.5 text-[13px] font-medium text-gray-400 md:flex">
                <span>共 {result.total_count} 个样本</span>
              </div>
              <div className="hidden flex-1 items-center justify-end sm:flex">
                <div className="flex items-center gap-2 rounded-md bg-gray-100 px-1.5 py-1">
                  <button
                    onClick={() => setFilter('all')}
                    className={`rounded-md px-3 py-1 text-[13px] transition duration-150 focus:outline-none ${filter === 'all' ? 'bg-indigo-500 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
                  >
                    全部
                  </button>

                  <button
                    onClick={() => setFilter('pass')}
                    className={`rounded-md px-3 py-1 text-[13px] transition duration-150 focus:outline-none ${filter === 'pass' ? 'bg-emerald-500 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
                  >
                    通过
                  </button>

                  <button
                    onClick={() => setFilter('fail')}
                    className={`rounded-md px-3 py-1 text-[13px] transition duration-150 focus:outline-none ${filter === 'fail' ? 'bg-red-500 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
                  >
                    需优化
                  </button>
                </div>
              </div>
            </div>

            {filteredSamples.map((sample: EvalSample, idx: number) => (
              <CollapsibleSampleRow key={idx} sample={sample} index={idx} />
            ))}

            <div className="py-6 text-center text-[12px] text-gray-300">—— 已显示全部内容 ——</div>
          </div>
        )}
      </div>
    </div>
  )
}

