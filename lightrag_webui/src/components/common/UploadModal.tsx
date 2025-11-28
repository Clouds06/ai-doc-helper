import { useState, useRef } from 'react'
import { X, Upload, FileText, FileSpreadsheet, FileDown, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { uploadDocument } from '../../api'

interface UploadModalProps {
    isOpen: boolean
    onClose: () => void
    onUploadComplete?: () => void
}

interface UploadFile {
    file: File
    id: string
    name: string
    size: string
    type: string
    progress: number
    status: 'uploading' | 'success' | 'error'
    error?: string
}

export const UploadModal = ({ isOpen, onClose, onUploadComplete }: UploadModalProps) => {
    const [isDragging, setIsDragging] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)

    if (!isOpen) return null

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    const getFileIcon = (type: string) => {
        if (type.includes('pdf')) return <FileDown className="w-4 h-4 text-red-500" />
        if (type.includes('word') || type.includes('doc')) return <FileText className="w-4 h-4 text-blue-500" />
        if (type.includes('excel') || type.includes('sheet')) return <FileSpreadsheet className="w-4 h-4 text-green-500" />
        return <FileText className="w-4 h-4 text-gray-500" />
    }

    const handleFiles = async (files: FileList) => {
        if (uploading || files.length === 0) return

        setUploading(true)
        const newFiles: UploadFile[] = Array.from(files).map(file => ({
            file,
            id: `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            size: formatFileSize(file.size),
            type: file.type,
            progress: 0,
            status: 'uploading'
        }))

        setUploadedFiles([...uploadedFiles, ...newFiles])

        try {
            await uploadDocument(
                Array.from(files),
                (progress) => {
                    // 更新所有上传中文件的进度
                    setUploadedFiles(prev => prev.map(file => {
                        if (file.status === 'uploading') {
                            return { ...file, progress }
                        }
                        return file
                    }))
                }
            )

            // 更新文件状态为成功
            setUploadedFiles(prev => prev.map(file => {
                if (file.status === 'uploading') {
                    return { ...file, status: 'success', progress: 100 }
                }
                return file
            }))

            // 上传完成回调
            if (onUploadComplete) onUploadComplete()

            // 延迟关闭，让用户看到成功状态
            setTimeout(() => {
                setUploadedFiles([])
                setUploading(false)
                onClose()
            }, 1500)
        } catch (error) {
            // 更新文件状态为错误
            setUploadedFiles(prev => prev.map(file => {
                if (file.status === 'uploading') {
                    return {
                        ...file,
                        status: 'error',
                        error: error instanceof Error ? error.message : '上传失败'
                    }
                }
                return file
            }))
            setUploading(false)
        }
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = () => {
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        handleFiles(e.dataTransfer.files)
    }

    const handleClick = () => {
        if (uploading) return
        fileInputRef.current?.click()
    }

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            handleFiles(e.target.files)
            e.target.value = '' // 重置input，允许重复上传相同文件
        }
    }

    const handleRemoveFile = (id: string) => {
        setUploadedFiles(prev => prev.filter(file => file.id !== id))
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl scale-100 transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                    <h3 className="text-lg font-semibold text-gray-900">上传文件</h3>
                    <button
                        onClick={onClose}
                        disabled={uploading}
                        className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-50"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="p-6">
                    {!uploading && uploadedFiles.length === 0 ? (
                        <div
                            className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-all duration-200 ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50'}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={handleClick}
                        >
                            <Upload className="mx-auto mb-4 h-12 w-12 text-blue-400" />
                            <h4 className="mb-2 text-lg font-medium text-gray-900">拖拽文件至此或点击上传</h4>
                            <p className="text-sm text-gray-500">
                                支持 PDF, Word, Excel, Markdown 等 (最大 100MB)
                            </p>
                            <input
                                type="file"
                                multiple
                                ref={fileInputRef}
                                onChange={handleFileInputChange}
                                className="hidden"
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.md,.txt"
                            />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <h4 className="text-sm font-medium text-gray-700">上传进度</h4>
                            <div className="space-y-3">
                                {uploadedFiles.map(file => (
                                    <div key={file.id} className="bg-gray-50 rounded-lg p-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                {getFileIcon(file.type)}
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{file.name}</div>
                                                    <div className="text-xs text-gray-500">{file.size}</div>
                                                </div>
                                            </div>
                                            {file.status !== 'uploading' && (
                                                <button
                                                    onClick={() => handleRemoveFile(file.id)}
                                                    className="text-gray-400 hover:text-gray-600 p-1"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                        {file.status === 'uploading' && (
                                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                <div
                                                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                                                    style={{ width: `${file.progress}%` }}
                                                ></div>
                                            </div>
                                        )}
                                        {file.status === 'success' && (
                                            <div className="flex items-center gap-1 text-green-600 text-xs mt-1">
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                <span>上传成功</span>
                                            </div>
                                        )}
                                        {file.status === 'error' && (
                                            <div className="flex items-center gap-1 text-red-600 text-xs mt-1">
                                                <AlertTriangle className="w-3.5 h-3.5" />
                                                <span>{file.error}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            {uploading && (
                                <div className="text-sm text-gray-500 text-center">正在上传，请稍候...</div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}