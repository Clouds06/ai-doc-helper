import { cn } from '@/lib/utils';
import { CheckCircle2, UploadCloud } from 'lucide-react';

interface UploadFooterProps {
  files: File[];
  uploading: boolean;
  finished: boolean;
  startUpload: () => void;
}

export const UploadFooter = ({
  files,
  uploading,
  finished,
  startUpload,
}: UploadFooterProps) => {
  return (
    <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-between items-center">
      <span className="text-xs text-gray-500 font-medium">
        {files.length > 0 ? `已选择 ${files.length} 个文件` : ''}
      </span>

      <button
        onClick={startUpload}
        disabled={files.length === 0 || uploading || finished}
        aria-label="上传所选文件"
        className={cn(
          'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm transition-all transform active:scale-95',
          files.length === 0 || uploading || finished
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200',
        )}
      >
        {uploading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            上传中…
          </>
        ) : finished ? (
          <>
            <CheckCircle2 className="w-4 h-4" />
            完成
          </>
        ) : (
          <>
            <UploadCloud className="w-4 h-4" />
            确认上传
          </>
        )}
      </button>
    </div>
  );


}
