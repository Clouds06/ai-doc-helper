import { useState } from 'react'
import { HelpCircle, FileCheck } from 'lucide-react'
import { HeroSearchCard } from '../components/home/HeroSearchCard'
import { DetailedOnboarding } from '../components/home/DetailedOnboarding'
import { ScenarioSection } from '../components/home/ScenarioSection'
import { UploadModal } from '../components/common/UploadModal'

interface HomeViewProps {
    onNavigate: (tab: any) => void
    onSearch: (query: string) => void
    showToast: (msg: string, type: 'success' | 'warning' | 'info') => void
}

export const HomeView = ({ onNavigate, onSearch, showToast }: HomeViewProps) => {
    const [onboardingStep, setOnboardingStep] = useState(2)
    const [showGuide, setShowGuide] = useState(true)
    const [showUpload, setShowUpload] = useState(false)
    const [showCelebration, setShowCelebration] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)

    const handleUploadComplete = () => {
        setIsProcessing(true)
        setTimeout(() => {
            setIsProcessing(false)
            setOnboardingStep(3)
            setShowCelebration(true)
            setTimeout(() => setShowCelebration(false), 2000)
        }, 5000)
    }

    const handleSearchAttempt = (query: string) => {
        if (isProcessing) {
            showToast('AI 正在阅读文档，请稍等片刻...', 'warning')
            return
        }
        if (onboardingStep === 2 && !isProcessing) {
            showToast('未检测到知识库，已切换至通用问答模式', 'info')
            setTimeout(() => onSearch(query), 1000)
            return
        }
        onSearch(query)
    }

    return (
        <div className="relative flex h-full flex-col overflow-y-auto bg-slate-50/50">
            <div
                className={`mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 transition-all duration-500 ease-in-out ${showGuide ? 'justify-start pt-8 md:pt-16' : 'justify-center pb-20'}`}
            >
                <HeroSearchCard
                    onSearch={handleSearchAttempt}
                    onUpload={() => setShowUpload(true)}
                    isHighlightUpload={showGuide && onboardingStep === 2 && !isProcessing}
                    isHighlightInput={showGuide && onboardingStep === 3}
                    onInputInteract={() => {
                        if (onboardingStep === 3) setOnboardingStep(4)
                    }}
                />

                {showGuide ? (
                    <DetailedOnboarding
                        step={Math.min(onboardingStep, 3)}
                        onDismiss={() => setShowGuide(false)}
                        onAction={() => setShowUpload(true)}
                        showConfetti={showCelebration}
                        isProcessing={isProcessing}
                    />
                ) : (
                    <div className="mb-6 flex w-full justify-center transition-all duration-500">
                        <button
                            onClick={() => setShowGuide(true)}
                            className="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs text-gray-400 transition-colors hover:bg-white/50 hover:text-blue-600"
                        >
                            <HelpCircle className="h-3 w-3" />
                            新手引导
                        </button>
                    </div>
                )}

                {!isProcessing && onboardingStep === 3 && (
                    <div className="mb-4 flex w-full justify-center gap-2 transition-all duration-300">
                        <div className="flex items-center gap-1.5 rounded-full border border-green-100 bg-green-50 px-3 py-1 text-[10px] text-green-700">
                            <FileCheck className="h-3 w-3" />
                            <span>2024财务报表.pdf 已建立索引</span>
                        </div>
                    </div>
                )}

                <ScenarioSection onSearch={handleSearchAttempt} />
            </div>
            <UploadModal
                isOpen={showUpload}
                onClose={() => setShowUpload(false)}
                onUploadComplete={handleUploadComplete}
            />
        </div>
    )
}
