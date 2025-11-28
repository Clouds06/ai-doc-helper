import { useState } from 'react'
import { ImageIcon, FileText, Mic, Globe, ChevronDown, ArrowRight } from 'lucide-react'
import { useTypewriterLoop } from '../../hooks/useTypewriter'

interface HeroSearchCardProps {
    onSearch: (query: string) => void
    onUpload: () => void
    isHighlightUpload: boolean
    isHighlightInput: boolean
    onInputInteract: () => void
}

export const HeroSearchCard = ({
    onSearch,
    onUpload,
    isHighlightUpload,
    isHighlightInput,
    onInputInteract
}: HeroSearchCardProps) => {
    const [input, setInput] = useState('')
    const [isFocused, setIsFocused] = useState(false)
    const animatedPlaceholder = useTypewriterLoop(
        [
            '试着问我：这份财报的重点是什么？',
            '帮我总结一下会议纪要的核心内容',
            '如何配置 RAG 系统的向量数据库？'
        ],
        isFocused
    )

    return (
        <div className="mb-6 w-full">
            <h1 className="mb-5 text-center text-2xl font-bold tracking-tight text-gray-800">
                懂你的文件问答助手
            </h1>
            <div className="group relative overflow-hidden rounded-[20px] border border-gray-100 bg-white shadow-xl">
                <div className="flex flex-col items-center justify-center border-b border-dashed border-gray-100 bg-gray-50/30 p-6">
                    <div
                        className={`group/upload flex h-24 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border bg-white transition-all ${isHighlightUpload ? 'scale-[1.01] border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'border-transparent shadow-sm hover:border-blue-100 hover:bg-blue-50/50'}`}
                        onClick={onUpload}
                    >
                        <div className="flex -space-x-2 transition-transform duration-300 group-hover/upload:scale-105">
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
                        <p className="mt-1 text-xs text-gray-400 transition-colors group-hover/upload:text-blue-600">
                            <span
                                className={`font-semibold ${isHighlightUpload ? 'text-blue-600' : 'text-gray-600'}`}
                            >
                                上传文件
                            </span>{' '}
                            或拖拽至此 (PDF, Doc, MD...)
                        </p>
                    </div>
                </div>
                <div className="relative bg-white p-3">
                    {isHighlightInput && !isFocused && (
                        <div className="pointer-events-none absolute inset-2 animate-pulse rounded-lg bg-blue-400/10 transition-opacity duration-500" />
                    )}
                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
                            if (input.trim()) onSearch(input)
                        }}
                        className="relative z-10 w-full"
                    >
                        <div className="relative">
                            <textarea
                                className="h-12 w-full resize-none overflow-hidden bg-transparent px-4 py-3 align-top text-base text-gray-800 placeholder-transparent transition-all focus:outline-none"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onFocus={() => {
                                    setIsFocused(true)
                                    onInputInteract()
                                }}
                                onBlur={() => {
                                    if (!input) setIsFocused(false)
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault()
                                        if (input.trim()) onSearch(input)
                                    }
                                }}
                            />
                            {!input && (
                                <div className="pointer-events-none absolute inset-0 flex items-start px-4 py-3">
                                    {animatedPlaceholder || !isFocused ? (
                                        <>
                                            <span
                                                className={`${isHighlightInput ? 'text-blue-500/80' : 'text-gray-400'} whitespace-pre-wrap transition-colors duration-300`}
                                            >
                                                {animatedPlaceholder}
                                            </span>
                                            {!isFocused && (
                                                <span
                                                    className={`animate-pulse ${isHighlightInput ? 'text-blue-500' : 'text-gray-400'}`}
                                                >
                                                    |
                                                </span>
                                            )}
                                        </>
                                    ) : null}
                                </div>
                            )}
                        </div>
                        <div className="mt-1 flex items-center justify-end border-t border-transparent pt-1 pr-2">
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    className="flex items-center gap-1 text-[10px] text-gray-400 transition-colors hover:text-gray-700"
                                >
                                    <Globe className="h-3 w-3" />
                                    联网
                                    <ChevronDown className="h-2.5 w-2.5" />
                                </button>
                                <button
                                    type="submit"
                                    disabled={!input.trim()}
                                    className={`flex h-7 w-7 items-center justify-center rounded-full transition-all duration-200 ${input.trim() ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700' : 'bg-gray-100 text-gray-300'}`}
                                >
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
