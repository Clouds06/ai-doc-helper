import { useState } from 'react';
import { ImageIcon, FileText, Mic, Globe, ChevronDown, ArrowRight } from 'lucide-react';
import { useTypewriterLoop } from '../../hooks/useTypewriter';

interface HeroSearchCardProps {
  onSearch: (query: string) => void;
  onUpload: () => void;
  isHighlightUpload: boolean;
  isHighlightInput: boolean;
  onInputInteract: () => void;
}

export const HeroSearchCard = ({ onSearch, onUpload, isHighlightUpload, isHighlightInput, onInputInteract }: HeroSearchCardProps) => {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const animatedPlaceholder = useTypewriterLoop(["试着问我：这份财报的重点是什么？", "帮我总结一下会议纪要的核心内容", "如何配置 RAG 系统的向量数据库？"], isFocused);

  return (
    <div className="w-full mb-6">
      <h1 className="text-2xl font-bold text-center text-gray-800 mb-5 tracking-tight">懂你的文件问答助手</h1>
      <div className="bg-white rounded-[20px] shadow-xl border border-gray-100 overflow-hidden relative group">
        <div className="p-6 flex flex-col items-center justify-center border-b border-dashed border-gray-100 bg-gray-50/30">
          <div className={`w-full h-24 border rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center gap-2 bg-white group/upload ${isHighlightUpload ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)] scale-[1.01]' : 'border-transparent shadow-sm hover:border-blue-100 hover:bg-blue-50/50'}`} onClick={onUpload}>
            <div className="flex -space-x-2 transition-transform group-hover/upload:scale-105 duration-300">
               <div className="w-9 h-9 bg-orange-50 rounded-lg flex items-center justify-center text-orange-500 border-2 border-white shadow-sm"><ImageIcon className="w-4 h-4" /></div>
               <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 z-10 border-2 border-white shadow-sm"><FileText className="w-4 h-4" /></div>
               <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center text-green-500 border-2 border-white shadow-sm"><Mic className="w-4 h-4" /></div>
            </div>
            <p className="text-gray-400 text-xs group-hover/upload:text-blue-600 transition-colors mt-1"><span className={`font-semibold ${isHighlightUpload ? 'text-blue-600' : 'text-gray-600'}`}>上传文件</span> 或拖拽至此 (PDF, Doc, MD...)</p>
          </div>
        </div>
        <div className="p-3 bg-white relative">
          {isHighlightInput && !isFocused && <div className="absolute inset-2 bg-blue-400/10 rounded-lg animate-pulse pointer-events-none transition-opacity duration-500" />}
          <form onSubmit={(e) => { e.preventDefault(); if (input.trim()) onSearch(input); }} className="w-full relative z-10">
            <div className="relative">
              <textarea className="w-full h-12 px-4 py-3 text-base bg-transparent resize-none focus:outline-none text-gray-800 placeholder-transparent transition-all align-top overflow-hidden" value={input} onChange={(e) => setInput(e.target.value)} onFocus={() => { setIsFocused(true); onInputInteract(); }} onBlur={() => { if(!input) setIsFocused(false); }} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (input.trim()) onSearch(input); } }} />
              {!input && <div className="absolute inset-0 px-4 py-3 pointer-events-none flex items-start">{(animatedPlaceholder || !isFocused) ? <><span className={`${isHighlightInput ? 'text-blue-500/80' : 'text-gray-400'} whitespace-pre-wrap transition-colors duration-300`}>{animatedPlaceholder}</span>{!isFocused && <span className={`animate-pulse ${isHighlightInput ? 'text-blue-500' : 'text-gray-400'}`}>|</span>}</> : null}</div>}
            </div>
            <div className="flex items-center justify-end mt-1 pt-1 border-t border-transparent pr-2">
              <div className="flex items-center gap-2">
                 <button type="button" className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-700 transition-colors"><Globe className="w-3 h-3" />联网<ChevronDown className="w-2.5 h-2.5" /></button>
                 <button type="submit" disabled={!input.trim()} className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 ${input.trim() ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700' : 'bg-gray-100 text-gray-300'}`}><ArrowRight className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
