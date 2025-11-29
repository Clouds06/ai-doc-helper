// src/store/useRagStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface RagParamsState {
  // 生成相关参数
  temperature: number;     // 采样温度

  // 检索相关参数
  top_k: number;        // KG Top K
  chunk_top_k: number;      // 文本块 Top K

  // 系统提示词
  systemPrompt: string;

  setTemperature: (v: number) => void;
  setTopK: (v: number) => void;
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

export type RagStore = RagParamsState & RagChatState & RagUploadState & RagUIState;

export const useRagStore = create<RagStore>()(
  persist(
    (set) => ({
      // ==== 生成参数 ====
      temperature: 0.7,

      // ==== 检索参数 ====
      top_k: 40,
      chunk_top_k: 20,

      // ==== System Prompt ====
      systemPrompt:
        '你是一个专业的 AI 文档助手。请根据用户问题和提供的上下文片段，用简洁、准确的语言回答。如果上下文没有相关信息，请明确指出，而不是编造答案。',

      setTemperature: (v) => set({ temperature: v }),
      setTopK: (v) => set({ top_k: v }),
      setChunkTopK: (v) => set({ chunk_top_k: v }),
      setSystemPrompt: (v) => set({ systemPrompt: v }),

      // ==== Chat ====
      queryInput: '',
      setQueryInput: (v) => set({ queryInput: v }),

      pendingQuery: null,
      setPendingQuery: (v) => set({ pendingQuery: v }),

      // ==== 上传 ====
      uploadNewFiles: [],
      setUploadNewFiles: (files) => set({ uploadNewFiles: files }),
      clearUploadNewFiles: () => set({ uploadNewFiles: [] }),

      // ==== UI ====
      showOnboarding: true,
      setShowOnboarding: (v) => set({ showOnboarding: v }),
    }),
    {
      name: 'rag-client-store',
      // 持久化：只保存长期有用的配置
      partialize: (state) => ({
        temperature: state.temperature,
        top_k: state.top_k,
        chunk_top_k: state.chunk_top_k,
        systemPrompt: state.systemPrompt,
        showOnboarding: state.showOnboarding,
      }),
    },
  ),
);
