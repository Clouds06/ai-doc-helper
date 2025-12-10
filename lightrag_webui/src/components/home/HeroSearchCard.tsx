import { useState, FormEvent, KeyboardEvent } from 'react'
import { ImageIcon, FileText, Mic, Globe, ChevronDown, ArrowRight } from 'lucide-react'
import { useTypewriterLoop } from '@/hooks/useTypewriter'
import { useUploadStore } from '@/hooks/useUploadStore'
import { PLACEHOLDER_LOOP_WORDS } from '@/lib/constants'

interface HeroSearchCardProps {
  onSearch: (query: string) => void
  initialQuery?: string
}

export const HeroSearchCard = ({ onSearch, initialQuery = '' }: HeroSearchCardProps) => {
  return (
    <div className="mb-6 w-full">
      <div className="relative overflow-hidden rounded-[20px] border border-gray-100 bg-white shadow-xl">
        <HomeUploadZone />
        <HomeSearch onSearch={onSearch} initialQuery={initialQuery} />
      </div>
    </div>
  )
}

const HomeUploadZone = () => {
  const openUploadModal = useUploadStore((s) => s.open)

  return (
    <div className="flex flex-col items-center justify-center border-b border-dashed border-gray-100 bg-gray-50/40 p-6">
      <button
        type="button"
        onClick={openUploadModal}
        aria-label="上传文件"
        className="group flex h-24 w-full flex-col items-center justify-center gap-2 rounded-xl border border-transparent bg-white shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50/50"
      >
        <div className="flex -space-x-2 transition-transform duration-300 group-hover:scale-105">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-white bg-orange-50 text-orange-500 shadow-sm">
            <ImageIcon className="h-4 w-4" />
          </div>
          <div className="z-10 flex h-9 w-9 items-center justify-center rounded-lg border-2 border-white bg-blue-50 text-blue-600 shadow-sm">
            <FileText className="h-4 w-4" />
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-white bg-green-50 text-green-500 shadow-sm">
            <Mic className="h-4 w-4" />
          </div>
        </div>
        <p className="mt-1 text-sm text-gray-500 transition-colors group-hover:text-blue-600">
          <span className="font-semibold text-gray-700 group-hover:text-blue-600">点击上传</span>{' '}
          或将文件拖拽到此处（MD / DOCX / PDF ...）
        </p>
      </button>
    </div>
  )
}

interface HomeSearchProps {
  onSearch: (query: string) => void
  initialQuery?: string
}

const HomeSearch = ({ onSearch, initialQuery = '' }: HomeSearchProps) => {
  const [input, setInput] = useState(initialQuery)
  const [isFocused, setIsFocused] = useState(false)
  const animatedPlaceholder = useTypewriterLoop(PLACEHOLDER_LOOP_WORDS, isFocused)
  const placeholder = animatedPlaceholder
  const hasText = input.trim().length > 0

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!hasText) return
    onSearch(input.trim())
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (hasText) onSearch(input.trim())
    }
  }

  return (
    <div className="relative bg-white p-3">
      <form onSubmit={handleSubmit} className="relative z-10 w-full text-left">
        <div className="relative">
          <label htmlFor="hero-query" className="sr-only">
            请输入你要查询的问题
          </label>
          <textarea
            id="hero-query"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => {
              setIsFocused(true)
            }}
            onBlur={() => {
              if (!input) {
                setIsFocused(false)
              }
            }}
            onKeyDown={handleKeyDown}
            rows={1}
            className="h-12 w-full resize-none overflow-hidden bg-transparent px-4 py-3 align-top text-base text-gray-800 placeholder-transparent focus:outline-none"
          />
          {!input && (
            <div className="pointer-events-none absolute inset-0 flex items-start px-4 py-3">
              <span className="text-m whitespace-pre-wrap text-gray-600 transition-colors duration-300">
                {placeholder}
              </span>
              {!isFocused && <span className="ml-0.5 animate-pulse text-gray-600">|</span>}
            </div>
          )}
        </div>

        <div className="mt-1 flex items-center justify-end border-t border-transparent pt-1 pr-2">
          <div className="flex items-center gap-2">
            {/* TODO: "联网搜索"按钮为未来功能占位，可能会被移除或修改，保留以便后续实现 */}
            <button
              type="button"
              aria-label="联网搜索"
              className="flex items-center gap-1 text-xs text-gray-500 transition-colors hover:text-gray-800"
            >
              <Globe className="h-3 w-3" />
              联网
              <ChevronDown className="h-2.5 w-2.5" />
            </button>

            <button
              type="submit"
              disabled={!hasText}
              aria-label="发送问题"
              className={`flex h-7 w-7 items-center justify-center rounded-full transition-all duration-200 ${
                hasText
                  ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700'
                  : 'cursor-default bg-gray-100 text-gray-300'
              }`}
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

