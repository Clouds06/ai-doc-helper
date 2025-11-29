import { useState, FormEvent, KeyboardEvent } from 'react';
import { ImageIcon, FileText, Mic, Globe, ChevronDown, ArrowRight } from 'lucide-react';
import { useTypewriterLoop } from '@/hooks/useTypewriter';
import { useUploadStore } from '@/hooks/useUploadStore';
import { PLACEHOLDER_LOOP_WORDS } from '@/data/mock';

interface HeroSearchCardProps {
  onSearch: (query: string) => void;
  initialQuery?: string;
}

export const HeroSearchCard = ({
  onSearch,
  initialQuery = '',
}: HeroSearchCardProps) => {
  return (
    <div className="w-full mb-6">

      <div className="relative overflow-hidden bg-white border border-gray-100 rounded-[20px] shadow-xl">
        <HomeUploadZone />
        <HomeSearch onSearch={onSearch} initialQuery={initialQuery} />
      </div>
    </div>
  );
};

const HomeUploadZone = () => {
  const openUploadModal = useUploadStore((s) => s.open);

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-gray-50/40 border-b border-dashed border-gray-100">
      <button
        type="button"
        onClick={openUploadModal}
        aria-label="上传文件"
        className="group w-full h-24 flex flex-col items-center justify-center gap-2 rounded-xl border border-transparent bg-white shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50/50"
      >
        <div className="flex -space-x-2 transition-transform duration-300 group-hover:scale-105">
          <div className="flex items-center justify-center w-9 h-9 text-orange-500 bg-orange-50 border-2 border-white rounded-lg shadow-sm">
            <ImageIcon className="w-4 h-4" />
          </div>
          <div className="flex items-center justify-center w-9 h-9 text-blue-600 bg-blue-50 border-2 border-white rounded-lg shadow-sm z-10">
            <FileText className="w-4 h-4" />
          </div>
          <div className="flex items-center justify-center w-9 h-9 text-green-500 bg-green-50 border-2 border-white rounded-lg shadow-sm">
            <Mic className="w-4 h-4" />
          </div>
        </div>
        <p className="mt-1 text-sm text-gray-500 transition-colors group-hover:text-blue-600">
          <span className="font-semibold text-gray-700 group-hover:text-blue-600">点击上传</span>{' '}
          或将文件拖拽到此处（MD / DOCX / PDF ...）
        </p>
      </button>
    </div>

  );
};

interface HomeSearchProps {
  onSearch: (query: string) => void;
  initialQuery?: string;
}

const HomeSearch = ({
  onSearch,
  initialQuery = ''
}: HomeSearchProps) => {
  const [input, setInput] = useState(initialQuery);
  const [isFocused, setIsFocused] = useState(false);
  const animatedPlaceholder = useTypewriterLoop(
    PLACEHOLDER_LOOP_WORDS,
    isFocused,
  );
  const placeholder = animatedPlaceholder;
  const hasText = input.trim().length > 0;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!hasText) return;
    onSearch(input.trim());
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (hasText) onSearch(input.trim());
    }
  };

  return (
    <div className="relative p-3 bg-white">
      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full text-left"
      >
        <div className="relative">
          <label htmlFor="hero-query" className="sr-only">请输入你要查询的问题</label>
          <textarea
            id="hero-query"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => {setIsFocused(true);}}
            onBlur={() => {if (!input) {setIsFocused(false);}}}
            onKeyDown={handleKeyDown}
            rows={1}
            className="w-full h-12 px-4 py-3 text-base text-gray-800 bg-transparent resize-none overflow-hidden align-top placeholder-transparent focus:outline-none"
          />
          {!input && (
            <div className="absolute inset-0 flex items-start px-4 py-3 pointer-events-none">
              <span className="text-m text-gray-600 whitespace-pre-wrap transition-colors duration-300">
                {placeholder}
              </span>
              {!isFocused && (
                <span className="ml-0.5 text-gray-600 animate-pulse">
                  |
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end pt-1 mt-1 border-t border-transparent pr-2">
          <div className="flex items-center gap-2">
            {/* TODO: "联网搜索"按钮为未来功能占位，可能会被移除或修改，保留以便后续实现 */}
            <button
              type="button"
              aria-label="联网搜索"
              className="flex items-center gap-1 text-xs text-gray-500 transition-colors hover:text-gray-800"
            >
              <Globe className="w-3 h-3" />联网<ChevronDown className="w-2.5 h-2.5" />
            </button>

            <button
              type="submit"
              disabled={!hasText}
              aria-label="发送问题"
              className={`flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200 ${
                hasText ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700' : 'bg-gray-100 text-gray-300 cursor-default'
              }`}
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
