import { useState, lazy, Suspense } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { Toast } from './components/common/Toast'
import { LazySettingsModal } from './components/settings/LazySettingsModal'
import { UploadModal } from './components/common/UploadModal'
import { TopNavbar } from './components/common/TopNavbar'
import { HomeView } from './views/HomeView'
import { useRagStore } from './hooks/useRagStore'
import { sanitizeQuery } from './lib/utils'

const ChatView = lazy(() => import('./views/ChatView'))
const DocumentsView = lazy(() => import('./views/DocumentsView'))

const RouteLoadingFallback = () => (
  <div className="flex h-full items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
      <p className="text-sm text-gray-500">加载中...</p>
    </div>
  </div>
)

export default function App() {
  const navigate = useNavigate()

  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [toast, setToast] = useState<{
    show: boolean
    message: string
    type: 'success' | 'warning' | 'info'
  }>({
    show: false,
    message: '',
    type: 'info'
  })

  const setPendingQuery = useRagStore((s) => s.setPendingQuery)

  const showToast = (message: string, type: 'success' | 'warning' | 'info') => {
    setToast((prev) => ({ ...prev, show: false }))
    setTimeout(() => {
      setToast({ show: true, message, type })
    }, 10)
  }

  const handleSearchToChat = (q: string) => {
    const cleaned = sanitizeQuery(q)
    if (!cleaned) {
      showToast('问题包含敏感词，请重新输入问题', 'warning')
      return
    }
    if (cleaned.length < 3) {
      showToast('问题过短，请输入至少3个字符', 'warning')
      return
    }
    setPendingQuery(cleaned)
    navigate('/chat')
  }

  const handleUploadComplete = async () => {
    showToast('上传成功，后台处理中', 'success')
    navigate('/documents', { replace: true })
    return Promise.resolve()
  }

  return (
    <div className="flex h-screen flex-col bg-slate-50 font-sans text-slate-900">
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast((prev) => ({ ...prev, show: false }))}
        />
      )}

      <LazySettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        showToast={showToast}
      />

      <TopNavbar onOpenSettings={() => setIsSettingsOpen(true)} />

      <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <Routes>
          <Route path="/" element={<HomeView onSearch={handleSearchToChat} />} />

          <Route
            path="/chat"
            element={
              <Suspense fallback={<RouteLoadingFallback />}>
                <ChatView />
              </Suspense>
            }
          />
          <Route
            path="/documents"
            element={
              <Suspense fallback={<RouteLoadingFallback />}>
                <DocumentsView />
              </Suspense>
            }
          />
        </Routes>
      </main>

      <UploadModal onUploadComplete={handleUploadComplete} />
    </div>
  )
}

