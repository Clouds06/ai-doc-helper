import { useEffect, useState } from 'react'
import { Thermometer, Search, MessageSquare } from 'lucide-react'
import type { SavedParamsSnapshot } from './SettingsModal'
import Slider from '../common/Slider'
import { NumberInput } from '../common/NumberInput'
import PromptPanel from './PromptPanel'
import { getTempLabel, getChunkLabel } from '@/lib/utils'
import { DEFAULT_SYSTEM_PROMPT, PROMPT_PRESETS } from '@/lib/constants'
import { SettingCard } from '../common/SettingCard'
import { ParamsFooter } from '@/components/common/ParamsFooter'

interface ParamsTabProps {
  savedParams: SavedParamsSnapshot
  onSaveConfig: (next: SavedParamsSnapshot) => void
}

export const ParamsTab = ({ savedParams, onSaveConfig }: ParamsTabProps) => {
  const [editingParams, setEditingParams] = useState<SavedParamsSnapshot>({
    temperature: savedParams.temperature,
    chunkTopK: savedParams.chunkTopK,
    systemPrompt: savedParams.systemPrompt || DEFAULT_SYSTEM_PROMPT
  })

  useEffect(() => {
    setEditingParams({
      temperature: savedParams.temperature,
      chunkTopK: savedParams.chunkTopK,
      systemPrompt: savedParams.systemPrompt || DEFAULT_SYSTEM_PROMPT
    })
  }, [savedParams])

  const tempStatus = getTempLabel(editingParams.temperature)
  const chunkStatus = getChunkLabel(editingParams.chunkTopK)

  const handleReset = () => {
    const defaultPreset = PROMPT_PRESETS.find((p) => p.id === 'default')
    setEditingParams({
      temperature: 0.7,
      chunkTopK: 20,
      systemPrompt: defaultPreset?.content || DEFAULT_SYSTEM_PROMPT
    })
  }

  const handleSaveClick = () => {
    onSaveConfig(editingParams)
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <div className="flex-1 pb-28">
        <div className="animate-fade-in mx-auto max-w-3xl space-y-4 pt-2">
          <SettingCard
            icon={Thermometer}
            title="温度"
            description="控制回答的创造性。值越大回答越发散。"
            valueLabel={editingParams.temperature.toFixed(1)}
            statusLabel={tempStatus.text}
            statusColor={tempStatus.color}
          >
            <Slider
              value={editingParams.temperature}
              onChange={(val) =>
                setEditingParams((prev) => ({
                  ...prev,
                  temperature: val
                }))
              }
              min={0}
              max={1}
              step={0.1}
              minLabel="0（精确）"
              maxLabel="1（创意）"
            />
          </SettingCard>

          <SettingCard
            icon={Search}
            title="文本块召回数量"
            description="文档文本块召回数量。数值越大，召回越全，但也更慢。"
            valueLabel={editingParams.chunkTopK}
            statusLabel={chunkStatus.text}
            statusColor={chunkStatus.color}
          >
            <NumberInput
              value={editingParams.chunkTopK}
              onChange={(val: number) =>
                setEditingParams((prev) => ({
                  ...prev,
                  chunkTopK: val
                }))
              }
              min={1}
              max={100}
              step={1}
              suffix="文本块"
            />
          </SettingCard>

          <SettingCard
            icon={MessageSquare}
            title="系统提示词"
            description="定义模型角色、回答风格等全局行为。"
          >
            <PromptPanel
              value={editingParams.systemPrompt}
              onChange={(val) =>
                setEditingParams((prev) => ({
                  ...prev,
                  systemPrompt: val
                }))
              }
            />
          </SettingCard>
        </div>
      </div>

      <ParamsFooter handleReset={handleReset} handleSaveClick={handleSaveClick} />
    </div>
  )
}

