import { useState } from 'react';
import { ParamsTab } from './ParamsTab';
import { EvalTab } from './EvalTab';
import { useRagStore } from '../../hooks/useRagStore';
import { DEFAULT_SYSTEM_PROMPT } from '@/lib/constants';
import { CardHeader } from '../common/CardHeader';
import { CardTabs } from '../common/CardTabs';
import { CardTab } from '@/types';
import { RagEvalResult, runRagEvaluation, saveRagParams } from '@/api/lightrag';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (
    message: string,
    type: 'success' | 'warning' | 'info',
  ) => void;
}

// 评测 / 配置用的参数快照
export type SavedParamsSnapshot = {
  temperature: number;
  chunkTopK: number;
  systemPrompt: string;
};

export const SettingsModal = ({ isOpen, onClose, showToast }: SettingsModalProps) => {
  const [activeTab, setActiveTab] = useState('params');

  // 从 Zustand 取当前全局配置
  const storeTemperature = useRagStore((s) => s.temperature);
  const setTemperature = useRagStore((s) => s.setTemperature);

  const storeChunkTopK = useRagStore((s) => s.chunk_top_k);
  const setChunkTopK = useRagStore((s) => s.setChunkTopK);

  const storeSystemPrompt = useRagStore((s) => s.systemPrompt);
  const setSystemPrompt = useRagStore((s) => s.setSystemPrompt);

  const evalResult = useRagStore((s) => s.evalResult);
  const setEvalResult = useRagStore((s) => s.setEvalResult);
  const setPrevEvalResult = useRagStore((s) => s.setPrevEvalResult);

  const defaultSystemPrompt =
    storeSystemPrompt && storeSystemPrompt.trim().length > 0
      ? storeSystemPrompt
      : DEFAULT_SYSTEM_PROMPT;

  const initialSaved: SavedParamsSnapshot = {
    temperature:
      typeof storeTemperature === 'number' ? storeTemperature : 0.7,
    chunkTopK:
      typeof storeChunkTopK === 'number' ? storeChunkTopK : 20,
    systemPrompt: defaultSystemPrompt,
  };

  const [savedParams, setSavedParams] =
    useState<SavedParamsSnapshot>(initialSaved);

  const [lastEvalParams, setLastEvalParams] =
    useState<SavedParamsSnapshot | null>(null);

  const [evalState, setEvalState] =
    useState<'idle' | 'loading' | 'done'>('idle');

  const [, setEvalError] = useState<string | null>(null);

  const hasEvaluated = lastEvalParams !== null;
  const isParamsChanged = hasEvaluated
    ? JSON.stringify(savedParams) !== JSON.stringify(lastEvalParams)
    : true;
  const isEvalButtonDisabled = hasEvaluated && !isParamsChanged;

  const handleSaveConfig = async (next: SavedParamsSnapshot) => {
    setSavedParams(next);

    setTemperature(next.temperature);
    setChunkTopK(next.chunkTopK);
    setSystemPrompt(next.systemPrompt);

    try {
      await saveRagParams({
        temperature: next.temperature,
        chunk_top_k: next.chunkTopK,
        systemPrompt: next.systemPrompt,
      });

      if (typeof window !== 'undefined') {
        showToast('配置已保存！现在可以前往评测面板进行新一轮测试。', 'success');
      }
    } catch (err) {
      console.error('[saveRagParams] failed', err);
      if (typeof window !== 'undefined') {
        showToast('配置保存失败，请稍后重试。', 'warning');
      }
    }
  };

  const startEvaluation = async () => {
    if (evalState === 'loading') return;

    setEvalState('loading');
    setEvalError(null);

    try {
      if (evalResult) {
        setPrevEvalResult(evalResult);
      }

      const result: RagEvalResult = await runRagEvaluation({
        temperature: savedParams.temperature,
        chunk_top_k: savedParams.chunkTopK,
        systemPrompt: savedParams.systemPrompt,
      });

      setEvalResult(result);

      setLastEvalParams(savedParams);

      setEvalState('done');
    } catch (err) {
      console.error('[runRagEvaluation] failed', err);
      setEvalError(
        err instanceof Error ? err.message : '评测失败，请稍后重试。',
      );
      setEvalState('idle');
      showToast('评测失败，请稍后重试。', 'warning');
    }
  };

  if (!isOpen) return null;

  const tabs: CardTab[] = [
    { id: 'params', label: '参数配置' },
    { id: 'eval', label: '评测面板' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />

      <div className="relative w-full max-w-4xl min-h-[80vh] bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] p-4">
        <CardHeader
          title="RAG 设置"
          description="调优参数配置，观察 RAG 系统在真实文档上的表现"
          onClose={onClose}
        />

        <CardTabs
          tabs={tabs}
          activeTab={activeTab}
          onClick={setActiveTab}
        />

        <div className="flex-1 rounded-2xl min-h-0 flex flex-col bg-slate-50/60 ">
          <div className="h-full px-6 py-4 overflow-y-auto scrollbar-none">
            {activeTab === 'params' ? (
              <ParamsTab savedParams={savedParams} onSaveConfig={handleSaveConfig} />
            ) : (
              <EvalTab
                evalState={evalState}
                onStartEvaluation={startEvaluation}
                hasEvaluated={hasEvaluated}
                lastEvalParams={lastEvalParams}
                isEvalButtonDisabled={isEvalButtonDisabled}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
