import { cn, formatFileSize } from '@/lib/utils'
import { IconUpload, IconImageIcon, IconFileText, IconX } from '@/components/icons'
import Dropzone, { FileRejection } from 'react-dropzone'

interface InnerFileUploaderProps {
  disabled?: boolean
  uploading?: boolean
  maxSize?: number
  maxFileCount?: number
  multiple?: boolean
  files: File[]
  progresses: Record<string, number>
  errors: Record<string, string>
  setFiles: (files: File[]) => void
  removeFile: (idx: number) => void
  setError: (fileName: string, message: string) => void
}

export const InnerFileUploader = ({
  disabled = false,
  uploading = false,
  maxSize = 200 * 1024 * 1024,
  maxFileCount = Infinity,
  multiple = true,
  files,
  progresses,
  errors,
  setFiles,
  removeFile,
  setError
}: InnerFileUploaderProps) => {
  const onDrop = (accepted: File[], rejected: FileRejection[]) => {
    const next = [...files, ...accepted]
    if (next.length <= maxFileCount) {
      setFiles(next)
    }

    rejected.forEach(({ file, errors }) => {
      const msg = errors[0]?.message ?? '文件不支持'
      setError(file.name, msg)
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <Dropzone onDrop={onDrop} maxSize={maxSize} disabled={disabled} multiple={multiple}>
        {({ getRootProps, getInputProps }) => (
          <div
            {...getRootProps()}
            className={cn(
              'grid cursor-pointer place-items-center rounded-xl border-2 border-dashed p-8 transition-all',
              'hover:border-blue-400 hover:bg-blue-50/50',
              disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-3 text-gray-600">
              <IconUpload className="h-8 w-8 text-blue-500/80" />
              <p className="text-sm font-medium text-gray-700">点击或拖拽文件上传</p>
              <p className="text-xs text-gray-400">支持 PDF / MD / TXT / DOCX</p>
            </div>
          </div>
        )}
      </Dropzone>

      {/* 文件列表区域 */}
      <div className="flex max-h-[240px] flex-col gap-2 overflow-y-auto pr-1">
        {files.map((file, idx) => {
          const error = errors[file.name]
          const progress = progresses[file.name] ?? 0

          return (
            <div
              key={file.name + idx}
              className={cn(
                'flex items-center rounded-lg border p-3 transition-all',
                error
                  ? 'border-red-200 bg-red-50/30'
                  : 'border-gray-100 bg-white hover:border-blue-200 hover:shadow-sm'
              )}
            >
              <div
                className={cn(
                  'mr-3 flex h-10 w-10 items-center justify-center rounded-lg',
                  error ? 'bg-red-100' : 'bg-gray-100'
                )}
              >
                {file.type.startsWith('image/') ? (
                  <IconImageIcon
                    className={cn('h-5 w-5', error ? 'text-red-500' : 'text-gray-500')}
                  />
                ) : (
                  <IconFileText
                    className={cn('h-5 w-5', error ? 'text-red-500' : 'text-gray-500')}
                  />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-1 flex justify-between text-sm font-medium">
                  <span className="truncate text-gray-700">{file.name}</span>
                  <span className="ml-2 text-xs font-normal text-gray-400">
                    {formatFileSize(file.size)}
                  </span>
                </div>

                {error ? (
                  <p className="text-xs text-red-500">{error}</p>
                ) : (
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </div>

              <button
                className="ml-3 rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                onClick={() => removeFile(idx)}
                disabled={uploading}
              >
                <IconX className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

