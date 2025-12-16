import React from 'react'

export type Tab = 'home' | 'documents' | 'chat'
export type CardTab = {
  id: string
  label: string
}

export interface Scenario {
  id: number
  icon: React.ReactNode
  title: string
  query: string
  desc: string
  theme: 'yellow' | 'purple' | 'blue' | 'green' | 'red' | 'indigo'
}

export interface DocFile {
  id: string
  name: string
  size: string
  type: 'pdf' | 'doc' | 'sheet' | 'md'
  date: string
  status: 'ready' | 'indexing' | 'error'
  tags: string[]
}

export interface Citation {
  id: string
  docName: string
  docType: 'pdf' | 'doc' | 'sheet' | 'md'
  score: number
  scores?: number[]
  content: string
  page?: number
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
    text: string
    citations: Citation[]
  }
}

export interface ChatSession {
  id: string
  title: string
  preview: string
  date: string
}

// Evaluation
export type EvalStatus = 'idle' | 'loading' | 'done'

export type RagasMetricKey =
  | 'faithfulness'
  | 'answer_relevancy'
  | 'context_recall'
  | 'context_precision'

export interface RagasMetrics {
  faithfulness?: number
  answer_relevancy?: number
  context_recall?: number
  context_precision?: number
}

export interface EvalSample {
  question: string
  answer: string
  reference?: string
  metrics: RagasMetrics
  ground_truth?: string
  reasoning?: {
    faithfulness?: string
    answer_relevancy?: string
    context_recall?: string
    context_precision?: string
  }
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

export interface ConversationSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  lastUpdated: string;
}

export type DocStatus = 'PENDING' | 'PROCESSING' | 'PREPROCESSED' | 'PROCESSED' | 'FAILED'

export interface DocStatusResponse {
  id: string
  content_summary: string
  content_length: number
  status: DocStatus
  created_at: string
  updated_at: string
  track_id?: string
  chunks_count?: number
  error_msg?: string
  metadata?: any
  file_path: string
}

export interface PaginationInfo {
  page: number
  page_size: number
  total_count: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

export interface PaginatedDocsResponse {
  documents: DocStatusResponse[]
  pagination: PaginationInfo
  status_counts: Record<string, number>
}

export interface DocumentsRequest {
  status_filter?: DocStatus
  page?: number
  page_size?: number
  sort_field?: 'created_at' | 'updated_at' | 'id' | 'file_path'
  sort_direction?: 'asc' | 'desc'
  keyword?: string
  file_type?: string
}

export interface DeleteDocResponse {
  status: string
  message: string
  doc_id: string
}
