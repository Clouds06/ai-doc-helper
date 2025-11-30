import { cn, formatFileSize } from '@/lib/utils';
import { Upload, ImageIcon, FileText, X } from 'lucide-react';
import Dropzone, { FileRejection } from 'react-dropzone';

interface InnerFileUploaderProps {
  disabled?: boolean;
  maxSize?: number;
  maxFileCount?: number;
  multiple?: boolean;
  files: File[];
  progresses: Record<string, number>;
  errors: Record<string, string>;
  setFiles: (files: File[]) => void;
  removeFile: (idx: number) => void;
  setError: (fileName: string, message: string) => void;
}

export const InnerFileUploader = ({
  disabled = false,
  maxSize = 200 * 1024 * 1024,
  maxFileCount = Infinity,
  multiple = true,
  files,
  progresses,
  errors,
  setFiles,
  removeFile,
  setError,
}: InnerFileUploaderProps) => {
  const onDrop = (accepted: File[], rejected: FileRejection[]) => {
    const next = [...files, ...accepted];
    if (next.length <= maxFileCount) {
      setFiles(next);
    }

    rejected.forEach(({ file, errors }) => {
      const msg = errors[0]?.message ?? '文件不支持';
      setError(file.name, msg);
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <Dropzone
        onDrop={onDrop}
        maxSize={maxSize}
        disabled={disabled}
        multiple={multiple}
      >
        {({ getRootProps, getInputProps }) => (
          <div
            {...getRootProps()}
            className={cn(
              'border-2 border-dashed rounded-xl p-8 grid place-items-center cursor-pointer transition-all',
              'hover:border-blue-400 hover:bg-blue-50/50',
              disabled && 'opacity-50 cursor-not-allowed',
            )}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-3 text-gray-600">
              <Upload className="w-8 h-8 text-blue-500/80" />
              <p className="text-sm font-medium text-gray-700">点击或拖拽文件上传</p>
              <p className="text-xs text-gray-400">支持 PDF / MD / TXT / DOCX</p>
            </div>
          </div>
        )}
      </Dropzone>

      {/* 文件列表区域 */}
      <div className="flex flex-col gap-2 max-h-[240px] overflow-y-auto pr-1">
        {files.map((file, idx) => {
          const error = errors[file.name];
          const progress = progresses[file.name] ?? 0;

          return (
            <div
              key={file.name + idx}
              className={cn(
                'flex items-center p-3 rounded-lg border transition-all',
                error
                  ? 'border-red-200 bg-red-50/30'
                  : 'bg-white border-gray-100 hover:border-blue-200 hover:shadow-sm',
              )}
            >
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center mr-3',
                error ? 'bg-red-100' : 'bg-gray-100'
              )}>
                {file.type.startsWith('image/') ? (
                  <ImageIcon className={cn('w-5 h-5', error ? 'text-red-500' : 'text-gray-500')} />
                ) : (
                  <FileText className={cn('w-5 h-5', error ? 'text-red-500' : 'text-gray-500')} />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-sm font-medium mb-1">
                  <span className="truncate text-gray-700">{file.name}</span>
                  <span className="text-xs text-gray-400 font-normal ml-2">
                    {formatFileSize(file.size)}
                  </span>
                </div>

                {error ? (
                  <p className="text-xs text-red-500">{error}</p>
                ) : (
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </div>

              <button
                className="ml-3 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                onClick={() => removeFile(idx)}
                disabled={disabled}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
