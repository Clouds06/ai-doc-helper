import { useState } from 'react';
import { Toast } from './components/common/Toast';
import { SettingsModal } from './components/settings/SettingsModal';
import { UploadModal } from './components/common/UploadModal';
import { TopNavbar } from './components/common/TopNavbar';
import { HomeView } from './views/HomeView';
import { DocumentsView } from './views/DocumentsView';
import { ChatView } from './views/ChatView';
import { Tab } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [initialChatQuery, setInitialChatQuery] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [toast, setToast] = useState<{show: boolean, message: string, type: 'success' | 'warning' | 'info'}>({ show: false, message: '', type: 'info' });
  const showToast = (message: string, type: 'success' | 'warning' | 'info') => { setToast(prev => ({ ...prev, show: false })); setTimeout(() => { setToast({ show: true, message, type }); }, 10); };

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100 relative overflow-hidden">
      {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast(prev => ({ ...prev, show: false }))} />}

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      <TopNavbar activeTab={activeTab} onNavigate={setActiveTab} onOpenSettings={() => setIsSettingsOpen(true)} />

      <main className="flex-1 relative flex flex-col min-h-0 overflow-hidden">
        {activeTab === 'home' && <HomeView onNavigate={setActiveTab} onSearch={(q: string) => { setInitialChatQuery(q); setActiveTab('chat'); }} showToast={showToast} />}
        {activeTab === 'documents' && <DocumentsView onUpload={() => setShowUpload(true)} />}
        {activeTab === 'chat' && <ChatView initialQuery={initialChatQuery} />}
      </main>

      <UploadModal isOpen={showUpload} onClose={() => setShowUpload(false)} onUploadComplete={() => showToast('上传成功，后台处理中', 'success')} />
    </div>
  );
}
