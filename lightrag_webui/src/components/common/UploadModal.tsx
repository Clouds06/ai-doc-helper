import { useState } from 'react';
import { X, Upload } from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete?: () => void;
}

export const UploadModal = ({ isOpen, onClose, onUploadComplete }: UploadModalProps) => {
  const [isDragging, setIsDragging] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all scale-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">上传文件</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-8">
          <div className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 cursor-pointer ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50'}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); if(onUploadComplete) onUploadComplete(); onClose(); }}
            onClick={() => { if(onUploadComplete) onUploadComplete(); onClose(); }}
          >
            <Upload className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">拖拽文件至此</h4>
            <p className="text-gray-500 text-sm">支持 PDF, Word, Excel, Markdown 等 (最大 100MB)</p>
          </div>
        </div>
      </div>
    </div>
  );
};
