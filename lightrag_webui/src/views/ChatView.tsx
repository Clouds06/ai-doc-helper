// ChatView.tsx
import { useState, useEffect, useRef } from 'react'
import {
  X,
  Plus,
  MoreVertical,
  Download,
  Trash2,
  Bot,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Paperclip,
  Globe,
  Loader2,
  ArrowRight,
  BookOpen,
  FileText,
  Zap,
  Quote,
  AlertCircle,
  MessageSquare
} from 'lucide-react'
import { ChatMessage, Citation, ConversationSession } from '../types'
import { useRagStore } from '../hooks/useRagStore'
import { queryStream, submitFeedback } from '../api/chat'
import { APIMessage } from '../api/chat'

// 本地存储的键名
const STORAGE_KEY = 'chat_sessions'
const ACTIVE_SESSION_KEY = 'active_session_id'
const FEEDBACK_STORAGE_KEY = 'chat_feedback'

// 时间分组函数
const groupSessionsByTime = (sessions: ConversationSession[]) => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const groups: { [key: string]: ConversationSession[] } = {
    today: [],
    yesterday: [],
    earlier: []
  }

  sessions.forEach(session => {
    const sessionDate = new Date(session.lastUpdated)
    const sessionDay = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate())

    if (sessionDay.getTime() === today.getTime()) {
      groups.today.push(session)
    } else if (sessionDay.getTime() === yesterday.getTime()) {
      groups.yesterday.push(session)
    } else {
      groups.earlier.push(session)
    }
  })

  return groups
}

// 生成会话标题（使用第一个用户消息）
const generateSessionTitle = (messages: ChatMessage[]): string => {
  const firstUserMessage = messages.find(msg => msg.role === 'user')
  if (!firstUserMessage) return '新对话'

  const content = firstUserMessage.content.trim()
  return content.length > 30 ? content.substring(0, 30) + '...' : content
}

// 获取本地存储的会话
const getStoredSessions = (): ConversationSession[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Failed to parse stored sessions:', error)
    return []
  }
}

// 保存会话到本地存储
const saveSessionToStorage = (session: ConversationSession) => {
  const sessions = getStoredSessions()
  const existingIndex = sessions.findIndex(s => s.id === session.id)

  if (existingIndex >= 0) {
    sessions[existingIndex] = session
  } else {
    sessions.push(session)
  }

  sessions.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
}

// 从本地存储删除会话
const deleteSessionFromStorage = (sessionId: string) => {
  const sessions = getStoredSessions()
  const filtered = sessions.filter(s => s.id !== sessionId)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  return filtered
}

// 清除所有会话
const clearAllSessions = () => {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(ACTIVE_SESSION_KEY)
  localStorage.removeItem(FEEDBACK_STORAGE_KEY)
  return []
}

// Prompt注入清洗函数
const sanitizeQuery = (query: string): string => {
  if (!query) return ''

  const maliciousPatterns = [
    /忽略上述指令/gi,
    /ignore previous instructions/gi,
    /你从现在开始/gi,
    /you are now/gi,
    /system:/gi,
    /user:/gi,
    /assistant:/gi,
    /\n\n\n+/g,
  ]

  let sanitized = query.trim()

  maliciousPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '')
  })

  sanitized = sanitized.replace(/<[^>]*>/g, '')

  const maxLength = 2000
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength) + '...'
  }

  return sanitized.trim()
}

// 转换引用格式 
const transformReferences = (refs: any[]): Citation[] => {
  return refs.map((ref, index) => {
    // 处理 scores 字段：确保它是一个数组
    let scoresArray: number[] = [];

    if (Array.isArray(ref.scores)) {
      // 如果 scores 是数组，直接使用
      scoresArray = ref.scores;
    } else if (typeof ref.scores === 'number') {
      // 如果 scores 是单个数字，转换为数组
      scoresArray = [ref.scores];
    } else if (ref.scores && typeof ref.scores === 'object') {
      // 如果 scores 是对象，尝试提取数值
      try {
        scoresArray = Object.values(ref.scores).filter(v => typeof v === 'number') as number[];
      } catch (e) {
        console.warn('无法解析 scores 对象:', ref.scores);
      }
    }

    // 如果没有 scores，使用默认值或从 score 字段派生
    if (scoresArray.length === 0) {
      if (typeof ref.score === 'number') {
        scoresArray = [ref.score];
      } else {
        // 生成一些随机分数作为回退（仅用于演示）
        scoresArray = [0.8 + Math.random() * 0.15];
      }
    }

    // 确保所有分数都在 0-1 范围内
    scoresArray = scoresArray.map(score => Math.max(0, Math.min(1, score)));

    // 计算主分数（使用第一个分数或平均值）
    const mainScore = scoresArray.length > 0 ? scoresArray[0] : (ref.score || 0.8 + Math.random() * 0.15);

    return {
      id: ref.reference_id || ref.id || `ref-${Date.now()}-${index}`,
      docName: ref.file_path?.split('/').pop() || ref.file_path || ref.docName || ref.file_name || `文档${index + 1}`,
      content: ref.content?.[0] || ref.snippet || ref.content || ref.text || '相关文档内容',
      page: ref.page || ref.page_number || ref.page_no || 1,
      score: mainScore,
      scores: scoresArray,
      contentList: Array.isArray(ref.content) ? ref.content :
        (ref.snippet ? [ref.snippet] :
          (ref.text ? [ref.text] : ['相关文档内容'])),
      docType: ref.docType ?? 'unknown'
    };
  });
};

// 提取高亮文本
const extractHighlightText = (response: string): string => {
  // 简单策略：取第一句话
  const sentences = response.split(/[。！？.?!]/)
  if (sentences.length > 0) {
    const firstSentence = sentences[0].trim()
    return firstSentence + (firstSentence.endsWith('。') ? '' : '。')
  }

  // 如果没有句子分隔符，取前50个字符
  return response.length > 50 ? response.substring(0, 50) + '...' : response
}

// 友好的错误消息转换
const getFriendlyErrorMessage = (error: string): string => {
  const errorLower = error.toLowerCase()

  // 检查是否包含特定的错误信息
  if (errorLower.includes('no relevant context') ||
    errorLower.includes('no relevant context found')) {
    return '抱歉，我没有在知识库中找到与这个问题相关的内容。\n\n这可能是因为：\n1. 知识库中还没有上传相关文档\n2. 您的查询超出了现有文档的范围\n3. 您可以尝试更具体的问题或上传相关文档'
  }

  if (errorLower.includes('query text must be at least 3 characters')) {
    return '问题太短了，请输入至少3个字符'
  }

  if (errorLower.includes('network') || errorLower.includes('fetch')) {
    return '网络连接出现问题，请检查您的网络连接并稍后重试'
  }

  if (errorLower.includes('timeout') || errorLower.includes('timed out')) {
    return '请求超时，请稍后重试'
  }

  if (errorLower.includes('authentication') || errorLower.includes('unauthorized')) {
    return '认证失败，请检查API配置'
  }

  if (errorLower.includes('internal server') || errorLower.includes('server error')) {
    return '服务器内部错误，请稍后重试'
  }

  // 默认返回原始错误，但用更友好的方式呈现
  return `抱歉，处理您的请求时遇到了问题：${error}`
}

// 模拟流式输出的辅助函数
const simulateStreaming = (
  fullText: string,
  onChunk: (chunk: string) => void,
  onComplete: () => void,
  speed: number = 30
) => {
  let index = 0
  const textLength = fullText.length

  const streamNext = () => {
    if (index < textLength) {
      const chunkSize = Math.min(1 + Math.floor(Math.random() * 3), textLength - index)
      const chunk = fullText.substring(index, index + chunkSize)
      onChunk(chunk)
      index += chunkSize

      const delay = speed + Math.random() * 20
      setTimeout(streamNext, delay)
    } else {
      onComplete()
    }
  }

  streamNext()
}

export const ChatView = ({ initialQuery }: { initialQuery?: string }) => {
  const {
    queryInput,
    setQueryInput,
    pendingQuery,
    setPendingQuery,
    temperature,
    chunk_top_k,
    systemPrompt
  } = useRagStore()

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState(initialQuery || queryInput || '')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeCitations, setActiveCitations] = useState<Citation[] | null>(null)
  const [showRefPanel, setShowRefPanel] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [sessions, setSessions] = useState<ConversationSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [showInputError, setShowInputError] = useState<string | null>(null)
  const [showFeedbackModal, setShowFeedbackModal] = useState<string | null>(null)
  const [feedbackComment, setFeedbackComment] = useState<string>('')
  const [pendingFeedback, setPendingFeedback] = useState<{ msgId: string, type: 'like' | 'dislike' } | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const pendingQueryProcessedRef = useRef(false)
  const inputErrorTimerRef = useRef<NodeJS.Timeout | null>(null)

  // 清理计时器
  useEffect(() => {
    return () => {
      if (inputErrorTimerRef.current) {
        clearTimeout(inputErrorTimerRef.current)
      }
    }
  }, [])

  // 显示输入错误提示
  const showInputErrorAlert = (message: string) => {
    setShowInputError(message)

    if (inputErrorTimerRef.current) {
      clearTimeout(inputErrorTimerRef.current)
    }

    inputErrorTimerRef.current = setTimeout(() => {
      setShowInputError(null)
    }, 3000)
  }

  // 处理从首页跳转过来的pendingQuery - 修复：确保只处理一次
  useEffect(() => {
    if (!pendingQuery || pendingQueryProcessedRef.current) return

    console.log('处理pendingQuery:', pendingQuery)

    const sanitizedQuery = sanitizeQuery(pendingQuery)
    console.log('清洗后的query:', sanitizedQuery)

    if (!sanitizedQuery) {
      console.warn('清洗后的查询为空，跳过处理')
      setPendingQuery(null)
      return
    }

    // 检查长度
    if (sanitizedQuery.trim().length < 3) {
      console.warn('查询太短，跳过处理')
      showInputErrorAlert('问题太短了，请输入至少3个字符')
      setPendingQuery(null)
      return
    }

    pendingQueryProcessedRef.current = true

    // 设置到输入框
    setInput(sanitizedQuery)
    setQueryInput(sanitizedQuery)

    // 如果没有活动会话，创建一个新会话
    let sessionToUse = activeSessionId
    if (!sessionToUse) {
      const newSessionId = Date.now().toString()
      const newSession: ConversationSession = {
        id: newSessionId,
        title: generateSessionTitle([{
          id: 'pending-user',
          role: 'user',
          content: sanitizedQuery,
          timestamp: new Date()
        }]),
        messages: messages.length === 0 ? [
          {
            id: '0',
            role: 'assistant',
            content: '你好！我是你的知识库助手。你可以问我关于已上传文档的任何问题，或者让我帮你总结分析。',
            timestamp: new Date()
          }
        ] : messages,
        lastUpdated: new Date().toISOString()
      }

      sessionToUse = newSessionId
      setActiveSessionId(newSessionId)
      saveSessionToStorage(newSession)
      setSessions(prev => [newSession, ...prev])
      localStorage.setItem(ACTIVE_SESSION_KEY, newSessionId)
    }

    setTimeout(() => {
      handleSendDirect(sanitizedQuery, sessionToUse!)
      setPendingQuery(null)
    }, 100)

  }, [pendingQuery])

  // 初始化：加载会话和活动会话
  useEffect(() => {
    const storedSessions = getStoredSessions()
    setSessions(storedSessions)

    const storedActiveId = localStorage.getItem(ACTIVE_SESSION_KEY)
    if (storedActiveId) {
      const activeSession = storedSessions.find(s => s.id === storedActiveId)
      if (activeSession) {
        setActiveSessionId(storedActiveId)
        setMessages(activeSession.messages)
        return
      }
    }

    if (messages.length === 0 && !initialQuery) {
      const welcomeMessage: ChatMessage = {
        id: '0',
        role: 'assistant',
        content: '你好！我是你的知识库助手。你可以问我关于已上传文档的任何问题，或者让我帮你总结分析。',
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
    } else if (messages.length === 0 && initialQuery) {
      if (initialQuery.trim().length >= 3) {
        handleSend()
      }
    }
  }, [])

  // 保存当前会话到本地存储
  useEffect(() => {
    if (messages.length > 0 && activeSessionId) {
      const session = sessions.find(s => s.id === activeSessionId)
      if (session) {
        const updatedSession = {
          ...session,
          messages,
          lastUpdated: new Date().toISOString()
        }
        saveSessionToStorage(updatedSession)

        setSessions(prev =>
          prev.map(s => s.id === activeSessionId ? updatedSession : s)
        )
      }
    }
  }, [messages, activeSessionId])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, isTyping])

  // 直接发送查询（用于pendingQuery）
  const handleSendDirect = (queryText: string, sessionId: string) => {
    if (!queryText.trim() || isTyping) return

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: queryText,
      timestamp: new Date()
    }

    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setIsTyping(true)

    sendQueryToAPI(queryText, newMessages)
  }

  const handleSend = () => {
    const trimmedInput = input.trim()

    if (!trimmedInput) {
      showInputErrorAlert('请输入问题内容')
      return
    }

    if (trimmedInput.length < 3) {
      showInputErrorAlert('问题太短了，请输入至少3个字符')
      return
    }

    if (isTyping) {
      showInputErrorAlert('AI正在思考中，请稍候...')
      return
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmedInput,
      timestamp: new Date()
    }

    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setIsTyping(true)

    if (!activeSessionId) {
      const newSessionId = Date.now().toString()
      const newSession: ConversationSession = {
        id: newSessionId,
        title: generateSessionTitle(newMessages),
        messages: newMessages,
        lastUpdated: new Date().toISOString()
      }

      setActiveSessionId(newSessionId)
      saveSessionToStorage(newSession)
      setSessions(prev => [newSession, ...prev])
      localStorage.setItem(ACTIVE_SESSION_KEY, newSessionId)
    }

    sendQueryToAPI(trimmedInput, newMessages)
  }

  // 发送查询
  const sendQueryToAPI = async (queryText: string, currentMessages: ChatMessage[]) => {
    if (isTyping) return

    const aiMsgId = (Date.now() + 1).toString()

    const aiMsg: ChatMessage = {
      id: aiMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    }

    setMessages(prev => [...prev, aiMsg])
    setIsTyping(true)
    setConnectionError(null)

    try {
      const conversationHistory: APIMessage[] = currentMessages
        .slice(0, -1)
        .map(msg => ({
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content
        }))

      console.log('发送API请求:', {
        query: queryText,
        historyLength: conversationHistory.length,
        systemPrompt,
        chunk_top_k,
        temperature
      })

      let fullResponse = ''
      let references: any[] = []
      let queryId: string | null = null
      let hasReceivedData = false
      let isNoContextError = false // 新增：标记是否是无上下文错误

      // 使用流式API
      await queryStream(
        queryText,
        conversationHistory,
        // 处理数据块 - 修复：立即检测并替换错误消息
        (chunk: string) => {
          console.log('收到API数据块:', chunk.substring(0, 100) + '...')
          hasReceivedData = true

          // 检查是否包含"no relevant context"错误
          const chunkLower = chunk.toLowerCase()
          if (chunkLower.includes('no relevant context')) {
            console.log('检测到无相关上下文错误，替换为友好消息')
            isNoContextError = true

            // 清空之前接收的内容
            fullResponse = ''

            // 友好的错误消息
            const friendlyResponse = '抱歉，我没有在知识库中找到与这个问题相关的内容。\n\n这可能是因为：\n1. 知识库中还没有上传相关文档\n2. 您的查询超出了现有文档的范围\n3. 您可以尝试更具体的问题或上传相关文档'

            // 如果是错误响应，开始流式输出友好消息
            if (!fullResponse.includes('抱歉')) {
              // 使用流式输出友好错误消息
              simulateStreaming(
                friendlyResponse,
                (friendlyChunk: string) => {
                  fullResponse += friendlyChunk
                  setMessages(prev =>
                    prev.map((msg) => {
                      if (msg.id === aiMsgId) {
                        return { ...msg, content: fullResponse }
                      }
                      return msg
                    })
                  )
                },
                () => {
                  // 完成时设置最终消息
                  const finalAiMsg: ChatMessage = {
                    id: aiMsgId,
                    role: 'assistant',
                    content: fullResponse,
                    timestamp: new Date(),
                    queryId: queryId || undefined,
                    isStreaming: false
                  }

                  setMessages(prev =>
                    prev.map((msg) => (msg.id === aiMsgId ? finalAiMsg : msg))
                  )
                  setIsTyping(false)
                },
                30
              )
            }
            return // 跳过原始错误内容的处理
          }

          // 尝试提取query_id
          try {
            if (chunk.includes('query_id')) {
              const match = chunk.match(/"query_id"\s*:\s*"([^"]+)"/)
              if (match && match[1] && !queryId) {
                queryId = match[1]
                console.log('提取到query_id:', queryId)

                setMessages(prev =>
                  prev.map((msg) => {
                    if (msg.id === aiMsgId) {
                      return { ...msg, queryId: match[1] }
                    }
                    return msg
                  })
                )
              }
            }
          } catch (parseError) {
            console.log('解析query_id失败:', parseError)
          }

          // 只有不是错误响应才累加原始内容
          if (!isNoContextError) {
            fullResponse += chunk

            // 实时更新消息内容
            setMessages(prev =>
              prev.map((msg) => {
                if (msg.id === aiMsgId) {
                  return { ...msg, content: fullResponse }
                }
                return msg
              })
            )
          }
        },
        // 完成回调 - 修复：处理非错误响应的完成
        (completeResponse: string, refs?: any) => {
          console.log('API响应完成')
          console.log('完整响应:', completeResponse.substring(0, 200) + '...')
          console.log('query_id:', queryId)
          console.log('引用数据:', refs)
          console.log('是否为无上下文错误:', isNoContextError)

          references = refs || []

          // 如果已经是错误响应并正在流式输出友好消息，不处理这里
          if (isNoContextError) {
            console.log('已经是无上下文错误响应，跳过完成回调')
            return
          }

          // 再次检查是否是错误响应
          const responseLower = completeResponse.toLowerCase()
          const isNoContext = responseLower.includes('no relevant context') ||
            responseLower.includes('no relevant context found')

          if (isNoContext) {
            console.log('完成回调中检测到无相关上下文，显示流式错误消息')
            isNoContextError = true

            const friendlyResponse = '抱歉，我没有在知识库中找到与这个问题相关的内容。\n\n这可能是因为：\n1. 知识库中还没有上传相关文档\n2. 您的查询超出了现有文档的范围\n3. 您可以尝试更具体的问题或上传相关文档'

            // 清空之前的内容，开始流式输出友好错误消息
            fullResponse = ''

            simulateStreaming(
              friendlyResponse,
              (chunk: string) => {
                fullResponse += chunk
                setMessages(prev =>
                  prev.map((msg) => {
                    if (msg.id === aiMsgId) {
                      return { ...msg, content: fullResponse }
                    }
                    return msg
                  })
                )
              },
              () => {
                const finalAiMsg: ChatMessage = {
                  id: aiMsgId,
                  role: 'assistant',
                  content: fullResponse,
                  timestamp: new Date(),
                  queryId: queryId || undefined,
                  isStreaming: false
                }

                setMessages(prev =>
                  prev.map((msg) => (msg.id === aiMsgId ? finalAiMsg : msg))
                )
                setIsTyping(false)
              },
              30
            )
            return
          }

          // 处理正常响应
          if (references && references.length > 0) {
            console.log('收到引用，处理正常响应')

            const citations = transformReferences(references)
            const highlightText = extractHighlightText(completeResponse)

            const finalAiMsg: ChatMessage = {
              id: aiMsgId,
              role: 'assistant',
              content: completeResponse,
              timestamp: new Date(),
              queryId: queryId || undefined,
              isStreaming: false,
              highlightInfo: {
                text: highlightText,
                citations: citations
              }
            }

            setMessages(prev =>
              prev.map((msg) => (msg.id === aiMsgId ? finalAiMsg : msg))
            )
            setIsTyping(false)
          } else {
            console.log('普通响应，直接显示')
            // 普通响应，直接显示
            const finalAiMsg: ChatMessage = {
              id: aiMsgId,
              role: 'assistant',
              content: completeResponse,
              timestamp: new Date(),
              queryId: queryId || undefined,
              isStreaming: false
            }

            setMessages(prev =>
              prev.map((msg) => (msg.id === aiMsgId ? finalAiMsg : msg))
            )
            setIsTyping(false)
          }
        },
        // 错误回调
        (error: Error) => {
          console.error('API调用失败:', error)
          setConnectionError(error.message)

          const friendlyError = getFriendlyErrorMessage(error.message)

          simulateStreaming(
            friendlyError,
            (chunk: string) => {
              setMessages(prev =>
                prev.map((msg) => {
                  if (msg.id === aiMsgId) {
                    const currentContent = msg.content || ''
                    return { ...msg, content: currentContent + chunk }
                  }
                  return msg
                })
              )
            },
            () => {
              const errorMsg: ChatMessage = {
                id: aiMsgId,
                role: 'assistant',
                content: friendlyError,
                timestamp: new Date(),
                queryId: queryId || undefined,
                isStreaming: false
              }

              setMessages(prev =>
                prev.map((msg) => (msg.id === aiMsgId ? errorMsg : msg))
              )
              setIsTyping(false)
            },
            30
          )
        },
        systemPrompt,
        chunk_top_k,
        temperature
      )

    } catch (error) {
      console.error('查询过程发生错误:', error)
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      setConnectionError(errorMessage)

      const friendlyError = getFriendlyErrorMessage(errorMessage)

      simulateStreaming(
        friendlyError,
        (chunk: string) => {
          setMessages(prev =>
            prev.map((msg) => {
              if (msg.id === aiMsgId) {
                const currentContent = msg.content || ''
                return { ...msg, content: currentContent + chunk }
              }
              return msg
            })
          )
        },
        () => {
          const errorMsg: ChatMessage = {
            id: aiMsgId,
            role: 'assistant',
            content: friendlyError,
            timestamp: new Date(),
            isStreaming: false
          }

          setMessages(prev =>
            prev.map((msg) => (msg.id === aiMsgId ? errorMsg : msg))
          )
          setIsTyping(false)
        },
        30
      )
    }
  }

  const handleNewConversation = () => {
    if (activeSessionId && messages.length > 1) {
      const session = sessions.find(s => s.id === activeSessionId)
      if (session) {
        const updatedSession = {
          ...session,
          messages,
          lastUpdated: new Date().toISOString()
        }
        saveSessionToStorage(updatedSession)
      }
    }

    pendingQueryProcessedRef.current = false

    setMessages([
      {
        id: '0',
        role: 'assistant',
        content: '你好！我是你的知识库助手。你可以问我关于已上传文档的任何问题，或者让我帮你总结分析。',
        timestamp: new Date()
      }
    ])
    setActiveSessionId(null)
    localStorage.removeItem(ACTIVE_SESSION_KEY)
    setInput('')
    setQueryInput('')
    setConnectionError(null)
  }

  const handleSelectSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId)
    if (session) {
      setActiveSessionId(sessionId)
      setMessages(session.messages)
      localStorage.setItem(ACTIVE_SESSION_KEY, sessionId)
      setInput('')
      setQueryInput('')
      setConnectionError(null)
    }
  }

  const handleDeleteSession = (sessionId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }

    const updatedSessions = deleteSessionFromStorage(sessionId)
    setSessions(updatedSessions)
    setShowDeleteConfirm(null)

    if (sessionId === activeSessionId) {
      handleNewConversation()
    }
  }

  const handleDeleteAllSessions = () => {
    const cleared = clearAllSessions()
    setSessions(cleared)
    handleNewConversation()
  }

  const toggleFeedback = (msgId: string, type: 'like' | 'dislike', e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }

    console.log('点击反馈按钮:', { msgId, type })

    const message = messages.find(msg => msg.id === msgId)
    if (!message) {
      console.error('未找到消息:', msgId)
      return
    }

    console.log('找到消息:', {
      messageId: message.id,
      hasQueryId: !!message.queryId,
      queryId: message.queryId,
      currentFeedback: message.feedback
    })

    // 如果有queryId，弹出反馈模态框
    if (message.queryId) {
      console.log('有queryId，弹出模态框')
      setPendingFeedback({ msgId, type })
      setShowFeedbackModal(msgId)
    } else {
      console.log('没有queryId，只更新UI')
      // 如果没有queryId，只更新UI
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== msgId) return msg
          const newFeedback = msg.feedback === type ? null : type
          console.log('更新UI反馈:', newFeedback)
          return { ...msg, feedback: newFeedback }
        })
      )
    }
  }

  const handleSubmitFeedback = async (msgId: string, type: 'like' | 'dislike', comment: string) => {
    const message = messages.find(msg => msg.id === msgId)
    if (!message || !message.queryId) {
      showInputErrorAlert('无法提交反馈：缺少查询ID')
      return
    }

    // 先更新UI状态为提交中
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== msgId) return msg
        return {
          ...msg,
          isSubmittingFeedback: true
        }
      })
    )

    try {
      // 找到对应的用户消息
      const userMessage = messages.find(msg =>
        msg.role === 'user' &&
        messages.indexOf(msg) < messages.indexOf(message)
      )

      await submitFeedback(
        message.queryId!,
        type,
        comment,
        userMessage?.content,
        message.content
      )

      // 提交成功后更新UI
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== msgId) return msg
          return {
            ...msg,
            feedback: type,
            feedbackComment: comment,
            isSubmittingFeedback: false
          }
        })
      )

      setShowFeedbackModal(null)
      setFeedbackComment('')
      setPendingFeedback(null)

      // 显示成功提示
      showInputErrorAlert(`反馈提交成功！${type === 'like' ? '👍' : '👎'}`)
    } catch (error) {
      console.error('反馈提交失败:', error)
      showInputErrorAlert('反馈提交失败，请稍后重试')

      // 提交失败，恢复UI状态
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== msgId) return msg
          return {
            ...msg,
            isSubmittingFeedback: false
          }
        })
      )
    }
  }

  const handleHighlightClick = (citations: Citation[]) => {
    setActiveCitations(citations)
    setShowRefPanel(true)
  }

  const handleCitationsButtonClick = (citations: Citation[]) => {
    setActiveCitations(citations)
    setShowRefPanel(true)
  }

  const renderMessageContent = (msg: ChatMessage) => {
    if (msg.role === 'user' || !msg.highlightInfo || msg.isStreaming) return msg.content

    const fullText = msg.content
    const highlightText = msg.highlightInfo.text

    if (!fullText.includes(highlightText)) return fullText

    const parts = fullText.split(highlightText)
    return (
      <>
        {parts[0]}
        <span
          onClick={() => handleHighlightClick(msg.highlightInfo!.citations)}
          className="cursor-pointer rounded-sm border-b-2 border-blue-200 bg-blue-50 px-0.5 text-blue-700 transition-colors hover:bg-blue-100"
          title="点击查看引用来源"
        >
          {highlightText}
        </span>
        {parts[1]}
      </>
    )
  }

  const groupedSessions = groupSessionsByTime(sessions)

  return (
    <div className="relative flex h-full overflow-hidden bg-white">
      {/* 删除确认对话框 */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">确认删除</h3>
            <p className="mb-6 text-sm text-gray-600">
              确定要删除这个对话吗？此操作无法撤销。
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={() => handleDeleteSession(showDeleteConfirm)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 输入错误提示 */}
      {showInputError && (
        <div className="absolute inset-x-0 top-4 z-50 flex justify-center px-4">
          <div className="flex w-full max-w-md items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 shadow-lg">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{showInputError}</span>
            <button
              onClick={() => setShowInputError(null)}
              className="ml-auto text-yellow-600 hover:text-yellow-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* 反馈模态框 */}
      {showFeedbackModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">提供反馈</h3>
            </div>
            <p className="mb-4 text-sm text-gray-600">
              请告诉我们为什么给出这个评价？您的反馈将帮助AI改进回答质量。
            </p>
            <textarea
              value={feedbackComment}
              onChange={(e) => setFeedbackComment(e.target.value)}
              placeholder="例如：回答太啰嗦了、格式不对、信息不准确等..."
              className="mb-4 h-24 w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-50"
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowFeedbackModal(null)
                  setFeedbackComment('')
                  setPendingFeedback(null)
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={() => {
                  const type = pendingFeedback?.type || 'like'
                  handleSubmitFeedback(showFeedbackModal, type, feedbackComment)
                }}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                提交反馈
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 侧边栏 */}
      <div
        className={`absolute z-20 flex h-full flex-shrink-0 flex-col border-r border-gray-200 bg-slate-50 transition-all duration-300 md:relative ${sidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full overflow-hidden md:w-0 md:translate-x-0'} `}
      >
        <div className="flex items-center justify-between p-4">
          <h3 className="text-sm font-semibold text-slate-700">历史对话</h3>
          <div className="flex items-center gap-1">
            {sessions.length > 0 && (
              <div className="relative">
                <button
                  onClick={handleDeleteAllSessions}
                  className="rounded p-1 text-xs text-red-500 hover:bg-red-50"
                  title="清空所有历史"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            <button onClick={() => setSidebarOpen(false)} className="p-1 text-gray-400 md:hidden">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="p-3">
          <button
            onClick={handleNewConversation}
            className="mb-4 flex w-full items-center gap-2 rounded-lg border border-blue-100 bg-white px-3 py-2 text-sm text-blue-600 shadow-sm transition-all hover:bg-blue-50 hover:shadow"
          >
            <Plus className="h-4 w-4" />
            <span>新对话</span>
          </button>
          <div className="space-y-4">
            {groupedSessions.today.length > 0 && (
              <div>
                <div className="mb-2 px-2 text-[10px] font-medium tracking-wider text-gray-400 uppercase">
                  今天
                </div>
                {groupedSessions.today.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => handleSelectSession(session.id)}
                    className={`group relative mb-1 cursor-pointer rounded-lg border p-2 transition-all ${session.id === activeSessionId ? 'border-blue-300 bg-blue-50' : 'border-transparent bg-white hover:border-gray-200 hover:bg-gray-100'}`}
                  >
                    <div className="pr-6">
                      <div className="truncate text-sm font-medium text-gray-700 transition-colors group-hover:text-blue-600">
                        {session.title}
                      </div>
                      <div className="truncate text-[10px] text-gray-400">
                        {new Date(session.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowDeleteConfirm(session.id)
                      }}
                      className="absolute right-2 top-2 hidden rounded p-0.5 text-gray-400 hover:bg-gray-200 hover:text-red-500 group-hover:block"
                      title="删除对话"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {groupedSessions.yesterday.length > 0 && (
              <div>
                <div className="mb-2 px-2 text-[10px] font-medium tracking-wider text-gray-400 uppercase">
                  昨天
                </div>
                {groupedSessions.yesterday.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => handleSelectSession(session.id)}
                    className={`group relative mb-1 cursor-pointer rounded-lg border p-2 transition-all ${session.id === activeSessionId ? 'border-blue-300 bg-blue-50' : 'border-transparent bg-white hover:border-gray-200 hover:bg-gray-100'}`}
                  >
                    <div className="pr-6">
                      <div className="truncate text-sm font-medium text-gray-700 transition-colors group-hover:text-blue-600">
                        {session.title}
                      </div>
                      <div className="truncate text-[10px] text-gray-400">
                        {new Date(session.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowDeleteConfirm(session.id)
                      }}
                      className="absolute right-2 top-2 hidden rounded p-0.5 text-gray-400 hover:bg-gray-200 hover:text-red-500 group-hover:block"
                      title="删除对话"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {groupedSessions.earlier.length > 0 && (
              <div>
                <div className="mb-2 px-2 text-[10px] font-medium tracking-wider text-gray-400 uppercase">
                  更早
                </div>
                {groupedSessions.earlier.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => handleSelectSession(session.id)}
                    className={`group relative mb-1 cursor-pointer rounded-lg border p-2 transition-all ${session.id === activeSessionId ? 'border-blue-300 bg-blue-50' : 'border-transparent bg-white hover:border-gray-200 hover:bg-gray-100'}`}
                  >
                    <div className="pr-6">
                      <div className="truncate text-sm font-medium text-gray-700 transition-colors group-hover:text-blue-600">
                        {session.title}
                      </div>
                      <div className="truncate text-[10px] text-gray-400">
                        {new Date(session.lastUpdated).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowDeleteConfirm(session.id)
                      }}
                      className="absolute right-2 top-2 hidden rounded p-0.5 text-gray-400 hover:bg-gray-200 hover:text-red-500 group-hover:block"
                      title="删除对话"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {sessions.length === 0 && (
              <div className="py-8 text-center">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                  <Bot className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">暂无历史对话</p>
                <p className="mt-1 text-xs text-gray-400">开始新的对话后，会在这里显示</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 侧边栏打开按钮 */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="absolute top-4 left-4 z-10 rounded-lg border border-gray-200 bg-white p-2 text-gray-500 shadow-sm hover:text-blue-600"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      )}

      {/* 主聊天区域 */}
      <div className="relative flex h-full min-w-0 flex-1 flex-col bg-slate-50/30">
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(#4b5563 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
        ></div>

        {/* 顶部栏 */}
        <div className="z-10 flex h-14 items-center justify-between border-b border-gray-100 bg-white/80 px-6 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${connectionError ? 'bg-red-500' : 'animate-pulse bg-green-500'}`}></div>
            <span className="text-sm font-medium text-gray-700">
              {activeSessionId ? sessions.find(s => s.id === activeSessionId)?.title || '知识库助手' : '新对话'}
            </span>
            <span className="rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">
              {connectionError ? '连接异常' : '已连接'}
            </span>
            {process.env.NODE_ENV === 'development' && (
              <div className="flex gap-1 text-[10px] text-gray-400">
                <span title={`温度: ${temperature}`}>T:{temperature}</span>
                <span title={`Top K: ${chunk_top_k}`}>K:{chunk_top_k}</span>
              </div>
            )}
            {connectionError && (
              <span className="text-xs text-red-500" title={connectionError}>
                连接问题
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded-full p-2 text-gray-400 hover:bg-gray-100">
              <Download className="h-4 w-4" />
            </button>
            <button
              onClick={handleNewConversation}
              className="rounded-full p-2 text-gray-400 hover:bg-gray-100"
              title="新对话"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 消息区域 */}
        <div
          className="z-10 flex-1 space-y-6 overflow-y-auto scroll-smooth p-4 md:p-6"
          ref={scrollRef}
        >
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center space-y-4 text-gray-400">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-100 bg-white shadow-sm">
                <Bot className="h-8 w-8 text-blue-500" />
              </div>
              <p className="text-sm">开始一个新的对话...</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md">
                    <Sparkles className="h-4 w-4" />
                  </div>
                )}
                <div className="flex max-w-[85%] flex-col gap-2 md:max-w-[70%]">
                  <div
                    className={`rounded-2xl p-3.5 text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'rounded-br-none bg-blue-600 text-white' : 'rounded-tl-none border border-gray-100 bg-white text-gray-700'}`}
                  >
                    {renderMessageContent(msg)}
                    {msg.role === 'assistant' && msg.isStreaming && (
                      <span className="ml-1 inline-block h-3 w-1.5 animate-pulse bg-blue-500 align-middle"></span>
                    )}
                  </div>
                  {msg.role === 'assistant' && !msg.isStreaming && (
                    <div className="flex items-center gap-2 px-1">
                      <button
                        onClick={(e) => {
                          console.log('点赞按钮被点击:', msg.id, Date.now())
                          toggleFeedback(msg.id, 'like', e)
                        }}
                        className={`rounded p-1 transition-colors hover:bg-gray-100 ${msg.feedback === 'like'
                          ? 'text-green-500'
                          : 'text-gray-400'
                          } ${msg.isSubmittingFeedback ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={msg.isSubmittingFeedback ? '正在提交反馈...' : '点赞'}
                        disabled={msg.isSubmittingFeedback}
                      >
                        {msg.isSubmittingFeedback && msg.feedback === 'like' ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <ThumbsUp className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          console.log('点踩按钮被点击:', msg.id, Date.now())
                          toggleFeedback(msg.id, 'dislike', e)
                        }}
                        className={`rounded p-1 transition-colors hover:bg-gray-100 ${msg.feedback === 'dislike'
                          ? 'text-red-500'
                          : 'text-gray-400'
                          } ${msg.isSubmittingFeedback ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={msg.isSubmittingFeedback ? '正在提交反馈...' : '点踩'}
                        disabled={msg.isSubmittingFeedback}
                      >
                        {msg.isSubmittingFeedback && msg.feedback === 'dislike' ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <ThumbsDown className="h-3.5 w-3.5" />
                        )}
                      </button>
                      {msg.queryId && (
                        <span className="text-[10px] text-gray-400" title="可提交反馈">
                          ID: {msg.queryId.substring(0, 8)}...
                        </span>
                      )}
                      {msg.isSubmittingFeedback && (
                        <span className="text-[10px] text-gray-400 animate-pulse">
                          提交中...
                        </span>
                      )}
                      {msg.highlightInfo && msg.highlightInfo.citations && msg.highlightInfo.citations.length > 0 && (
                        <button
                          onClick={() => handleCitationsButtonClick(msg.highlightInfo!.citations)}
                          className="ml-auto cursor-pointer rounded border border-blue-100 bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-500 transition-colors hover:bg-blue-100 hover:text-blue-700"
                        >
                          {msg.highlightInfo.citations.length} 处引用
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-[10px] font-bold text-white shadow-sm">
                    JD
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* 输入区域 */}
        <div className="z-10 border-t border-gray-100 bg-white p-4">
          {connectionError && (
            <div className="mb-2 rounded-lg bg-red-50 p-2 text-center">
              <p className="text-xs text-red-600">
                连接异常：{connectionError}
              </p>
              <button
                onClick={() => setConnectionError(null)}
                className="mt-1 text-xs text-red-500 hover:text-red-700"
              >
                清除
              </button>
            </div>
          )}
          <div className="relative mx-auto max-w-4xl">
            <div className="absolute top-3 left-3 flex gap-2">
              <button className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-blue-600">
                <Paperclip className="h-4 w-4" />
              </button>
              <button className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-blue-600">
                <Globe className="h-4 w-4" />
              </button>
            </div>
            <textarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                setQueryInput(e.target.value)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder={isTyping ? 'AI 正在思考中...' : '问点什么... (至少3个字符)'}
              disabled={isTyping}
              className="h-[50px] max-h-[120px] w-full resize-none rounded-xl border border-gray-200 bg-gray-50 py-3 pr-12 pl-24 transition-all focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50/50 focus:outline-none disabled:bg-gray-100 disabled:text-gray-400"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || input.trim().length < 3 || isTyping}
              className={`absolute top-2 right-2 rounded-lg p-2 transition-all ${input.trim().length >= 3 && !isTyping ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
              title={input.trim().length < 3 ? '请输入至少3个字符' : isTyping ? 'AI正在思考中' : '发送消息'}
            >
              {isTyping ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
            </button>
          </div>
          <div className="mt-2 flex justify-center items-center gap-2">
            <span className="text-[10px] text-gray-400">AI 可能会产生错误，请核对重要信息</span>
            {input.trim().length > 0 && input.trim().length < 3 && (
              <span className="text-[10px] text-red-500">还需输入{3 - input.trim().length}个字符</span>
            )}
          </div>
        </div>
      </div>

      {/* 引用面板 */}
      <div
        className={`flex flex-shrink-0 flex-col border-l border-gray-200 bg-white transition-all duration-300 ${showRefPanel ? 'w-80 translate-x-0' : 'w-0 translate-x-full overflow-hidden'}`}
      >
        <div className="flex h-14 items-center justify-between border-b border-gray-100 px-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <BookOpen className="h-4 w-4 text-blue-600" />
            相关引用
            <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] text-blue-700">
              {activeCitations?.length || 0}
            </span>
          </div>
          <button
            onClick={() => setShowRefPanel(false)}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/50 p-4">
          {activeCitations?.map((cite) => (
            <div
              key={cite.id}
              className="group rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
            >
              <div className="mb-2 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-red-50 text-red-500">
                    <FileText className="h-3.5 w-3.5" />
                  </div>
                  <span
                    className="line-clamp-1 max-w-[140px] text-xs font-medium text-gray-700"
                    title={cite.docName}
                  >
                    {cite.docName}
                  </span>
                </div>
                <div className="flex items-center gap-1 rounded border border-green-100 bg-green-50 px-1.5 py-0.5 text-[10px] font-medium text-green-700">
                  <Zap className="h-3 w-3" />
                  {Math.round((cite.score || 0) * 100)}%
                </div>
              </div>
              <div className="relative">
                <Quote className="absolute -top-1 -left-1 h-3 w-3 -scale-x-100 transform text-gray-300" />
                <p className="border-l-2 border-gray-100 pl-3 text-xs leading-relaxed text-gray-600">
                  {cite.content || '相关文档内容'}
                </p>
              </div>
              {/* 显示多个得分 */}
              {cite.scores && cite.scores.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="text-[10px] font-medium text-gray-500">相关度得分：</div>
                  {cite.scores.map((score, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-400">片段 {idx + 1}</span>
                      <div className="flex items-center gap-1">
                        <div className="h-1.5 w-16 rounded-full bg-gray-200">
                          <div
                            className="h-1.5 rounded-full bg-green-500"
                            style={{ width: `${score * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-medium text-green-600">
                          {Math.round(score * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {cite.page && (
                <div className="mt-2 flex justify-end">
                  <span className="rounded bg-gray-50 px-1.5 py-0.5 text-[10px] text-gray-400">
                    第 {cite.page} 页
                  </span>
                </div>
              )}
            </div>
          ))}
          {activeCitations?.length === 0 && (
            <div className="py-8 text-center">
              <BookOpen className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">暂无引用信息</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}