import { useState, useEffect } from 'react'
import { ParamsTab } from './ParamsTab'
import { EvalTab } from './EvalTab'
import { useRagStore } from '../../hooks/useRagStore'
import { DEFAULT_SYSTEM_PROMPT } from '@/lib/constants'
import { CardHeader } from '../common/CardHeader'
import { CardTabs } from '../common/CardTabs'
import { CardTab, RagEvalResult } from '@/types'
import { runRagEvaluation } from '@/api/lightrag'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  showToast: (message: string, type: 'success' | 'warning' | 'info') => void
}

export type SavedParamsSnapshot = {
  temperature: number
  chunkTopK: number
  systemPrompt: string
}

export const SettingsModal = ({ isOpen, onClose, showToast }: SettingsModalProps) => {
  const [activeTab, setActiveTab] = useState('params')
  const [hasOpened, setHasOpened] = useState(false)

  useEffect(() => {
    if (isOpen && !hasOpened) {
      setHasOpened(true)
    }
  }, [isOpen, hasOpened])

  const storeTemperature = useRagStore((s) => s.temperature)
  const setTemperature = useRagStore((s) => s.setTemperature)

  const storeChunkTopK = useRagStore((s) => s.chunk_top_k)
  const setChunkTopK = useRagStore((s) => s.setChunkTopK)

  const storeSystemPrompt = useRagStore((s) => s.systemPrompt)
  const setSystemPrompt = useRagStore((s) => s.setSystemPrompt)

  const evalResult = useRagStore((s) => s.evalResult)
  const setEvalResult = useRagStore((s) => s.setEvalResult)

  const defaultSystemPrompt =
    storeSystemPrompt && storeSystemPrompt.trim().length > 0
      ? storeSystemPrompt
      : DEFAULT_SYSTEM_PROMPT

  const initialSaved: SavedParamsSnapshot = {
    temperature: typeof storeTemperature === 'number' ? storeTemperature : 0.7,
    chunkTopK: typeof storeChunkTopK === 'number' ? storeChunkTopK : 20,
    systemPrompt: defaultSystemPrompt
  }

  const [savedParams, setSavedParams] = useState<SavedParamsSnapshot>(initialSaved)

  const [evalState, setEvalState] = useState<'idle' | 'loading' | 'done'>('idle')

  const hasEvaluated = evalResult !== null

  const handleSaveConfig = async (next: SavedParamsSnapshot) => {
    setSavedParams(next)

    setTemperature(next.temperature)
    setChunkTopK(next.chunkTopK)
    setSystemPrompt(next.systemPrompt)

    try {
      if (typeof window !== 'undefined') {
        showToast('配置已保存！', 'success')
      }
    } catch (err) {
      console.error('[saveRagParams] failed', err)
      if (typeof window !== 'undefined') {
        showToast('配置保存失败，请稍后重试。', 'warning')
      }
    }
  }

  const startEvaluation = async () => {
    if (evalState === 'loading') return

    setEvalState('loading')

    try {
      if (evalResult) {
        setEvalResult(evalResult)
      }

      const result: RagEvalResult = await runRagEvaluation()
      setEvalResult(result)

      setEvalState('done')
    } catch (err) {
      console.error('[runRagEvaluation] failed', err)
      setEvalState('idle')
      showToast('评测失败，请稍后重试。', 'warning')
    }
  }

  if (!isOpen) return null
  if (!hasOpened) return null

  const handleClose = () => {
    if (evalState === 'loading') {
      showToast('评测进行中，请稍后再关闭', 'warning')
      return
    }
    onClose()
  }

  const tabs: CardTab[] = [
    { id: 'params', label: '参数配置' },
    { id: 'eval', label: '评测面板' }
  ]

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative flex max-h-[90vh] min-h-[80vh] w-full max-w-4xl flex-col rounded-2xl bg-white p-4 shadow-2xl">
        <CardHeader
          title="RAG 设置"
          description="调优参数配置，观察 RAG 系统在真实文档上的表现"
          onClose={handleClose}
        />

        <CardTabs tabs={tabs} activeTab={activeTab} onClick={setActiveTab} />

        <div className="flex min-h-0 flex-1 flex-col rounded-2xl bg-slate-50/60">
          <div className="scrollbar-none h-full overflow-y-auto px-6 py-4">
            {activeTab === 'params' ? (
              <ParamsTab savedParams={savedParams} onSaveConfig={handleSaveConfig} />
            ) : (
              <EvalTab
                evalState={evalState}
                onStartEvaluation={startEvaluation}
                hasEvaluated={hasEvaluated}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsModal
