import { useState } from 'react'
import { X, Upload } from 'lucide-react'

interface UploadModalProps {
    isOpen: boolean
    onClose: () => void
    onUploadComplete?: () => void
}

export const UploadModal = ({ isOpen, onClose, onUploadComplete }: UploadModalProps) => {
    const [isDragging, setIsDragging] = useState(false)

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl scale-100 transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                    <h3 className="text-lg font-semibold text-gray-900">上传文件</h3>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="p-8">
                    <div
                        className={`cursor-pointer rounded-xl border-2 border-dashed p-12 text-center transition-all duration-200 ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50'}`}
                        onDragOver={(e) => {
                            e.preventDefault()
                            setIsDragging(true)
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => {
                            e.preventDefault()
                            setIsDragging(false)
                            if (onUploadComplete) onUploadComplete()
                            onClose()
                        }}
                        onClick={() => {
                            if (onUploadComplete) onUploadComplete()
                            onClose()
                        }}
                    >
                        <Upload className="mx-auto mb-4 h-12 w-12 text-blue-400" />
                        <h4 className="mb-2 text-lg font-medium text-gray-900">拖拽文件至此</h4>
                        <p className="text-sm text-gray-500">
                            支持 PDF, Word, Excel, Markdown 等 (最大 100MB)
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
