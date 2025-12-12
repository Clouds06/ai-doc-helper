import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { uploadDocument } from '@/api/lightrag';
import { Toast } from '../common/Toast';
import { cn } from '../../lib/utils';
import { useUploadStore } from '@/hooks/useUploadStore';
import { InnerFileUploader } from './FileUploader';
import { UploadFooter } from './UploadFooter';

interface UploadModalProps {
  onUploadComplete?: () => void | Promise<void>;
}

export const UploadModal = ({ onUploadComplete }: UploadModalProps) => {
  const isOpen = useUploadStore((s) => s.isOpen);
  const close = useUploadStore((s) => s.close);
  const onSuccess = useUploadStore((s) => s.onSuccess);

  const [files, setFiles] = useState<File[]>([]);
  const [progresses, setProgresses] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [finished, setFinished] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'warning' | 'info';
  }>({
    show: false,
    message: '',
    type: 'info',
  });

  const resetState = () => {
    setFiles([]);
    setProgresses({});
    setErrors({});
    setUploading(false);
    setFinished(false);
    setToast({ show: false, message: '', type: 'info' });
  };

  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen]);

  const setProgress = (fileName: string, percent: number) => {
    setProgresses((prev) => ({ ...prev, [fileName]: percent }));
  };

  const setError = (fileName: string, message: string) => {
    setErrors((prev) => ({ ...prev, [fileName]: message }));
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => {
      const target = prev[idx];
      const next = prev.filter((_, i) => i !== idx);

      if (target) {
        setProgresses((p) => {
          const copy = { ...p };
          delete copy[target.name];
          return copy;
        });
        setErrors((p) => {
          const copy = { ...p };
          delete copy[target.name];
          return copy;
        });
      }

      return next;
    });
  };

  const showToast = (
    message: string,
    type: 'success' | 'warning' | 'info',
  ) => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, show: false }));
  };

  const startUpload = async () => {
    if (files.length === 0 || uploading || finished) return;

    setUploading(true);
    let hasSuccess = false;

    for (const file of files) {
      try {
        setProgress(file.name, 0);

        const res = await uploadDocument(file, (percent: number) => {
          setProgress(file.name, percent);
        });

        if (res.status === 'success') {
          hasSuccess = true;
          setProgress(file.name, 100);
        } else {
          setError(file.name, '上传失败，请稍后重试');
        }
      } catch {
        setError(file.name, '上传失败，请检查网络或稍后再试');
      }
    }

    setUploading(false);
    setFinished(true);

    if (hasSuccess) {
      showToast('上传完成，后台处理中', 'success');

      // 使用 await 延迟 800ms，让用户看清成功状态
      await new Promise((resolve) => setTimeout(resolve, 800));

      // 1. 先关闭弹窗 (确保状态重置)
      close();

      // 2. 再执行回调 (刷新或跳转)
      if (typeof onSuccess === 'function') {
        // 场景A: 知识库页面 (DocumentsView) -> 刷新列表
        onSuccess();
      } else if (onUploadComplete) {
        // 场景B: 首页 (App) -> 跳转页面
        onUploadComplete();
      }
    } else {
      showToast('全部失败，请检查文件', 'warning');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}

      <div className="w-full max-w-lg max-h-[90vh] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h1 className="text-lg font-bold text-gray-800">上传文档</h1>
            <p className="text-xs text-gray-500 mt-1">支持 PDF、TXT、MD、DOCX（最大 200MB）</p>
          </div>
          <button
            disabled={uploading}
            onClick={close}
            aria-label="取消上传文件"
            className={cn(
              'p-2 rounded-full transition-colors',
              uploading ? 'text-gray-300' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100',
            )}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-200">
          <InnerFileUploader
            disabled={uploading || finished}
            maxFileCount={Infinity}
            multiple
            maxSize={200 * 1024 * 1024}
            files={files}
            progresses={progresses}
            errors={errors}
            setFiles={setFiles}
            removeFile={removeFile}
            setError={setError}
          />
        </div>

        <UploadFooter
          files={files}
          uploading={uploading}
          finished={finished}
          startUpload={startUpload}
        />
      </div>
    </div>
  );
};
