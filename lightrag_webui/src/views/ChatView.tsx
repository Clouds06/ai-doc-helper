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
  Quote
} from 'lucide-react'
import { ChatMessage, Citation } from '../types'
import { MOCK_SESSIONS, MOCK_CITATIONS } from '../data/mock'

export const ChatView = ({ initialQuery }: { initialQuery?: string }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState(initialQuery || '')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeCitations, setActiveCitations] = useState<Citation[] | null>(null)
  const [showRefPanel, setShowRefPanel] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (messages.length === 0 && !initialQuery) {
      setMessages([
        {
          id: '0',
          role: 'assistant',
          content:
            '你好！我是你的知识库助手。你可以问我关于已上传文档的任何问题，或者让我帮你总结分析。',
          timestamp: new Date()
        }
      ])
    } else if (messages.length === 0 && initialQuery) {
      handleSend()
    }
  }, [])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, isTyping])

  const handleSend = () => {
    if (!input.trim() || isTyping) return

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    const aiMsgId = (Date.now() + 1).toString()
    const fullText =
      '根据对2024年Q3财务数据的分析，我们发现几个关键增长点。首先，云服务业务板块在本季度实现了显著增长，营收同比增长 45%，主要得益于企业级客户的续费率提升至 120%。其次，虽然硬件销售略有下滑，但整体毛利率因高利润率软件服务的占比提升而优化了 2 个百分点。建议继续加大在 AI 基础设施上的投入。'
    const highlightTextToFind =
      '云服务业务板块在本季度实现了显著增长，营收同比增长 45%，主要得益于企业级客户的续费率提升至 120%'

    setMessages((prev) => [
      ...prev,
      { id: aiMsgId, role: 'assistant', content: '', timestamp: new Date(), isStreaming: true }
    ])

    let currentIndex = 0
    const streamInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id === aiMsgId) {
              return { ...msg, content: fullText.slice(0, currentIndex) }
            }
            return msg
          })
        )
        currentIndex++
      } else {
        clearInterval(streamInterval)
        setIsTyping(false)

        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id === aiMsgId) {
              return {
                ...msg,
                isStreaming: false,
                highlightInfo: {
                  text: highlightTextToFind,
                  citations: MOCK_CITATIONS
                }
              }
            }
            return msg
          })
        )
      }
    }, 30)
  }

  const toggleFeedback = (msgId: string, type: 'like' | 'dislike') => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== msgId) return msg
        return { ...msg, feedback: msg.feedback === type ? null : type }
      })
    )
  }

  const handleHighlightClick = (citations: Citation[]) => {
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

  return (
    <div className="relative flex h-full overflow-hidden bg-white">
      {/* Left Sidebar: History */}
      <div
        className={`absolute z-20 flex h-full flex-shrink-0 flex-col border-r border-gray-200 bg-slate-50 transition-all duration-300 md:relative ${sidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full overflow-hidden md:w-0 md:translate-x-0'} `}
      >
        <div className="flex items-center justify-between p-4">
          <h3 className="text-sm font-semibold text-slate-700">历史对话</h3>
          <button onClick={() => setSidebarOpen(false)} className="p-1 text-gray-400 md:hidden">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-3">
          <button className="mb-4 flex w-full items-center gap-2 rounded-lg border border-blue-100 bg-white px-3 py-2 text-sm text-blue-600 shadow-sm transition-all hover:bg-blue-50 hover:shadow">
            <Plus className="h-4 w-4" />
            <span>新对话</span>
          </button>
          <div className="space-y-4">
            <div>
              <div className="mb-2 px-2 text-[10px] font-medium tracking-wider text-gray-400 uppercase">
                今天
              </div>
              {MOCK_SESSIONS.slice(0, 1).map((s) => (
                <div
                  key={s.id}
                  className="group mb-1 cursor-pointer rounded-lg border border-transparent bg-white p-2 hover:border-gray-200 hover:bg-gray-100"
                >
                  <div className="truncate text-sm font-medium text-gray-700 transition-colors group-hover:text-blue-600">
                    {s.title}
                  </div>
                  <div className="truncate text-[10px] text-gray-400">{s.preview}</div>
                </div>
              ))}
            </div>
            <div>
              <div className="mb-2 px-2 text-[10px] font-medium tracking-wider text-gray-400 uppercase">
                过去 7 天
              </div>
              {MOCK_SESSIONS.slice(1).map((s) => (
                <div
                  key={s.id}
                  className="group mb-1 cursor-pointer rounded-lg p-2 hover:bg-gray-100"
                >
                  <div className="truncate text-sm font-medium text-gray-700 transition-colors group-hover:text-blue-600">
                    {s.title}
                  </div>
                  <div className="truncate text-[10px] text-gray-400">{s.preview}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="absolute top-4 left-4 z-10 rounded-lg border border-gray-200 bg-white p-2 text-gray-500 shadow-sm hover:text-blue-600"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      )}

      {/* Middle: Main Chat Area */}
      <div className="relative flex h-full min-w-0 flex-1 flex-col bg-slate-50/30">
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(#4b5563 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
        ></div>

        {/* Header */}
        <div className="z-10 flex h-14 items-center justify-between border-b border-gray-100 bg-white/80 px-6 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
            <span className="text-sm font-medium text-gray-700">知识库助手</span>
            <span className="rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">
              GPT-4 Turbo
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded-full p-2 text-gray-400 hover:bg-gray-100">
              <Download className="h-4 w-4" />
            </button>
            <button className="rounded-full p-2 text-gray-400 hover:bg-gray-100">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
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
                        onClick={() => toggleFeedback(msg.id, 'like')}
                        className={`rounded p-1 transition-colors hover:bg-gray-100 ${msg.feedback === 'like' ? 'text-green-500' : 'text-gray-400'}`}
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => toggleFeedback(msg.id, 'dislike')}
                        className={`rounded p-1 transition-colors hover:bg-gray-100 ${msg.feedback === 'dislike' ? 'text-red-500' : 'text-gray-400'}`}
                      >
                        <ThumbsDown className="h-3.5 w-3.5" />
                      </button>
                      {msg.highlightInfo && (
                        <span className="ml-auto rounded border border-blue-100 bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-500">
                          {msg.highlightInfo.citations.length} 处引用
                        </span>
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

        {/* Input */}
        <div className="z-10 border-t border-gray-100 bg-white p-4">
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
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())
              }
              placeholder={isTyping ? 'AI 正在思考中...' : '问点什么...'}
              disabled={isTyping}
              className="h-[50px] max-h-[120px] w-full resize-none rounded-xl border border-gray-200 bg-gray-50 py-3 pr-12 pl-24 transition-all focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50/50 focus:outline-none disabled:bg-gray-100 disabled:text-gray-400"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className={`absolute top-2 right-2 rounded-lg p-2 transition-all ${input.trim() && !isTyping ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700' : 'bg-gray-200 text-gray-400'}`}
            >
              {isTyping ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
            </button>
          </div>
          <div className="mt-2 text-center">
            <span className="text-[10px] text-gray-400">AI 可能会产生错误，请核对重要信息</span>
          </div>
        </div>
      </div>

      {/* Right: Reference Panel */}
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
                  {Math.round(cite.score * 100)}%
                </div>
              </div>
              <div className="relative">
                <Quote className="absolute -top-1 -left-1 h-3 w-3 -scale-x-100 transform text-gray-300" />
                <p className="border-l-2 border-gray-100 pl-3 text-xs leading-relaxed text-gray-600">
                  {cite.content}
                </p>
              </div>
              {cite.page && (
                <div className="mt-2 flex justify-end">
                  <span className="rounded bg-gray-50 px-1.5 py-0.5 text-[10px] text-gray-400">
                    第 {cite.page} 页
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
