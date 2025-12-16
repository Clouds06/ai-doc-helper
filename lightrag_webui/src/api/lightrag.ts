import axios, { AxiosError } from 'axios'
import { backendBaseUrl } from '../lib/constants'
import { useSettingsStore } from '../stores/settings'
import { errorMessage } from '@/lib/utils'
import { EvalSample, RagEvalResult } from '@/types'
import {
  DocumentsRequest,
  PaginatedDocsResponse,
  DeleteDocResponse,
} from '../types'

// Types
export type LightragStatus = {
  status: 'healthy'
  working_directory: string
  input_directory: string
  configuration: {
    llm_binding: string
    llm_binding_host: string
    llm_model: string
    embedding_binding: string
    embedding_binding_host: string
    embedding_model: string
    kv_storage: string
    doc_status_storage: string
    graph_storage: string
    vector_storage: string
    workspace?: string
    max_graph_nodes?: string
    enable_rerank?: boolean
    rerank_binding?: string | null
    rerank_model?: string | null
    rerank_binding_host?: string | null
    summary_language: string
    force_llm_summary_on_merge: boolean
    max_parallel_insert: number
    max_async: number
    embedding_func_max_async: number
    embedding_batch_num: number
    cosine_threshold: number
    min_rerank_score: number
    related_chunk_number: number
  }
  update_status?: Record<string, any>
  core_version?: string
  api_version?: string
  auth_mode?: 'enabled' | 'disabled'
  pipeline_busy: boolean
  keyed_locks?: {
    process_id: number
    cleanup_performed: {
      mp_cleaned: number
      async_cleaned: number
    }
    current_status: {
      total_mp_locks: number
      pending_mp_cleanup: number
      total_async_locks: number
      pending_async_cleanup: number
    }
  }
  webui_title?: string
  webui_description?: string
}

export type DocActionResponse = {
  status: 'success' | 'partial_success' | 'failure' | 'duplicated'
  message: string
  track_id?: string
}

/**
 * Specifies the retrieval mode:
 * - "naive": Performs a basic search without advanced techniques.
 * - "local": Focuses on context-dependent information.
 * - "global": Utilizes global knowledge.
 * - "hybrid": Combines local and global retrieval methods.
 * - "mix": Integrates knowledge graph and vector retrieval.
 * - "bypass": Bypasses knowledge retrieval and directly uses the LLM.
 */
export type QueryMode = 'naive' | 'local' | 'global' | 'hybrid' | 'mix' | 'bypass'

export type Message = {
  role: 'user' | 'assistant' | 'system'
  content: string
  thinkingContent?: string
  displayContent?: string
  thinkingTime?: number | null
}

export type QueryRequest = {
  query: string
  /** Specifies the retrieval mode. */
  mode: QueryMode
  /** If True, only returns the retrieved context without generating a response. */
  only_need_context?: boolean
  /** If True, only returns the generated prompt without producing a response. */
  only_need_prompt?: boolean
  /** Defines the response format. Examples: 'Multiple Paragraphs', 'Single Paragraph', 'Bullet Points'. */
  response_type?: string
  /** If True, enables streaming output for real-time responses. */
  stream?: boolean
  /** Number of top items to retrieve. Represents entities in 'local' mode and relationships in 'global' mode. */
  top_k?: number
  /** Maximum number of text chunks to retrieve and keep after reranking. */
  chunk_top_k?: number
  /** Maximum number of tokens allocated for entity context in unified token control system. */
  max_entity_tokens?: number
  /** Maximum number of tokens allocated for relationship context in unified token control system. */
  max_relation_tokens?: number
  /** Maximum total tokens budget for the entire query context (entities + relations + chunks + system prompt). */
  max_total_tokens?: number
  /**
   * Stores past conversation history to maintain context.
   * Format: [{"role": "user/assistant", "content": "message"}].
   */
  conversation_history?: Message[]
  /** Number of complete conversation turns (user-assistant pairs) to consider in the response context. */
  history_turns?: number
  /** User-provided prompt for the query. If provided, this will be used instead of the default value from prompt template. */
  user_prompt?: string
  /** Enable reranking for retrieved text chunks. If True but no rerank model is configured, a warning will be issued. Default is True. */
  enable_rerank?: boolean
}

export type QueryResponse = {
  response: string
}

// Axios instance
const axiosInstance = axios.create({
  baseURL: backendBaseUrl,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor: add api key and check authentication
axiosInstance.interceptors.request.use((config) => {
  const apiKey = useSettingsStore.getState().apiKey
  // const token = localStorage.getItem('LIGHTRAG-API-TOKEN');

  // Always include token if it exists, regardless of path
  // if (token) {
  //   config.headers['Authorization'] = `Bearer ${token}`
  // }
  if (apiKey) {
    config.headers['X-API-Key'] = apiKey
  }
  return config
})

// Interceptor：hanle error
axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      if (error.response?.status === 401) {
        // For login API, throw error directly
        // if (error.config?.url?.includes('/login')) {
        //   throw error;
        // }
        // For other APIs, navigate to login page
        // navigationService.navigateToLogin();

        // return a reject Promise
        return Promise.reject(new Error('Authentication required'))
      }
      throw new Error(
        `${error.response.status} ${error.response.statusText}\n${JSON.stringify(
          error.response.data
        )}\n${error.config?.url}`
      )
    }
    throw error
  }
)

// API methods
export const uploadDocument = async (
  file: File,
  onUploadProgress?: (percentCompleted: number) => void
): Promise<DocActionResponse> => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await axiosInstance.post('/documents/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    // prettier-ignore
    onUploadProgress:
      onUploadProgress !== undefined
        ? (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total!)
          onUploadProgress(percentCompleted)
        }
        : undefined
  })
  return response.data
}

export const checkHealth = async (): Promise<
  LightragStatus | { status: 'error'; message: string }
> => {
  try {
    const response = await axiosInstance.get('/health')
    return response.data
  } catch (error) {
    return {
      status: 'error',
      message: errorMessage(error)
    }
  }
}

export async function runRagEvaluation(): Promise<RagEvalResult> {
  let res = undefined
  res = await axiosInstance.post('/eval/do_eval', null, {
    responseType: 'json',
    timeout: 480000 // 8 minutes
  })

  const body = res ? res.data : undefined

  const rawSamples = Array.isArray(body)
    ? body
    : Array.isArray(body.detailed_results)
      ? body.detailed_results
      : Array.isArray(body.results)
        ? body.results
        : Array.isArray(body.items)
          ? body.items
          : []

  const samples: EvalSample[] = rawSamples.map((s: any) => {
    // 提取ground_truth字段
    const groundTruth = s.ground_truth ?? s.reference ?? undefined
    
    // 提取reasoning字段结构
    let reasoning = undefined
    if (s.reasoning && typeof s.reasoning === 'object') {
      reasoning = {
        faithfulness: s.reasoning.faithfulness ?? undefined,
        answer_relevancy: s.reasoning.answer_relevancy ?? undefined,
        context_recall: s.reasoning.context_recall ?? undefined,
        context_precision: s.reasoning.context_precision ?? undefined
      }
    }

    return {
      question: s.question ?? s.user_input ?? '',
      answer: (s.response ?? s.answer ?? '').toString(),
      reference: s.reference ?? s.ground_truth ?? undefined,
      metrics: {
        faithfulness: typeof s.faithfulness === 'number' ? s.faithfulness : undefined,
        answer_relevancy: typeof s.answer_relevancy === 'number' ? s.answer_relevancy : undefined,
        // 处理字段名称差异 - 支持 context_recall 和 context_relevancy
        context_recall: typeof s.context_recall === 'number' ? s.context_recall :
          typeof s.context_relevancy === 'number' ? s.context_relevancy : undefined,
        context_precision: typeof s.context_precision === 'number' ? s.context_precision : undefined
      },
      ground_truth: groundTruth,
      reasoning: reasoning
    }
  })

  return {
    total_count: typeof body.total_count === 'number' ? body.total_count : samples.length,
    averages: body.averages ?? {
      faithfulness: undefined,
      answer_relevancy: undefined,
      context_recall: undefined,
      context_precision: undefined
    },
    results_file: body.results_file ?? body.resultsFile,
    samples
  }
}

/**
 * 获取分页的文档列表
 * 对应后端: POST /documents/paginated
 */
export const getDocuments = async (params: DocumentsRequest): Promise<PaginatedDocsResponse> => {
  const response = await axiosInstance.post('/documents/paginated', params)
  return response.data
}

/**
 * 删除文档
 * 对应后端: DELETE /documents/delete_document
 */
export const deleteDocument = async (docId: string): Promise<DeleteDocResponse> => {
  const response = await axiosInstance.delete('/documents/delete_document', {
    data: {
      doc_ids: [docId],
      delete_file: true,      // 同时删除源文件
      delete_llm_cache: true  // 同时清理相关的 LLM 缓存
    }
  })
  return response.data
}
