import { Sparkles, LayoutDashboard, MessageSquare, Files, Settings } from 'lucide-react';
import { Tab } from '../../types';

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: any;
  label: string;
}

const NavButton = ({ active, onClick, icon: Icon, label }: NavButtonProps) => (
  <button onClick={onClick} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${active ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}>
    <Icon className={`w-4 h-4 ${active ? 'text-blue-600' : 'text-gray-500'}`} />
    <span className="hidden sm:block">{label}</span>
  </button>
);

interface TopNavbarProps {
  activeTab: Tab;
  onNavigate: (tab: Tab) => void;
  onOpenSettings: () => void;
}

export const TopNavbar = ({ activeTab, onNavigate, onOpenSettings }: TopNavbarProps) => {
  return (
    <nav className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-gray-200 h-14 px-4 flex items-center justify-between shadow-sm transition-all">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('home')}>
          <div className="w-7 h-7 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-bold text-gray-800 hidden md:block">Knowledge AI</span>
        </div>
        <div className="flex items-center gap-1">
          <NavButton active={activeTab === 'home'} onClick={() => onNavigate('home')} icon={LayoutDashboard} label="首页" />
          <NavButton active={activeTab === 'chat'} onClick={() => onNavigate('chat')} icon={MessageSquare} label="对话" />
          <NavButton active={activeTab === 'documents'} onClick={() => onNavigate('documents')} icon={Files} label="知识库" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onOpenSettings} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all text-gray-500 hover:bg-gray-100 hover:text-gray-900">
          <Settings className="w-4 h-4 text-gray-500" /><span className="hidden sm:block">设置</span>
        </button>
        <div className="w-px h-5 bg-gray-200 mx-1 hidden md:block"></div>
        <button className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold ring-2 ring-white shadow-sm">JD</div>
        </button>
      </div>
    </nav>
  );
};
