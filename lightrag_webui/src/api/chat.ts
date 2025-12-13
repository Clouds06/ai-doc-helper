// src/api/chat.ts
import { backendBaseUrl } from '../lib/constants'

export interface APIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface QueryParams {
  query: string
  history?: APIMessage[]
  mode?: 'global' | 'hybrid' | 'dense' | 'sparse'
  include_references?: boolean
  include_chunk_content?: boolean
  system_prompt?: string
  chunk_top_k?: number
  temperature?: number
  stream?: boolean
}

export interface Reference {
  reference_id: string
  file_path: string
  scores?: number[]
  content?: string[]
  page?: number
}

export interface QueryResponse {
  query_id: string
  response: string
  references?: Reference[]
}

export interface FeedbackParams {
  query_id: string
  feedback_type: 'like' | 'dislike'
  comment?: string
  original_query?: string
  original_response?: string
}

// 流式查询函数
export const queryStream = async (
  query: string,
  history: APIMessage[],
  onData: (chunk: string) => void,
  onComplete: (fullResponse: string, refs?: any[]) => void,
  onError: (error: Error) => void,
  onMetadata: (meta: { query_id?: string, references?: any[] }) => void,
  systemPrompt?: string,
  chunkTopK?: number,
  temperature?: number
): Promise<void> => {
  try {
    const apiUrl = backendBaseUrl
    const endpoint = `${apiUrl}/query/stream`

    const params: QueryParams = {
      query,
      history,
      mode: 'hybrid',
      include_references: true,
      include_chunk_content: true,
      system_prompt: systemPrompt,
      chunk_top_k: chunkTopK,
      temperature: temperature,
      stream: true
    }

    console.log('发送流式查询请求:', {
      url: endpoint,
      params: { ...params, history: params.history?.length }
    })

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      const errorText = await response.text()
      const errorMessage = `API请求失败: ${response.status} ${response.statusText} - ${errorText}`
      console.error(errorMessage)
      onError(new Error(errorMessage))
      return
    }

    const reader = response.body?.getReader()
    if (!reader) {
      const error = new Error('无法读取响应流')
      console.error(error.message)
      onError(error)
      return
    }

    let fullResponse = ''
    let references: any[] = []
    let queryId: string | null = null
    let buffer = '' // 用于处理流式数据的缓冲区

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        // 解码当前块并追加到缓冲区
        buffer += new TextDecoder().decode(value, { stream: true })

        // 按行分割数据
        const lines = buffer.split('\n')

        // 保留最后一个可能不完整的行在缓冲区中
        buffer = lines.pop() || ''

        // 处理每一行完整的 JSON
        for (const line of lines) {
          if (!line.trim()) continue

          try {
            const data = JSON.parse(line)

            // 1. 处理错误
            if (data.error) {
              throw new Error(data.error)
            }

            // 2. 处理引用
            if (data.references) {
              references = data.references
              console.log('提取到references:', references)
              onMetadata({ references })
            }

            // 3. 处理 Query ID
            if (data.query_id) {
              queryId = data.query_id
              console.log('提取到query_id:', queryId)
              onMetadata({ query_id: queryId || undefined })
            }

            // 4. 处理内容响应
            if (data.response) {
              fullResponse += data.response
              onData(data.response) // 只发送纯文本内容
            }

          } catch (e) {
            console.warn('解析流数据行失败:', line, e)
          }
        }
      }

      // 处理缓冲区剩余内容 (虽然 NDJSON 通常以换行符结束，但为了保险)
      if (buffer.trim()) {
        try {
          const data = JSON.parse(buffer)
          if (data.response) {
            fullResponse += data.response
            onData(data.response)
          }
        } catch(_) { // eslint-disable-line @typescript-eslint/no-unused-vars
          /* ignore */
        }
      }

    } finally {
      reader.releaseLock()
    }

    onComplete(fullResponse, references)
  } catch (error) {
    console.error('流式查询失败:', error)
    onError(error instanceof Error ? error : new Error(String(error)))
  }
}

// 提交反馈函数 - 修复版
export const submitFeedback = async (
  queryId: string,
  feedbackType: 'like' | 'dislike',
  comment: string = '',
  userQuery?: string,
  assistantResponse?: string
): Promise<{ status: string; message: string }> => {
  try {
    const apiUrl = backendBaseUrl
    const endpoint = `${apiUrl}/feedback`

    const feedbackData = {
      query_id: queryId,
      feedback_type: feedbackType,
      comment: comment || undefined,
      original_query: userQuery || undefined,
      original_response: assistantResponse || undefined
    }

    console.log('提交反馈:', {
      endpoint,
      feedbackData
    })

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(feedbackData),
    })

    console.log('反馈响应状态:', response.status, response.statusText)

    const responseText = await response.text()
    console.log('反馈响应内容:', responseText)

    if (!response.ok) {
      throw new Error(`反馈提交失败: ${response.status} ${response.statusText} - ${responseText}`)
    }

    let result
    try {
      result = JSON.parse(responseText)
    } catch (_) { // eslint-disable-line @typescript-eslint/no-unused-vars
      result = { status: 'success', message: responseText }
    }

    console.log('反馈提交成功:', result)
    return result
  } catch (error) {
    console.error('提交反馈失败:', error)
    throw error
  }
}

// 非流式查询函数（如果需要）
export const query = async (
  query: string,
  history: APIMessage[] = [],
  systemPrompt?: string,
  chunkTopK?: number,
  temperature?: number
): Promise<QueryResponse> => {
  try {
    const apiUrl = backendBaseUrl
    const endpoint = `${apiUrl}/query`

    const params: QueryParams = {
      query,
      history,
      mode: 'hybrid',
      include_references: true,
      include_chunk_content: true,
      system_prompt: systemPrompt,
      chunk_top_k: chunkTopK,
      temperature: temperature
    }

    console.log('发送查询请求:', { endpoint, params: { ...params, history: params.history?.length } })

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API请求失败: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const result = await response.json()
    console.log('查询成功，收到结果:', result)
    return result
  } catch (error) {
    console.error('查询失败:', error)
    throw error
  }
}
