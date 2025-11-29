import { useState } from 'react';
import { ParamsTab } from './ParamsTab';
import { EvalTab } from './EvalTab';
import { useRagStore } from '../../hooks/useRagStore';
import { DEFAULT_SYSTEM_PROMPT } from '@/lib/constants';
import { CardHeader } from '../common/CardHeader';
import { CardTabs } from '../common/CardTabs';
import { CardTab } from '@/types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// 评测 / 配置用的参数快照
export type SavedParamsSnapshot = {
  temperature: number;
  chunkTopK: number;
  systemPrompt: string;
};

export const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const [activeTab, setActiveTab] = useState('params');

  // 从 Zustand 取当前全局配置
  const storeTemperature = useRagStore((s) => s.temperature);
  const setTemperature = useRagStore((s) => s.setTemperature);

  const storeChunkTopK = useRagStore((s) => s.chunk_top_k);
  const setChunkTopK = useRagStore((s) => s.setChunkTopK);

  const storeSystemPrompt = useRagStore((s) => s.systemPrompt);
  const setSystemPrompt = useRagStore((s) => s.setSystemPrompt);

  const defaultSystemPrompt =
    (storeSystemPrompt && storeSystemPrompt.trim().length > 0
      ? storeSystemPrompt
      : DEFAULT_SYSTEM_PROMPT);

  const initialSaved: SavedParamsSnapshot = {
    temperature:
      typeof storeTemperature === 'number' ? storeTemperature : 0.7,
    chunkTopK:
      typeof storeChunkTopK === 'number' ? storeChunkTopK : 20,
    systemPrompt: defaultSystemPrompt,
  };

  // 当前“已保存生效”的配置（给 ParamsTab、EvalTab 用）
  const [savedParams, setSavedParams] =
    useState<SavedParamsSnapshot>(initialSaved);

  // 最近一次评测时使用的参数快照
  const [lastEvalParams, setLastEvalParams] =
    useState<SavedParamsSnapshot | null>(null);

  const [evalState, setEvalState] =
    useState<'idle' | 'loading' | 'done'>('idle');

  const hasEvaluated = lastEvalParams !== null;
  const isParamsChanged = hasEvaluated
    ? JSON.stringify(savedParams) !== JSON.stringify(lastEvalParams)
    : true;
  const isEvalButtonDisabled = hasEvaluated && !isParamsChanged;

  // Config Tab 点“保存配置”时调用：同步到本地状态 + Zustand
  const handleSaveConfig = (next: SavedParamsSnapshot) => {
    setSavedParams(next);

    // 推到全局 store，让实际 RAG 请求用这份配置
    setTemperature(next.temperature);
    setChunkTopK(next.chunkTopK);
    setSystemPrompt(next.systemPrompt);

    if (typeof window !== 'undefined' && window.alert) {
      window.alert('配置已保存！现在可以前往评测面板进行新一轮测试。');
    }
  };

  const startEvaluation = () => {
    if (evalState === 'loading') return;
    setEvalState('loading');

    // 模拟一段 loading，然后记录这次评测参数
    setTimeout(() => {
      setEvalState('done');
      setLastEvalParams(savedParams);
    }, 1500);
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
