import { X, CheckCircle2, Upload, Loader2, PlayCircle } from 'lucide-react';
import { MiniConfetti } from '../common/MiniConfetti';

interface DetailedOnboardingProps {
  step: number;
  onDismiss: () => void;
  onAction: () => void;
  showConfetti: boolean;
  isProcessing: boolean;
}

export const DetailedOnboarding = ({ step, onDismiss, onAction, showConfetti, isProcessing }: DetailedOnboardingProps) => (
  <div className="w-full mb-6 transition-all duration-500 relative">
    <div className="bg-white border border-blue-100 rounded-xl p-4 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-2xl opacity-50 -mr-10 -mt-10 pointer-events-none" />
      {showConfetti && <MiniConfetti />}
      <div className="flex justify-between items-center mb-4 relative z-10">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">{step < 3 && <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />}新手引导：构建您的专属知识库</h3>
        <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded transition-colors"><X className="w-3.5 h-3.5" /></button>
      </div>
      <div className="flex items-center justify-between gap-4 relative z-10">
        <div className={`flex items-center gap-3 flex-1 ${step > 1 ? 'opacity-60' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center shadow-sm"><CheckCircle2 className="w-4 h-4" /></div>
          <div className="flex flex-col"><span className="text-xs font-semibold text-gray-900">账号创建</span><span className="text-[10px] text-gray-500">已完成注册</span></div>
          <div className={`h-0.5 flex-1 mx-2 rounded ${step > 1 ? 'bg-green-100' : 'bg-gray-100'}`} />
        </div>
        <div className={`flex items-center gap-3 flex-[1.5] transition-all duration-300 ${step === 2 || isProcessing ? 'scale-100 opacity-100' : 'opacity-60 grayscale'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-colors ${step > 2 && !isProcessing ? 'bg-green-100 text-green-600' : ((step === 2 || isProcessing) ? 'bg-blue-600 text-white ring-2 ring-blue-100 ring-offset-1' : 'bg-gray-100 text-gray-400')}`}>
            {step > 2 && !isProcessing ? <CheckCircle2 className="w-4 h-4" /> : (isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />)}
          </div>
          <div className="flex flex-col"><span className={`text-xs font-semibold ${(step === 2 || isProcessing) ? 'text-blue-700' : 'text-gray-900'}`}>{isProcessing ? "AI 正在学习..." : "上传文档"}</span><span className="text-[10px] text-gray-500">{isProcessing ? "解析与向量化中" : "支持 PDF/Word"}</span></div>
          {step === 2 && !isProcessing && <button onClick={onAction} className="ml-auto bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-xs font-medium shadow-sm transition-transform active:scale-95 animate-pulse">去上传</button>}
          {isProcessing && <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md text-[10px] font-medium border border-blue-100"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span><span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-75"></span><span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-150"></span></div>}
          <div className={`h-0.5 flex-1 mx-2 rounded ${step > 2 ? 'bg-green-100' : 'bg-gray-100'}`} />
        </div>
        <div className={`flex items-center gap-3 flex-1 transition-all duration-300 ${step === 3 && !isProcessing ? 'scale-105 opacity-100' : 'opacity-40 grayscale'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-colors ${step === 3 && !isProcessing ? 'bg-indigo-600 text-white border-transparent shadow-lg shadow-indigo-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}><PlayCircle className="w-4 h-4" /></div>
          <div className="flex flex-col"><span className={`text-xs font-semibold ${step === 3 && !isProcessing ? 'text-indigo-700' : 'text-gray-900'}`}>开始问答</span><span className="text-[10px] text-gray-500">深度挖掘知识</span></div>
        </div>
      </div>
    </div>
  </div>
);
