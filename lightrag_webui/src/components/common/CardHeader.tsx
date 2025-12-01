import { Settings, X } from 'lucide-react';

interface CardHeaderProps {
  title: string;
  description: string;
  onClose: () => void;
}

export const CardHeader = ({
  title,
  description,
  onClose
}: CardHeaderProps) => {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
          <Settings className="w-4.5 h-4.5 text-indigo-600" />
        </div>
        <div>
          <div className="text-md font-semibold text-gray-900">
            {title}
          </div>
          <div className="text-xs text-gray-500">
            {description}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="inline-flex items-center justify-center rounded-full p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
