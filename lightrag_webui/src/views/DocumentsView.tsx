import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Search,
  Upload,
  Loader2,
  CheckCircle2,
  FileText,
  MoreVertical,
  Trash2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  FileCode,
  FileSpreadsheet,
  File,
  Clock,
  PlayCircle
} from 'lucide-react'
import { getDocuments, deleteDocument } from '../api/lightrag'
import { DocStatusResponse, PaginationInfo } from '../types'
import { toast } from 'sonner'
import { errorMessage } from '@/lib/utils'
import { useUploadStore } from '../hooks/useUploadStore'

interface DocumentsViewProps {
  onUpload?: () => void
}

// 工具函数：格式化文件大小
const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// 工具函数：格式化日期
const formatDate = (isoString: string) => {
  if (!isoString) return '-'
  return new Date(isoString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const DocumentsView = ({}: DocumentsViewProps) => {
  // 数据状态
  const [docs, setDocs] = useState<DocStatusResponse[]>([])
  const [loading, setLoading] = useState(false)

  // 筛选与搜索状态
  const [filterType, setFilterType] = useState<'all' | 'pdf' | 'docx' | 'txt' | 'md'>('all')
  const [keyword, setKeyword] = useState('')

  // 分页状态
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    page_size: 16,
    total_count: 0,
    total_pages: 1,
    has_next: false,
    has_prev: false
  })

  // 上传 Modal 控制
  const openUploadModal = useUploadStore((state) => state.open)

  // UI 交互状态
  const [activeMenuDocId, setActiveMenuDocId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuDocId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 核心：获取文档列表数据
  const fetchDocs = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      let fileTypeParam: string | undefined = undefined
      if (filterType !== 'all') {
        fileTypeParam = filterType
      }

      const res = await getDocuments({
        page,
        page_size: pagination.page_size,
        keyword: keyword || undefined,
        file_type: fileTypeParam,
        sort_field: 'updated_at',
        sort_direction: 'desc'
      })

      setDocs(res.documents)
      setPagination(res.pagination)
    } catch (err) {
      console.error(err)
      toast.error('获取文档列表失败: ' + errorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [filterType, keyword, pagination.page_size])

  // 初始加载及筛选条件变化时触发
  useEffect(() => {
    fetchDocs(1)
  }, [filterType])

  //  打开上传模态框，并传入回调
  const triggerUpload = () => {
    // 调用 Store 的 open 方法，传入刷新逻辑
    openUploadModal(async () => {
      // 增加 1.5 秒延迟，等待后端异步任务完成初步入库
      await new Promise((resolve) => setTimeout(resolve, 1500))
      // 刷新列表
      await fetchDocs(1)
    })
  }

  // 处理删除
  const handleDelete = async (docId: string) => {
    if (!window.confirm('确定要删除该文档及其所有索引数据吗？此操作不可恢复。')) return

    try {
      await deleteDocument(docId)
      toast.success('文档已删除')
      await new Promise((resolve) => setTimeout(resolve, 1000))
      fetchDocs(pagination.page)
      setActiveMenuDocId(null)
    } catch (err) {
      toast.error('删除失败: ' + errorMessage(err))
    }
  }

  // 处理搜索框回车
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      fetchDocs(1)
    }
  }

  // 优化图标显示
  const getIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'pdf':
        return <FileText className="h-6 w-6 text-red-500" />
      case 'doc':
      case 'docx':
        return <FileText className="h-6 w-6 text-blue-500" />
      case 'md':
        return <FileCode className="h-6 w-6 text-amber-600" />
      case 'txt':
        return <FileText className="h-6 w-6 text-gray-500" />
      case 'xls':
      case 'xlsx':
      case 'csv':
        return <FileSpreadsheet className="h-6 w-6 text-emerald-500" />
      case 'ppt':
      case 'pptx':
        return <FileText className="h-6 w-6 text-orange-500" />
      case 'json':
      case 'xml':
      case 'html':
        return <FileCode className="h-6 w-6 text-slate-500" />
      default:
        return <File className="h-6 w-6 text-gray-400" />
    }
  }

  // 状态显示
  const getStatusBadge = (status: string) => {
    const s = status ? status.toUpperCase() : 'UNKNOWN'
    switch (s) {
      case 'PROCESSED':
        return (
          <div className="flex items-center gap-1 rounded-full border border-green-100 bg-green-50 px-2 py-0.5 text-[10px] text-green-600">
            <CheckCircle2 className="h-3 w-3" />
            <span>已完成</span>
          </div>
        )
      case 'FAILED':
        return (
          <div className="flex items-center gap-1 rounded-full border border-red-100 bg-red-50 px-2 py-0.5 text-[10px] text-red-600">
            <AlertCircle className="h-3 w-3" />
            <span>失败</span>
          </div>
        )
      case 'PENDING':
        return (
          <div className="flex items-center gap-1 rounded-full border border-yellow-100 bg-yellow-50 px-2 py-0.5 text-[10px] text-yellow-600">
            <Clock className="h-3 w-3" />
            <span>排队中</span>
          </div>
        )
      case 'PROCESSING':
        return (
          <div className="flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] text-blue-600">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>处理中</span>
          </div>
        )
      case 'PREPROCESSED':
        return (
          <div className="flex items-center gap-1 rounded-full border border-purple-100 bg-purple-50 px-2 py-0.5 text-[10px] text-purple-600">
            <PlayCircle className="h-3 w-3" />
            <span>预处理</span>
          </div>
        )
      default:
        return (
          <div className="flex items-center gap-1 rounded-full border border-gray-100 bg-gray-50 px-2 py-0.5 text-[10px] text-gray-500">
            <span>{s}</span>
          </div>
        )
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-slate-50 px-4 py-6 md:px-8">

      {/* 顶部标题与操作栏 */}
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">我的知识库</h2>
          <p className="mt-1 text-sm text-slate-500">管理并构建您的私有数据索引</p>
        </div>
        <div className="flex gap-2">
          <div className="group relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-blue-500" />
            <input
              type="text"
              placeholder="搜索文件名..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              onBlur={() => fetchDocs(1)}
              className="w-48 rounded-lg border border-gray-200 bg-white py-2 pr-4 pl-9 text-sm text-gray-700 shadow-sm transition-all placeholder:text-gray-400 focus:w-64 focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 focus:outline-none"
            />
          </div>
          <button
            onClick={triggerUpload}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white shadow-md shadow-blue-200 transition-colors hover:bg-blue-700"
          >
            <Upload className="h-4 w-4" />
            上传文件
          </button>
        </div>
      </div>

      {/* 筛选标签栏 */}
      <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1">
        {(['all', 'pdf', 'docx', 'md', 'txt'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${filterType === t ? 'bg-blue-600 text-white' : 'border border-transparent bg-white text-gray-500 hover:bg-gray-100'}`}
          >
            {t === 'all' ? '全部文件' : t.toUpperCase()}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
           <button
             onClick={() => fetchDocs(pagination.page)}
             className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
             title="刷新列表"
            >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 文档列表区域 */}
      <div className="flex-1 overflow-y-auto pb-4">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {docs.length > 0 ? (
              docs.map((doc) => {
                const summary = doc.content_summary || '';
                const displaySummary = summary.length > 100 ? summary.slice(0, 100) + '...' : summary;
                const tooltipTitle = summary ? `摘要: ${displaySummary}` : doc.file_path;

                return (
                  <div
                    key={doc.id}
                    title={tooltipTitle}
                    className="group relative cursor-pointer rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:border-blue-200 hover:shadow-md flex flex-col justify-between"
                  >
                    {/* 右上角更多操作菜单 */}
                    <div
                      className={`absolute top-2 right-2 z-10 ${activeMenuDocId === doc.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity duration-200`}
                    >
                      <div className="relative" ref={activeMenuDocId === doc.id ? menuRef : null}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setActiveMenuDocId(activeMenuDocId === doc.id ? null : doc.id)
                          }}
                          className={`rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 ${activeMenuDocId === doc.id ? 'bg-gray-100 text-gray-600' : 'bg-white/80 backdrop-blur-sm'}`}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {activeMenuDocId === doc.id && (
                          <div className="animate-in fade-in zoom-in-95 absolute top-full right-0 z-20 mt-1 w-32 origin-top-right rounded-lg border border-gray-100 bg-white py-1 shadow-xl duration-200">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(doc.id)
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> 删除
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mb-4 flex items-center gap-3 pr-8">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-50">
                        {getIcon(doc.file_path)}
                      </div>
                      <h3
                        className="line-clamp-2 text-sm font-semibold text-gray-800 break-all"
                      >
                        {doc.file_path.split('/').pop() || doc.id}
                      </h3>
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                      <div className="flex items-center gap-2 text-[10px] text-gray-400">
                        <span>{formatSize(doc.content_length)}</span>
                        <span>•</span>
                        <span>{formatDate(doc.updated_at)}</span>
                      </div>
                      <div>
                        {getStatusBadge(doc.status)}
                      </div>
                    </div>

                    {doc.error_msg && (
                      <div className="mt-2 text-[10px] text-red-500 line-clamp-1" title={doc.error_msg}>
                        错误: {doc.error_msg}
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
                <Search className="mb-3 h-12 w-12 opacity-20" />
                <p>未找到匹配的文件</p>
              </div>
            )}
          </div>
        )}
      </div>

      {pagination.total_pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-4 text-sm text-gray-600">
          <button
            onClick={() => fetchDocs(pagination.page - 1)}
            disabled={!pagination.has_prev}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent"
          >
            <ChevronLeft className="h-4 w-4" /> 上一页
          </button>
          <span>
            {pagination.page} / {pagination.total_pages}
          </span>
          <button
            onClick={() => fetchDocs(pagination.page + 1)}
            disabled={!pagination.has_next}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent"
          >
            下一页 <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
