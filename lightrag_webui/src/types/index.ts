import React from 'react';

export type Tab = 'home' | 'documents' | 'chat';
export type CardTab = {
  id: string;
  label: string;
};

export interface Scenario {
  id: number;
  icon: React.ReactNode;
  title: string;
  query: string;
  desc: string;
  theme: 'yellow' | 'purple' | 'blue' | 'green' | 'red' | 'indigo';
}

export interface DocFile {
  id: string;
  name: string;
  size: string;
  type: 'pdf' | 'doc' | 'sheet' | 'md';
  date: string;
  status: 'ready' | 'indexing' | 'error';
  tags: string[];
}

export interface Citation {
  id: string;
  docName: string;
  content: string;
  page?: number;
  score?: number; // 新增：相似度得分
  scores?: number[]; // 新增：多个片段的得分
  contentList?: string[]; // 新增：多个片段内容
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  queryId?: string;
  isStreaming?: boolean;
  feedback?: 'like' | 'dislike' | null;
  feedbackComment?: string;
  isSubmittingFeedback?: boolean;
  highlightInfo?: {
    text: string;
    citations: Citation[];
  };
}

export interface ChatSession {
  id: string;
  title: string;
  preview: string;
  date: string;
}

// Evaluation
export type EvalStatus = 'idle' | 'loading' | 'done';

export type RagasMetricKey =
  | 'faithfulness'
  | 'answer_relevancy'
  | 'context_recall'
  | 'context_precision';

export interface RagasMetrics {
  faithfulness?: number;
  answer_relevancy?: number;
  context_recall?: number;
  context_precision?: number;
}

export interface EvalSample {
  question: string
  answer: string
  reference?: string
  metrics: RagasMetrics
  contexts: string[]
}

export interface RagEvalResult {
  total_count: number
  averages: {
    faithfulness?: number
    answer_relevancy?: number
    context_recall?: number
    context_precision?: number
  }
  results_file?: string
  samples: EvalSample[]
}
