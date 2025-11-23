import { useState } from 'react';
import { HelpCircle, FileCheck } from 'lucide-react';
import { HeroSearchCard } from '../components/home/HeroSearchCard';
import { DetailedOnboarding } from '../components/home/DetailedOnboarding';
import { ScenarioSection } from '../components/home/ScenarioSection';
import { UploadModal } from '../components/common/UploadModal';

interface HomeViewProps {
  onNavigate: (tab: any) => void;
  onSearch: (query: string) => void;
  showToast: (msg: string, type: 'success' | 'warning' | 'info') => void;
}

export const HomeView = ({ onNavigate, onSearch, showToast }: HomeViewProps) => {
  const [onboardingStep, setOnboardingStep] = useState(2);
  const [showGuide, setShowGuide] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUploadComplete = () => { setIsProcessing(true); setTimeout(() => { setIsProcessing(false); setOnboardingStep(3); setShowCelebration(true); setTimeout(() => setShowCelebration(false), 2000); }, 5000); };

  const handleSearchAttempt = (query: string) => {
    if (isProcessing) { showToast('AI 正在阅读文档，请稍等片刻...', 'warning'); return; }
    if (onboardingStep === 2 && !isProcessing) { showToast('未检测到知识库，已切换至通用问答模式', 'info'); setTimeout(() => onSearch(query), 1000); return; }
    onSearch(query);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 relative overflow-y-auto">
      <div className={`flex flex-col w-full max-w-3xl mx-auto px-4 min-h-full transition-all duration-500 ease-in-out ${showGuide ? 'justify-start pt-8 md:pt-16' : 'justify-center pb-20'}`}>
        <HeroSearchCard onSearch={handleSearchAttempt} onUpload={() => setShowUpload(true)} isHighlightUpload={showGuide && onboardingStep === 2 && !isProcessing} isHighlightInput={showGuide && onboardingStep === 3} onInputInteract={() => { if(onboardingStep===3) setOnboardingStep(4); }} />

        {showGuide ?
          <DetailedOnboarding step={Math.min(onboardingStep, 3)} onDismiss={() => setShowGuide(false)} onAction={() => setShowUpload(true)} showConfetti={showCelebration} isProcessing={isProcessing} />
          : <div className="w-full flex justify-center mb-6 transition-all duration-500"><button onClick={() => setShowGuide(true)} className="text-xs text-gray-400 hover:text-blue-600 flex items-center gap-1.5 transition-colors py-2 px-4 rounded-full hover:bg-white/50"><HelpCircle className="w-3 h-3" />新手引导</button></div>
        }

        {!isProcessing && onboardingStep === 3 && <div className="w-full flex gap-2 justify-center mb-4 transition-all duration-300"><div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-[10px] border border-green-100"><FileCheck className="w-3 h-3" /><span>2024财务报表.pdf 已建立索引</span></div></div>}

        <ScenarioSection onSearch={handleSearchAttempt} />
      </div>
      <UploadModal isOpen={showUpload} onClose={() => setShowUpload(false)} onUploadComplete={handleUploadComplete} />
    </div>
  );
};
