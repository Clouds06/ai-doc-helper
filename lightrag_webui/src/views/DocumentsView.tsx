import { useState, useEffect, useRef } from 'react'
import {
  Search,
  Upload,
  Database,
  Files,
  Zap,
  Filter,
  Loader2,
  CheckCircle2,
  FileText,
  Plus,
  MoreVertical,
  Trash2,
  Edit2,
  Download,
  Share2
} from 'lucide-react'
import { MOCK_DOCS } from '../data/mock'

interface DocumentsViewProps {
  onUpload: () => void
}

export const DocumentsView = ({ onUpload }: DocumentsViewProps) => {
  const [filter, setFilter] = useState<'all' | 'pdf' | 'doc' | 'sheet'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeSearch, setActiveSearch] = useState('')

  // 新增：控制当前激活的菜单 ID
  const [activeMenuDocId, setActiveMenuDocId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // 新增：点击外部关闭菜单的逻辑
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuDocId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredDocs = MOCK_DOCS.filter((d) => {
    const typeMatch = filter === 'all' || d.type === filter
    const searchMatch =
      !activeSearch.trim() ||
      d.name.toLowerCase().includes(activeSearch.toLowerCase()) ||
      d.tags.some((t) => t.toLowerCase().includes(activeSearch.toLowerCase()))
    return typeMatch && searchMatch
  })

  const getIcon = (type: string) => {
    switch (type) {
    case 'pdf':
      return <FileText className="h-6 w-6 text-red-500" />
    case 'doc':
      return <FileText className="h-6 w-6 text-blue-500" />
    case 'sheet':
      return <Database className="h-6 w-6 text-green-500" />
    default:
      return <FileText className="h-6 w-6 text-gray-400" />
    }
  }

  const handleSearchCommit = () => {
    setActiveSearch(searchTerm)
  }

  const handleMenuAction = (e: React.MouseEvent, action: string, docId: string) => {
    e.stopPropagation() // 防止触发卡片点击
    console.log(`Action: ${action} on doc: ${docId}`)
    setActiveMenuDocId(null)
    // 这里可以添加实际的业务逻辑，比如弹出删除确认框等
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-slate-50 px-4 py-6 md:px-8">
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
              placeholder="搜索文件..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchCommit()}
              onBlur={handleSearchCommit}
              className="w-48 rounded-lg border border-gray-200 bg-white py-2 pr-4 pl-9 text-sm text-gray-700 shadow-sm transition-all placeholder:text-gray-400 focus:w-64 focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 focus:outline-none"
            />
          </div>
          <button
            onClick={onUpload}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white shadow-md shadow-blue-200 transition-colors hover:bg-blue-700"
          >
            <Upload className="h-4 w-4" />
            上传文件
          </button>
        </div>
      </div>
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <div className="mb-1 text-xs text-gray-500">已用存储</div>
            <div className="text-lg font-bold text-gray-800">
              45.2 MB <span className="text-xs font-normal text-gray-400">/ 500 MB</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <Files className="h-5 w-5" />
          </div>
          <div>
            <div className="mb-1 text-xs text-gray-500">文档总数</div>
            <div className="text-lg font-bold text-gray-800">
              12 <span className="text-xs font-normal text-gray-400">个文件</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 text-green-600">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <div className="mb-1 text-xs text-gray-500">本月消耗</div>
            <div className="text-lg font-bold text-gray-800">
              1,240 <span className="text-xs font-normal text-gray-400">Tokens</span>
            </div>
          </div>
        </div>
      </div>
      <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1">
        {(['all', 'pdf', 'doc', 'sheet'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${filter === t ? 'bg-blue-600 text-white' : 'border border-transparent bg-white text-gray-500 hover:bg-gray-100'}`}
          >
            {t === 'all' ? '全部文件' : t.toUpperCase()}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 text-gray-400">
          <button className="rounded-md p-1.5 hover:bg-gray-100">
            <Filter className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDocs.length > 0 ? (
            filteredDocs.map((doc) => (
              <div
                key={doc.id}
                className="group relative cursor-pointer rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
              >
                {/* 更多操作菜单区域 */}
                <div
                  className={`absolute top-3 right-3 z-10 ${activeMenuDocId === doc.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity duration-200`}
                >
                  <div className="relative" ref={activeMenuDocId === doc.id ? menuRef : null}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setActiveMenuDocId(activeMenuDocId === doc.id ? null : doc.id)
                      }}
                      className={`rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 ${activeMenuDocId === doc.id ? 'bg-gray-100 text-gray-600' : ''}`}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {activeMenuDocId === doc.id && (
                      <div className="animate-in fade-in zoom-in-95 absolute top-full right-0 z-20 mt-1 w-32 origin-top-right rounded-lg border border-gray-100 bg-white py-1 shadow-xl duration-200">
                        <button
                          onClick={(e) => handleMenuAction(e, 'rename', doc.id)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50"
                        >
                          <Edit2 className="h-3.5 w-3.5" /> 重命名
                        </button>
                        <button
                          onClick={(e) => handleMenuAction(e, 'download', doc.id)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50"
                        >
                          <Download className="h-3.5 w-3.5" /> 下载
                        </button>
                        <button
                          onClick={(e) => handleMenuAction(e, 'share', doc.id)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50"
                        >
                          <Share2 className="h-3.5 w-3.5" /> 分享
                        </button>
                        <div className="my-1 h-px bg-gray-100"></div>
                        <button
                          onClick={(e) => handleMenuAction(e, 'delete', doc.id)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> 删除
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-3 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50">
                    {getIcon(doc.type)}
                  </div>
                  <div className="mr-6 flex flex-col items-end gap-1">
                    {' '}
                    {/* mr-6 为菜单按钮留出空间 */}
                    {doc.status === 'indexing' ? (
                      <div className="flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] text-blue-600">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>索引中</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 rounded-full border border-green-100 bg-green-50 px-2 py-0.5 text-[10px] text-green-600">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>就绪</span>
                      </div>
                    )}
                  </div>
                </div>
                <h3
                  className="mb-1 line-clamp-1 pr-4 text-sm font-semibold text-gray-800"
                  title={doc.name}
                >
                  {doc.name}
                </h3>
                <div className="mb-3 flex items-center gap-2 text-[10px] text-gray-400">
                  <span>{doc.size}</span>
                  <span>•</span>
                  <span>{doc.date}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {doc.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded bg-gray-50 px-1.5 py-0.5 text-[10px] text-gray-500"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
              <Search className="mb-3 h-12 w-12 opacity-20" />
              <p>未找到匹配的文件</p>
            </div>
          )}
          <button
            onClick={onUpload}
            className="flex h-[154px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 p-4 text-gray-400 transition-all hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-500"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 transition-colors group-hover:bg-white">
              <Plus className="h-5 w-5" />
            </div>
            <span className="text-xs font-medium">上传新文档</span>
          </button>
        </div>
      </div>
    </div>
  )
}
