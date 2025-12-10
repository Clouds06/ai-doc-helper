// src/api/chat.ts
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
  systemPrompt?: string,
  chunkTopK?: number,
  temperature?: number
): Promise<void> => {
  try {
    const apiUrl = 'http://localhost:9621'
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

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        console.log('收到流数据:', chunk.substring(0, 100) + '...')

        // 处理流式数据
        fullResponse += chunk
        onData(chunk)

        // 尝试提取query_id和references
        try {
          const lines = chunk.split('\n').filter(line => line.trim())
          for (const line of lines) {
            if (line.includes('query_id') && !queryId) {
              const match = line.match(/"query_id"\s*:\s*"([^"]+)"/)
              if (match && match[1]) {
                queryId = match[1]
                console.log('提取到query_id:', queryId)
              }
            }

            if (line.includes('references')) {
              try {
                const jsonMatch = line.match(/"references"\s*:\s*(\[[^\]]+\])/)
                if (jsonMatch) {
                  references = JSON.parse(jsonMatch[1])
                  console.log('提取到references:', references)
                }
              } catch (e) {
                console.log('解析references失败:', e)
              }
            }
          }
        } catch (parseError) {
          console.log('解析流数据失败:', parseError)
        }
      }
    } finally {
      reader.releaseLock()
    }

    // 如果query_id还没有提取到，尝试从完整响应中提取
    if (!queryId) {
      try {
        const match = fullResponse.match(/"query_id"\s*:\s*"([^"]+)"/)
        if (match && match[1]) {
          queryId = match[1]
          console.log('从完整响应中提取到query_id:', queryId)
        }
      } catch (e) {
        console.warn('无法提取query_id:', e)
      }
    }

    console.log('流式查询完成，总响应长度:', fullResponse.length)
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
    const apiUrl = 'http://localhost:9621'
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
    } catch (e) {
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
    const apiUrl = 'http://localhost:9621'
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