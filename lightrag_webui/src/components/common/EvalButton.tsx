import { Play, Target } from 'lucide-react';

interface EvalButtonProps {
  onStartEvaluation: () => void;
}

export const EvalButton = ({ onStartEvaluation }: EvalButtonProps) => {
  return (
    <div className="h-full min-h-[70vh] flex flex-col items-center justify-center text-center animate-fade-in pb-10">
      <div className="bg-white p-6 rounded-full shadow-lg mb-6 ring-4 ring-indigo-50">
        <Target className="w-16 h-16 text-indigo-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-3">
        准备好开始评测了吗？
      </h2>
      <p className="text-gray-500 max-w-md mb-8 leading-relaxed">
        系统将使用预设文档和问答进行全量评测。
      </p>
      <button
        onClick={onStartEvaluation}
        className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-xl font-medium shadow-lg transition-all flex items-center gap-2 transform hover:-translate-y-0.5"
      >
        <Play className="w-5 h-5 fill-current" />
        <span>开始全量评测</span>
      </button>
    </div>
  );
};
