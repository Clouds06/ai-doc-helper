
import { RotateCcw, Save } from 'lucide-react';
interface ParamsFooterProps {
  handleReset: () => void;
  handleSaveClick: () => void;
}

export const ParamsFooter = ({
  handleReset,
  handleSaveClick,
}: ParamsFooterProps) => {
  return (
    <div className="sticky bottom-0 left-0 w-full bg-transparent backdrop-blur-md border-t border-gray-100 px-6 py-3 flex justify-end gap-4 z-20 ">
      <button
        onClick={handleReset}
        type="button"
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-all shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]"
      >
        <RotateCcw size={16} />
        恢复默认
      </button>
      <button
        onClick={handleSaveClick}
        type="button"
        className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]"
      >
        <Save size={16} />
        保存配置
      </button>
    </div>
  );
}
