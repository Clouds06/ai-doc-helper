import { Sparkles, LayoutDashboard, MessageSquare, Files, Settings } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Tab } from '../../types';

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: any;
  label: string;
}

const NavButton = ({ active, onClick, icon: Icon, label }: NavButtonProps) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
      active
        ? 'bg-blue-50 text-blue-700'
        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
    }`}
  >
    <Icon className={`w-4 h-4 ${active ? 'text-blue-600' : 'text-gray-500'}`} />
    <span className="hidden sm:block">{label}</span>
  </button>
);

interface TopNavbarProps {
  onOpenSettings: () => void;
}

export const TopNavbar = ({ onOpenSettings }: TopNavbarProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const path = location.pathname || '/';
  const activeTab: Tab =
    path.startsWith('/chat')
      ? 'chat'
      : path.startsWith('/documents')
        ? 'documents'
        : 'home';

  const handleNavigate = (tab: Tab) => {
    if (tab === 'home') navigate('/');
    if (tab === 'chat') navigate('/chat');
    if (tab === 'documents') navigate('/documents');
  };

  return (
    <nav className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-gray-200 h-14 px-4 flex items-center justify-between shadow-sm transition-all">
      <div className="flex items-center gap-6">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => handleNavigate('home')}
        >
          <div className="w-7 h-7 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-bold text-gray-800 hidden md:block">AI知识库文档助手</span>
        </div>
        <div className="flex items-center gap-1">
          <NavButton
            active={activeTab === 'home'}
            onClick={() => handleNavigate('home')}
            icon={LayoutDashboard}
            label="首页"
          />
          <NavButton
            active={activeTab === 'chat'}
            onClick={() => handleNavigate('chat')}
            icon={MessageSquare}
            label="对话"
          />
          <NavButton
            active={activeTab === 'documents'}
            onClick={() => handleNavigate('documents')}
            icon={Files}
            label="知识库"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all text-gray-500 hover:bg-gray-100 hover:text-gray-900"
        >
          <Settings className="w-4 h-4 text-gray-500" />
          <span className="hidden sm:block">设置</span>
        </button>
      </div>
    </nav>
  );
};
