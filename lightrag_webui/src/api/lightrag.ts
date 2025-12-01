import axios, { AxiosError } from 'axios'
import { backendBaseUrl } from '../lib/constants'
import { useSettingsStore } from '../stores/settings'
import { navigationService } from '@/services/navigation'
import { errorMessage } from '@/lib/utils'
import { EvalSample } from '@/types'
import { MOCK_EVAL_RESULT } from '@/data/mock'

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
  const token = localStorage.getItem('LIGHTRAG-API-TOKEN');

  // Always include token if it exists, regardless of path
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
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
        if (error.config?.url?.includes('/login')) {
          throw error;
        }
        // For other APIs, navigate to login page
        navigationService.navigateToLogin();

        // return a reject Promise
        return Promise.reject(new Error('Authentication required'));
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

const USE_MOCK = true;

// 评测参数结构
export interface RagEvalParams {
  temperature: number;
  chunk_top_k: number;
  systemPrompt: string;
}

// 评测结果结构
export interface RagEvalResult {
  total_samples: number;
  metrics: {
    faithfulness?: number;
    answer_relevance?: number;
    context_recall?: number;
    context_precision?: number;
  };
  samples: EvalSample[];
  evaluated_at?: string;
}

// TODO: 把 '/rag/config' 替换后端真实的配置保存接口
export async function saveRagParams(params: {
  temperature: number;
  chunk_top_k: number;
  systemPrompt: string;
}) {
  if (USE_MOCK) {
    console.log('[Mock] saveRagParams', params);
    await new Promise((r) => setTimeout(r, 300));
    return { status: 'success' };
  }

  return axiosInstance.post('/rag/save-params', params);
}

// TODO: 把 '/rag/eval' 替换成后端真实的评测接口
export async function runRagEvaluation(params: {
  temperature: number;
  chunk_top_k: number;
  systemPrompt: string;
}) {
  if (USE_MOCK) {
    console.log('[Mock] Using MOCK_EVAL_RESULT');
    await new Promise((res) => setTimeout(res, 600));
    return MOCK_EVAL_RESULT;
  }

  const res = await axiosInstance.post('/rag/evaluate', params);
  return res.data;
}
