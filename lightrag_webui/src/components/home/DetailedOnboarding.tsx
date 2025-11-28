import { X, CheckCircle2, Upload, Loader2, PlayCircle } from 'lucide-react'
import { MiniConfetti } from '../common/MiniConfetti'

interface DetailedOnboardingProps {
    step: number
    onDismiss: () => void
    onAction: () => void
    showConfetti: boolean
    isProcessing: boolean
}

export const DetailedOnboarding = ({
    step,
    onDismiss,
    onAction,
    showConfetti,
    isProcessing
}: DetailedOnboardingProps) => (
    <div className="relative mb-6 w-full transition-all duration-500">
        <div className="relative overflow-hidden rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
            <div className="pointer-events-none absolute top-0 right-0 -mt-10 -mr-10 h-32 w-32 rounded-full bg-blue-50 opacity-50 blur-2xl" />
            {showConfetti && <MiniConfetti />}
            <div className="relative z-10 mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-bold text-gray-800">
                    {step < 3 && <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />}
                    新手引导：构建您的专属知识库
                </h3>
                <button
                    onClick={onDismiss}
                    className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            </div>
            <div className="relative z-10 flex items-center justify-between gap-4">
                <div className={`flex flex-1 items-center gap-3 ${step > 1 ? 'opacity-60' : ''}`}>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600 shadow-sm">
                        <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-semibold text-gray-900">账号创建</span>
                        <span className="text-[10px] text-gray-500">已完成注册</span>
                    </div>
                    <div
                        className={`mx-2 h-0.5 flex-1 rounded ${step > 1 ? 'bg-green-100' : 'bg-gray-100'}`}
                    />
                </div>
                <div
                    className={`flex flex-[1.5] items-center gap-3 transition-all duration-300 ${step === 2 || isProcessing ? 'scale-100 opacity-100' : 'opacity-60 grayscale'}`}
                >
                    <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full shadow-sm transition-colors ${step > 2 && !isProcessing ? 'bg-green-100 text-green-600' : step === 2 || isProcessing ? 'bg-blue-600 text-white ring-2 ring-blue-100 ring-offset-1' : 'bg-gray-100 text-gray-400'}`}
                    >
                        {step > 2 && !isProcessing ? (
                            <CheckCircle2 className="h-4 w-4" />
                        ) : isProcessing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Upload className="h-4 w-4" />
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span
                            className={`text-xs font-semibold ${step === 2 || isProcessing ? 'text-blue-700' : 'text-gray-900'}`}
                        >
                            {isProcessing ? 'AI 正在学习...' : '上传文档'}
                        </span>
                        <span className="text-[10px] text-gray-500">
                            {isProcessing ? '解析与向量化中' : '支持 PDF/Word'}
                        </span>
                    </div>
                    {step === 2 && !isProcessing && (
                        <button
                            onClick={onAction}
                            className="ml-auto animate-pulse rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-transform hover:bg-blue-700 active:scale-95"
                        >
                            去上传
                        </button>
                    )}
                    {isProcessing && (
                        <div className="ml-auto flex items-center gap-1.5 rounded-md border border-blue-100 bg-blue-50 px-3 py-1.5 text-[10px] font-medium text-blue-600">
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500"></span>
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500 delay-75"></span>
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500 delay-150"></span>
                        </div>
                    )}
                    <div
                        className={`mx-2 h-0.5 flex-1 rounded ${step > 2 ? 'bg-green-100' : 'bg-gray-100'}`}
                    />
                </div>
                <div
                    className={`flex flex-1 items-center gap-3 transition-all duration-300 ${step === 3 && !isProcessing ? 'scale-105 opacity-100' : 'opacity-40 grayscale'}`}
                >
                    <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${step === 3 && !isProcessing ? 'border-transparent bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'border-gray-200 bg-gray-50 text-gray-400'}`}
                    >
                        <PlayCircle className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                        <span
                            className={`text-xs font-semibold ${step === 3 && !isProcessing ? 'text-indigo-700' : 'text-gray-900'}`}
                        >
                            开始问答
                        </span>
                        <span className="text-[10px] text-gray-500">深度挖掘知识</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
)
