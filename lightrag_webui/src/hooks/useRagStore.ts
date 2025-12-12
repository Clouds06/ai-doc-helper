import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_SYSTEM_PROMPT } from '@/lib/constants';
import type { RagEvalResult } from '@/types';

export interface RagEvalState {
  evalResult: RagEvalResult | null;      // 当前评测结果
  prevEvalResult: RagEvalResult | null;  // 上一次评测结果

  setEvalResult: (result: RagEvalResult | null) => void;
  setPrevEvalResult: (result: RagEvalResult | null) => void;
}

export interface RagParamsState {
  temperature: number;    // 温度
  chunk_top_k: number;    // 文本块 Top K
  systemPrompt: string;

  setTemperature: (v: number) => void;
  setChunkTopK: (v: number) => void;
  setSystemPrompt: (v: string) => void;
}

export interface RagChatState {
  queryInput: string;
  setQueryInput: (v: string) => void;

  pendingQuery: string | null;
  setPendingQuery: (v: string | null) => void;
}

export interface RagUploadState {
  uploadNewFiles: File[];
  setUploadNewFiles: (files: File[]) => void;
  clearUploadNewFiles: () => void;
}

export interface RagUIState {
  showOnboarding: boolean;
  setShowOnboarding: (v: boolean) => void;
}

export type RagStore = RagParamsState &
  RagChatState &
  RagUploadState &
  RagUIState &
  RagEvalState;

export const useRagStore = create<RagStore>()(
  persist(
    (set) => ({
      // ==== 评测结果 ====
      evalResult: null,
      prevEvalResult: null,

      setEvalResult: (result) => set({ evalResult: result }),
      setPrevEvalResult: (result) => set({ prevEvalResult: result }),

      // 参数
      temperature: 0.7,
      chunk_top_k: 20,
      systemPrompt: DEFAULT_SYSTEM_PROMPT,

      setTemperature: (v) => set({ temperature: v }),
      setChunkTopK: (v) => set({ chunk_top_k: v }),
      setSystemPrompt: (v) => set({ systemPrompt: v }),

      // Chat
      queryInput: '',
      setQueryInput: (v) => set({ queryInput: v }),

      pendingQuery: null,
      setPendingQuery: (v) => set({ pendingQuery: v }),

      // 上传
      uploadNewFiles: [],
      setUploadNewFiles: (files) => set({ uploadNewFiles: files }),
      clearUploadNewFiles: () => set({ uploadNewFiles: [] }),

      // 新手引导
      showOnboarding: true,
      setShowOnboarding: (v) => set({ showOnboarding: v }),
    }),
    {
      name: 'rag-client-store',
      // 持久化保存长期有用的配置
      partialize: (state) => ({
        temperature: state.temperature,
        chunk_top_k: state.chunk_top_k,
        systemPrompt: state.systemPrompt,
        showOnboarding: state.showOnboarding,
      }),
    },
  ),
);

if (typeof window !== 'undefined') {
  // @ts-expect-error: Add ragStore to window for global access (no type definition)
  window.__ragStore = useRagStore;
}
