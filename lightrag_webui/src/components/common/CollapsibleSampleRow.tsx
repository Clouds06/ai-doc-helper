import { extractRefsFromText, getSampleStatus } from '@/lib/utils'
import { EvalSample } from '@/types'
import { ChevronRight, Bot, UserCheck, FileSearch, ChevronLeft } from 'lucide-react'
import { DetailScoreBadges } from './DetailedScoreBadges'
import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import InlineTooltip from './InlineTooltip'
interface CollapsibleSampleRowProps {
  sample: EvalSample
  index: number
}

export const CollapsibleSampleRow = ({ sample }: CollapsibleSampleRowProps) => {
  const status = sample.metrics ? getSampleStatus(sample.metrics) : undefined
  const isPass = status === 'pass'
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    if (isExpanded) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isExpanded])

  return (
    <>
      <div
        className={`group rounded-xl border border-gray-200 bg-white transition-all duration-200 hover:border-indigo-200 ${isExpanded ? 'my-0 h-0 overflow-hidden border-0 opacity-0' : ''}`}
      >
        <div
          onClick={() => setIsExpanded(true)}
          className="flex cursor-pointer items-center gap-4 rounded-xl bg-white px-5 py-3 transition-colors select-none hover:bg-gray-50/50"
        >
          <div className="shrink-0 pt-1">
            <div
              className={`h-2.5 w-2.5 rounded-full shadow-sm ring-2 ${
                isPass ? 'bg-emerald-500 ring-emerald-100' : 'bg-red-500 ring-red-100'
              }`}
            />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[15px] font-medium text-gray-700 group-hover:text-gray-900">
              {sample.question}
            </h3>
          </div>

          <div className="shrink-0 text-gray-300 transition-colors group-hover:text-indigo-500">
            <div className="rounded-full p-1 group-hover:bg-indigo-50">
              <ChevronRight className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="animate-in fade-in fixed inset-0 z-50 flex flex-col overflow-hidden bg-transparent duration-200">
          <div className="flex h-full w-full flex-1 flex-col overflow-y-auto bg-white shadow-2xl sm:mx-auto sm:my-4 sm:h-[calc(100%-2rem)] sm:max-w-5xl sm:rounded-2xl sm:border sm:border-gray-200">
            <div className="sticky top-0 z-10 flex h-15 items-center justify-between border-b border-gray-100 bg-white/80 px-4 backdrop-blur-md">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsExpanded(false)}
                  className="group flex items-center rounded-full"
                >
                  <div className="shrink-0 rounded-full p-1 text-gray-400 transition-colors group-hover:bg-gray-200 group-hover:text-gray-700">
                    <ChevronLeft className="h-5 w-5" />
                  </div>
                </button>

                <span className="text-md truncate font-medium text-gray-700">
                  {sample.question}
                </span>
              </div>

              <DetailScoreBadges metrics={sample.metrics} />

              <div
                className={`rounded-full border px-3 py-1 text-xs font-medium ${
                  isPass
                    ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                    : 'border-red-100 bg-red-50 text-red-700'
                }`}
              >
                {isPass ? '通过' : '需优化'}
              </div>
            </div>

            <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-6">
              <section className="space-y-6">
                <AnswerSection title="AI 回答" icon={Bot} text={sample.answer} color="blue" />

                <AnswerSection
                  title="标准答案"
                  icon={UserCheck}
                  text={sample.ground_truth || sample.reference || ''}
                  color="gray"
                />
              </section>

              {sample.reasoning && (
                <section className="border-t border-gray-100 pt-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-bold text-indigo-700">
                    <FileSearch className="h-4 w-4" />
                    评估理由
                  </div>
                  <div className="space-y-3">
                    {sample.reasoning.faithfulness && (
                      <div className="rounded-lg border border-indigo-100 bg-indigo-50/30 p-3">
                        <div className="text-xs font-medium text-indigo-700 mb-1">忠实度</div>
                        <div className="text-sm text-gray-700">{sample.reasoning.faithfulness}</div>
                      </div>
                    )}
                    {sample.reasoning.answer_relevancy && (
                      <div className="rounded-lg border border-blue-100 bg-blue-50/30 p-3">
                        <div className="text-xs font-medium text-blue-700 mb-1">答案相关性</div>
                        <div className="text-sm text-gray-700">{sample.reasoning.answer_relevancy}</div>
                      </div>
                    )}
                    {sample.reasoning.context_recall && (
                      <div className="rounded-lg border border-green-100 bg-green-50/30 p-3">
                        <div className="text-xs font-medium text-green-700 mb-1">上下文召回率</div>
                        <div className="text-sm text-gray-700">{sample.reasoning.context_recall}</div>
                      </div>
                    )}
                    {sample.reasoning.context_precision && (
                      <div className="rounded-lg border border-purple-100 bg-purple-50/30 p-3">
                        <div className="text-xs font-medium text-purple-700 mb-1">上下文精确率</div>
                        <div className="text-sm text-gray-700">{sample.reasoning.context_precision}</div>
                      </div>
                    )}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const MarkdownRenderers = (text: string) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={{
      h1: ({ children, ...props }: any) => (
        <h1 className="mt-4 mb-2 text-xl font-bold text-gray-900" {...props}>
          {children}
        </h1>
      ),
      h2: ({ children, ...props }: any) => (
        <h2 className="mt-3 mb-2 text-lg font-bold text-gray-900" {...props}>
          {children}
        </h2>
      ),
      h3: ({ children, ...props }: any) => (
        <h3 className="mt-3 mb-1 text-base font-bold text-gray-800" {...props}>
          {children}
        </h3>
      ),
      h4: ({ children, ...props }: any) => (
        <h4 className="mt-2 mb-1 text-sm font-bold text-gray-800" {...props}>
          {children}
        </h4>
      ),
      h5: ({ children, ...props }: any) => (
        <h5 className="mt-2 mb-1 text-sm font-semibold text-gray-700" {...props}>
          {children}
        </h5>
      ),
      h6: ({ children, ...props }: any) => (
        <h6 className="mt-2 mb-1 text-sm font-semibold text-gray-700" {...props}>
          {children}
        </h6>
      ),
      a: ({ href, children, ...props }: any) => {
        if (typeof href === 'string' && href.startsWith('#ref-')) {
          const parts = href.split('::')
          const encoded = parts[1] || ''
          let docName = ''
          try {
            docName = encoded ? decodeURIComponent(encoded) : ''
          } catch {
            docName = encoded
          }
          return <InlineTooltip label={<>[{children}]</>} content={docName} />
        }
        return (
          <a href={href} {...props}>
            {children}
          </a>
        )
      }
    }}
  >
    {text}
  </ReactMarkdown>
)

const AnswerSection = ({
  text,
  title,
  icon: Icon,
  color = 'blue'
}: {
  text: string
  title: string
  icon: any
  color?: 'blue' | 'gray'
}) => {
  const borderColor = color === 'blue' ? 'border-indigo-100' : 'border-gray-200'
  const iconColor = color === 'blue' ? 'text-indigo-600' : 'text-gray-500'
  const bgColor = color === 'blue' ? 'bg-indigo-50/50' : 'bg-gray-50/50'

  const { main, refs } = extractRefsFromText(text)
  function _replaceCitation(m: string, id: string) {
    const doc = refs[id]
    if (doc) return `[${id}](#ref-${id}::${encodeURIComponent(doc)})`
    return m
  }

  const processed = Object.keys(refs).length ? main.replace(/\[(\d+)\]/g, _replaceCitation) : text

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex items-center gap-2">
        <Icon className={`h-4 w-4 ${iconColor}`} />
        <span className={`text-sm font-bold ${iconColor}`}>{title}</span>
      </div>
      <div
        className={`rounded-xl border ${borderColor} ${bgColor} max-h-[300px] overflow-y-auto p-4 [-ms-overflow-style:'none'] [scrollbar-width:'none'] [&::-webkit-scrollbar]:hidden`}
      >
        <div className="font-sans text-sm leading-7 text-gray-700">
          {text && MarkdownRenderers(processed)}
          {!text && <span className="text-xs text-gray-400 italic">暂无内容</span>}
        </div>
      </div>
    </div>
  )
}

