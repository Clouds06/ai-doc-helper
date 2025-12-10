import { METRIC_META } from '@/lib/constants'
import { RagasMetricKey } from '@/types'
import { HelpCircle } from 'lucide-react'
import { CircularProgress } from './CircularProgress'

type MetricCardProps = {
  metricKey: RagasMetricKey
  value: number
}

export const MetricCard = ({ metricKey, value }: MetricCardProps) => {
  const def = METRIC_META[metricKey]
  const Icon = def.icon

  return (
    <div className="group relative flex flex-1 items-center justify-between rounded-xl border border-gray-100 bg-white p-3.5 transition-all hover:shadow-xs">
      <div className="relative mb-1 flex items-center gap-1">
        <Icon className={`h-5 w-5 text-${def.color}-500`} />
        <span className={'text-[15px] font-medium'}>{def.label}</span>
        <div className="group/tooltip relative">
          <HelpCircle
            size={14}
            className="cursor-help text-gray-300 transition-colors hover:text-indigo-500"
          />
          <div className="pointer-events-none invisible absolute bottom-full left-1/2 z-20 mb-2 w-48 -translate-x-1/2 rounded-lg bg-gray-900 p-3 text-xs text-white opacity-0 shadow-xl transition-all group-hover/tooltip:visible group-hover/tooltip:opacity-100">
            {def.desc}
          </div>
        </div>
      </div>
      <CircularProgress value={value} color={def.color} />
    </div>
  )
}

