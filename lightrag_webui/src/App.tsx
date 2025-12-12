import { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Toast } from './components/common/Toast';
import { SettingsModal } from './components/settings/SettingsModal';
import { UploadModal } from './components/common/UploadModal';
import { TopNavbar } from './components/common/TopNavbar';
import { HomeView } from './views/HomeView';
import { ChatView } from './views/ChatView';
import { DocumentsView } from './views/DocumentsView';
import { useRagStore } from './hooks/useRagStore';
import { sanitizeQuery } from './lib/utils';

export default function App() {
  const navigate = useNavigate();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'warning' | 'info';
  }>({
    show: false,
    message: '',
    type: 'info',
  });

  const setPendingQuery = useRagStore((s) => s.setPendingQuery);

  const showToast = (
    message: string,
    type: 'success' | 'warning' | 'info',
  ) => {
    setToast((prev) => ({ ...prev, show: false }));
    setTimeout(() => {
      setToast({ show: true, message, type });
    }, 10);
  };

  // TODO：与ChatView合并逻辑
  // 首页搜索 设置pendingQuery 跳到chat
  const handleSearchToChat = (q: string) => {
    const cleaned = sanitizeQuery(q);
    if (!cleaned) {
      showToast('问题包含敏感词，请重新输入问题', 'warning');
      return;
    }
    setPendingQuery(cleaned);
    navigate('/chat');
  };

  // TODO：与DocumentsView合并逻辑
  // 上传完成后跳转到documents页面
  const handleUploadComplete = async () => {
    showToast('上传成功，后台处理中', 'success');
    navigate('/documents', { replace: true });
    return Promise.resolve();
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans text-slate-900">
      <Toaster position="top-center" richColors />

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast((prev) => ({...prev, show: false }))}
        />
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        showToast={showToast}
      />

      <TopNavbar onOpenSettings={() => setIsSettingsOpen(true)} />

      <main className="flex-1 relative flex flex-col min-h-0 overflow-hidden">
        <Routes>
          <Route path="/" element={<HomeView onSearch={handleSearchToChat} />} />
          <Route path="/chat" element={<ChatView />} />
          <Route path="/documents" element={<DocumentsView />} />
        </Routes>
      </main>

      <UploadModal onUploadComplete={handleUploadComplete} />
    </div>
  );
}
