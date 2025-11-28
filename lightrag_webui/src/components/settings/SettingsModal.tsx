import React, { useState } from 'react'
import {
    Settings,
    X,
    Zap,
    Target,
    Bot,
    CheckCircle2,
    Quote,
    Loader2,
    Play,
    AlertCircle,
    XCircle,
    Save
} from 'lucide-react'

interface SettingsModalProps {
    isOpen: boolean
    onClose: () => void
}

export const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
    const [activeTab, setActiveTab] = useState<'params' | 'eval'>('params')
    const [isEvaluating, setIsEvaluating] = useState(false)
    const [evalResult, setEvalResult] = useState<any>(null)
    const [temperature, setTemperature] = useState(0.7)
    const [topP, setTopP] = useState(0.9)
    const [systemPrompt, setSystemPrompt] = useState(
        '你是一个专业的知识库助手，请基于提供的文档内容回答用户问题。如果文档中没有相关信息，请明确告知。'
    )

    const evalCases = [
        { id: 1, q: 'Q3 净利润增长原因？', expect: '云服务业务增长', status: 'pending' },
        { id: 2, q: 'RAG 系统向量库选型？', expect: 'Milvus/Pinecone', status: 'pending' },
        { id: 3, q: '合同违约金比例上限？', expect: '30%', status: 'pending' },
        { id: 4, q: 'CEO 关于 AI 的战略？', expect: '云优先', status: 'pending' }
    ]
    const [currentEvalCases, setCurrentEvalCases] = useState<any[]>(evalCases)

    // 处理预设模板切换
    const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value
        if (val === 'professional') {
            setSystemPrompt(
                '你是一个专业的知识库助手，请基于提供的文档内容回答用户问题。如果文档中没有相关信息，请明确告知。请保持回答的严谨性和专业性，并引用具体数据。'
            )
        } else if (val === 'friendly') {
            setSystemPrompt(
                '你是一个友好热情的助手。请用通俗易懂的语言解释文档中的内容，适合非专业人士阅读。可以使用表情符号让语气更轻松。'
            )
        } else if (val === 'concise') {
            setSystemPrompt(
                '你是一个追求高效的助手。请直接回答问题的核心结论，不要废话，列出要点即可。'
            )
        }
    }

    const startEvaluation = () => {
        setIsEvaluating(true)
        setEvalResult(null)
        setCurrentEvalCases(evalCases.map((c) => ({ ...c, status: 'pending' })))
        setTimeout(() => {
            setIsEvaluating(false)
            setEvalResult({ accuracy: 87.5, citationRate: 92.3 })
            setCurrentEvalCases((prev) =>
                prev.map((c, i) => {
                    if (i === 2)
                        return {
                            ...c,
                            status: 'error',
                            errorMsg:
                                "引用了错误的文档 'employee_handbook.pdf'，预期是 'service_contract.docx'。"
                        }
                    return { ...c, status: 'success' }
                })
            )
        }, 2000)
    }

    const handleSave = () => {
        // 这里添加实际的保存逻辑，例如调用 API 更新后端配置
        console.log('Saving settings:', { temperature, topP, systemPrompt })
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                    <h3 className="flex items-center gap-2 text-lg font-bold text-gray-800">
                        <Settings className="h-5 w-5 text-gray-500" />
                        模型设置
                    </h3>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100 px-6">
                    <button
                        onClick={() => setActiveTab('params')}
                        className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'params' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}
                    >
                        参数设置
                    </button>
                    <button
                        onClick={() => setActiveTab('eval')}
                        className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'eval' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}
                    >
                        一键评测
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6">
                    {activeTab === 'params' ? (
                        <div className="space-y-6">
                            {/* Temperature Slider */}
                            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                                <div className="mb-2 flex justify-between">
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                        <Zap className="h-4 w-4 text-orange-500" />
                                        Temperature (随机性)
                                    </label>
                                    <span className="rounded bg-gray-100 px-2 font-mono text-sm text-gray-500">
                                        {temperature}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={temperature}
                                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-blue-600"
                                />
                                <p className="mt-2 text-xs text-gray-400">
                                    值越大回答越发散，值越小回答越确定。
                                </p>
                            </div>

                            {/* Top P Slider */}
                            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                                <div className="mb-2 flex justify-between">
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                        <Target className="h-4 w-4 text-purple-500" />
                                        Top P (核采样)
                                    </label>
                                    <span className="rounded bg-gray-100 px-2 font-mono text-sm text-gray-500">
                                        {topP}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={topP}
                                    onChange={(e) => setTopP(parseFloat(e.target.value))}
                                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-blue-600"
                                />
                            </div>

                            {/* System Prompt with Preset Select */}
                            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                                <div className="mb-3 flex items-center justify-between">
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                        <Bot className="h-4 w-4 text-blue-500" />
                                        系统提示词
                                    </label>
                                    <select
                                        className="cursor-pointer rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-600 transition-colors outline-none hover:border-gray-300 focus:border-blue-400"
                                        onChange={handlePresetChange}
                                        defaultValue=""
                                    >
                                        <option value="" disabled>
                                            ✨ 选择预设模板...
                                        </option>
                                        <option value="professional">🎓 严谨专业风格</option>
                                        <option value="friendly">👋 通俗易懂风格</option>
                                        <option value="concise">⚡ 简洁直白风格</option>
                                    </select>
                                </div>
                                <textarea
                                    className="h-32 w-full resize-none rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm transition-colors focus:border-blue-500 focus:outline-none"
                                    value={systemPrompt}
                                    onChange={(e) => setSystemPrompt(e.target.value)}
                                    placeholder="在此输入自定义的 System Prompt..."
                                />
                            </div>

                            {/* Save & Cancel Buttons */}
                            <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
                                <button
                                    onClick={onClose}
                                    className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
                                >
                                    <Save className="h-4 w-4" />
                                    保存设置
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Evaluation Results */}
                            {evalResult && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-4 rounded-xl border border-green-100 bg-green-50 p-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
                                            <CheckCircle2 className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-semibold text-gray-500 uppercase">
                                                准确率
                                            </div>
                                            <div className="text-2xl font-bold text-gray-800">
                                                {evalResult.accuracy}%
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                                            <Quote className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-semibold text-gray-500 uppercase">
                                                引用率
                                            </div>
                                            <div className="text-2xl font-bold text-gray-800">
                                                {evalResult.citationRate}%
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Action Bar */}
                            <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
                                <div className="text-sm text-gray-600">
                                    共 <span className="font-bold">{evalCases.length}</span>{' '}
                                    条评测用例
                                </div>
                                <button
                                    onClick={startEvaluation}
                                    disabled={isEvaluating}
                                    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-all ${isEvaluating ? 'cursor-not-allowed bg-gray-400' : 'bg-blue-600 shadow-md hover:bg-blue-700'}`}
                                >
                                    {isEvaluating ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            评测中...
                                        </>
                                    ) : (
                                        <>
                                            <Play className="h-4 w-4" />
                                            执行评测
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Test Cases List */}
                            <div className="space-y-2">
                                {currentEvalCases.map((item, idx) => (
                                    <div
                                        key={item.id}
                                        className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
                                    >
                                        <div className="mt-0.5">
                                            {item.status === 'pending' && (
                                                <div className="h-4 w-4 rounded-full border-2 border-gray-200" />
                                            )}
                                            {item.status === 'success' && (
                                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                            )}
                                            {item.status === 'error' && (
                                                <XCircle className="h-4 w-4 text-red-500" />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex justify-between">
                                                <p className="truncate text-sm font-medium text-gray-800">
                                                    Q{idx + 1}: {item.q}
                                                </p>
                                                <span className="text-xs whitespace-nowrap text-gray-400">
                                                    预期: {item.expect}
                                                </span>
                                            </div>
                                            {item.status === 'error' && (
                                                <div className="mt-2 flex items-start gap-1.5 rounded border border-red-100 bg-red-50 p-2 text-xs text-red-700">
                                                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                                                    {item.errorMsg}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// 增加默认导出以提高兼容性
export default SettingsModal
