import {
  IconSparkles,
  IconLayoutDashboard,
  IconMessageSquare,
  IconFiles,
  IconSettings
} from '@/components/icons'
import { useLocation, useNavigate } from 'react-router-dom'
import type { Tab } from '../../types'

interface NavButtonProps {
  active: boolean
  onClick: () => void
  icon: any
  label: string
}

const NavButton = ({ active, onClick, icon: Icon, label }: NavButtonProps) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
      active ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
    }`}
  >
    <Icon className={`h-4 w-4 ${active ? 'text-blue-600' : 'text-gray-500'}`} />
    <span className="hidden sm:block">{label}</span>
  </button>
)

interface TopNavbarProps {
  onOpenSettings: () => void
}

export const TopNavbar = ({ onOpenSettings }: TopNavbarProps) => {
  const navigate = useNavigate()
  const location = useLocation()

  const path = location.pathname || '/'
  const activeTab: Tab = path.startsWith('/chat')
    ? 'chat'
    : path.startsWith('/documents')
      ? 'documents'
      : 'home'

  const handleNavigate = (tab: Tab) => {
    if (tab === 'home') navigate('/')
    if (tab === 'chat') navigate('/chat')
    if (tab === 'documents') navigate('/documents')
  }

  return (
    <nav className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-gray-200 bg-white/90 px-4 shadow-sm backdrop-blur-md transition-all">
      <div className="flex items-center gap-6">
        <div
          className="flex cursor-pointer items-center gap-2"
          onClick={() => handleNavigate('home')}
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-md">
            <IconSparkles className="h-4 w-4 text-white" />
          </div>
          <span className="hidden text-base font-bold text-gray-800 md:block">
            AI知识库文档助手
          </span>
        </div>
        <div className="flex items-center gap-1">
          <NavButton
            active={activeTab === 'home'}
            onClick={() => handleNavigate('home')}
            icon={IconLayoutDashboard}
            label="首页"
          />
          <NavButton
            active={activeTab === 'chat'}
            onClick={() => handleNavigate('chat')}
            icon={IconMessageSquare}
            label="对话"
          />
          <NavButton
            active={activeTab === 'documents'}
            onClick={() => handleNavigate('documents')}
            icon={IconFiles}
            label="知识库"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-gray-500 transition-all hover:bg-gray-100 hover:text-gray-900"
        >
          <IconSettings className="h-4 w-4 text-gray-500" />
          <span className="hidden sm:block">设置</span>
        </button>
      </div>
    </nav>
  )
}

