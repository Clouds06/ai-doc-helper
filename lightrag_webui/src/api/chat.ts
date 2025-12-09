import axios, { AxiosError } from 'axios'
import { backendBaseUrl } from '../lib/constants'
import { useSettingsStore } from '../stores/settings'
import { Message, QueryMode } from './lightrag'

// 从你的lightrag.ts中导入的类型
export type { QueryMode, Message }

// 查询响应类型
export type QueryResponse = {
  response: string
  references?: Array<{
    reference_id: string
    file_path: string
    page?: number
    content?: string
    score?: number
  }>
}

// 从store获取设置
export const getCurrentSettings = () => {
  const store = useSettingsStore.getState()
  return {
    temperature: store.temperature,
    chunk_top_k: store.chunk_top_k,
    systemPrompt: store.systemPrompt || '',
    mode: store.mode as QueryMode,
    enableRerank: store.enableRerank,
    responseType: store.responseType || 'Multiple Paragraphs',
    maxTotalTokens: store.maxTotalTokens,
    apiKey: store.apiKey
  }
}

// ⭐️ 重要：直接连接到后端，绕过代理问题
const getBackendUrl = () => {
  // 开发环境：直接连接到后端服务
  if (import.meta.env.DEV) {
    return 'http://localhost:9621'
  }
  // 生产环境：使用相对路径
  return ''
}

// 解析NDJSON流的辅助函数
const parseNDJSONStream = async (
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onData: (data: any) => void,
  onError: (error: string) => void
) => {
  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        if (buffer.trim()) {
          const lines = buffer.split('\n').filter(line => line.trim())
          for (const line of lines) {
            try {
              const data = JSON.parse(line)
              onData(data)
            } catch (e) {
              console.error('解析最后一行失败:', e, line)
            }
          }
        }
        break
      }

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')

      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i].trim()
        if (!line) continue

        try {
          const data = JSON.parse(line)
          onData(data)
        } catch (e) {
          console.error('解析行失败:', e, line)
          onError(`解析响应失败: ${e}`)
        }
      }

      buffer = lines[lines.length - 1]
    }
  } catch (error) {
    console.error('读取流失败:', error)
    onError(`读取流失败: ${error}`)
  }
}

// ⭐️ 流式查询函数 - 使用直接连接
export const queryStream = async (
  query: string,
  conversationHistory: Message[] = [],
  onData: (chunk: string) => void,
  onComplete: (fullResponse: string, references?: QueryResponse['references']) => void,
  onError: (error: Error) => void
) => {
  try {
    const settings = getCurrentSettings()
    const backendUrl = getBackendUrl()

    // 准备请求体
    const requestBody = {
      query,
      mode: settings.mode,
      stream: true,
      include_references: true,
      response_type: settings.responseType,
      chunk_top_k: settings.chunk_top_k,
      max_total_tokens: settings.maxTotalTokens,
      conversation_history: conversationHistory,
      enable_rerank: settings.enableRerank,
      user_prompt: settings.systemPrompt
    }

    console.log('🚀 发送流式查询请求:')
    console.log('   目标URL:', `${backendUrl}/query/stream`)
    console.log('   请求数据:', {
      query,
      mode: settings.mode,
      chunk_top_k: settings.chunk_top_k
    })

    // ⭐️ 直接连接到后端
    const response = await fetch(`${backendUrl}/query/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': settings.apiKey || '',
        'Accept': 'application/x-ndjson'
      },
      body: JSON.stringify(requestBody),
    })

    console.log('📥 收到响应:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url
    })

    if (!response.ok) {
      let errorMessage = `HTTP错误 ${response.status}: ${response.statusText}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.detail || errorMessage
      } catch (e) {
        // 忽略解析错误
      }
      throw new Error(errorMessage)
    }

    if (!response.body) {
      throw new Error('响应体为空')
    }

    const reader = response.body.getReader()
    let fullResponse = ''
    let references: QueryResponse['references'] | undefined
    let hasReceivedReferences = false

    // 解析流式响应
    await parseNDJSONStream(
      reader,
      (data) => {
        console.log('📨 收到流数据:', data)

        // 处理引用信息
        if (data.references && !hasReceivedReferences) {
          references = data.references
          hasReceivedReferences = true
          console.log('🔖 收到引用:', references)
        }

        // 处理响应内容块
        if (data.response) {
          fullResponse += data.response
          onData(data.response)
        }

        // 处理错误
        if (data.error) {
          throw new Error(`服务器错误: ${data.error}`)
        }
      },
      (errorMsg) => {
        onError(new Error(errorMsg))
      }
    )

    console.log('✅ 流式响应完成:', {
      长度: fullResponse.length,
      引用数量: references?.length || 0
    })

    onComplete(fullResponse, references)

  } catch (error) {
    console.error('❌ 流式查询失败:', error)
    onError(error instanceof Error ? error : new Error('未知错误'))
  }
}

// 非流式查询函数（备用）- 使用直接连接
export const queryText = async (
  query: string,
  conversationHistory: Message[] = []
): Promise<QueryResponse> => {
  try {
    const settings = getCurrentSettings()
    const backendUrl = getBackendUrl()

    const requestBody = {
      query,
      mode: settings.mode,
      stream: false,
      include_references: true,
      response_type: settings.responseType,
      chunk_top_k: settings.chunk_top_k,
      max_total_tokens: settings.maxTotalTokens,
      conversation_history: conversationHistory,
      enable_rerank: settings.enableRerank,
      user_prompt: settings.systemPrompt
    }

    console.log('📤 发送非流式查询到:', `${backendUrl}/query`)

    const response = await fetch(`${backendUrl}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': settings.apiKey || ''
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      let errorMessage = `HTTP错误 ${response.status}: ${response.statusText}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.detail || errorMessage
      } catch (e) {
        // 忽略
      }
      throw new Error(errorMessage)
    }

    const data = await response.json()
    console.log('📥 收到非流式响应:', data)
    return data

  } catch (error) {
    console.error('❌ 非流式查询失败:', error)
    throw error
  }
}

// 获取结构化数据（用于调试或显示引用详情）
export const queryData = async (
  query: string,
  conversationHistory: Message[] = []
): Promise<any> => {
  try {
    const settings = getCurrentSettings()
    const backendUrl = getBackendUrl()

    const requestBody = {
      query,
      mode: settings.mode,
      include_references: true,
      response_type: settings.responseType,
      chunk_top_k: settings.chunk_top_k,
      max_total_tokens: settings.maxTotalTokens,
      conversation_history: conversationHistory,
      enable_rerank: settings.enableRerank,
      user_prompt: settings.systemPrompt,
      include_chunk_content: true
    }

    const response = await fetch(`${backendUrl}/query/data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': settings.apiKey || ''
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      throw new Error(`HTTP错误 ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('数据查询失败:', error)
    throw error
  }
}

// 发送反馈
export const sendFeedback = async (
  messageId: string,
  feedback: 'like' | 'dislike',
  messageContent: string
): Promise<void> => {
  try {
    console.log('发送反馈:', { messageId, feedback, messageContent })
    // TODO: 实现反馈API
  } catch (error) {
    console.error('发送反馈失败:', error)
  }
}

// 检查后端健康状态
export const checkHealth = async (): Promise<boolean> => {
  try {
    const backendUrl = getBackendUrl()
    const response = await fetch(`${backendUrl}/health`, {
      method: 'GET',
      headers: {
        'X-API-Key': useSettingsStore.getState().apiKey || ''
      }
    })
    return response.ok
  } catch (error) {
    console.error('检查健康状态失败:', error)
    return false
  }
}

// 测试后端连接
export const testConnection = async (): Promise<{
  success: boolean
  message: string
  details?: any
}> => {
  try {
    const backendUrl = getBackendUrl()
    console.log('🔍 测试连接到:', `${backendUrl}/health`)

    const response = await fetch(`${backendUrl}/health`)

    if (response.ok) {
      const data = await response.json()
      return {
        success: true,
        message: '✅ 连接成功',
        details: data
      }
    } else {
      return {
        success: false,
        message: `❌ 连接失败: ${response.status} ${response.statusText}`
      }
    }
  } catch (error) {
    return {
      success: false,
      message: `❌ 连接错误: ${error instanceof Error ? error.message : '未知错误'}`
    }
  }
}

// 错误处理函数
export const handleApiError = (error: any): string => {
  if (error.response) {
    const status = error.response.status
    const data = error.response.data

    switch (status) {
      case 400:
        return `请求错误: ${data.detail || '无效的参数'}`
      case 401:
        return '认证失败，请检查API Key'
      case 403:
        return '权限不足'
      case 404:
        return '接口不存在'
      case 422:
        return `参数验证失败: ${JSON.stringify(data.detail)}`
      case 500:
        return `服务器错误: ${data.detail || '内部服务器错误'}`
      default:
        return `HTTP错误 ${status}: ${data.detail || '未知错误'}`
    }
  } else if (error.request) {
    return '网络连接失败，请检查后端服务是否运行'
  } else {
    return error.message || '未知错误'
  }
}