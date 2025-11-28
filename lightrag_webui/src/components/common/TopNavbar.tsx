import { Sparkles, LayoutDashboard, MessageSquare, Files, Settings } from 'lucide-react'
import { Tab } from '../../types'

interface NavButtonProps {
    active: boolean
    onClick: () => void
    icon: any
    label: string
}

const NavButton = ({ active, onClick, icon: Icon, label }: NavButtonProps) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${active ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
    >
        <Icon className={`h-4 w-4 ${active ? 'text-blue-600' : 'text-gray-500'}`} />
        <span className="hidden sm:block">{label}</span>
    </button>
)

interface TopNavbarProps {
    activeTab: Tab
    onNavigate: (tab: Tab) => void
    onOpenSettings: () => void
}

export const TopNavbar = ({ activeTab, onNavigate, onOpenSettings }: TopNavbarProps) => {
    return (
        <nav className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-gray-200 bg-white/90 px-4 shadow-sm backdrop-blur-md transition-all">
            <div className="flex items-center gap-6">
                <div
                    className="flex cursor-pointer items-center gap-2"
                    onClick={() => onNavigate('home')}
                >
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-md">
                        <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <span className="hidden text-base font-bold text-gray-800 md:block">
                        Knowledge AI
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <NavButton
                        active={activeTab === 'home'}
                        onClick={() => onNavigate('home')}
                        icon={LayoutDashboard}
                        label="首页"
                    />
                    <NavButton
                        active={activeTab === 'chat'}
                        onClick={() => onNavigate('chat')}
                        icon={MessageSquare}
                        label="对话"
                    />
                    <NavButton
                        active={activeTab === 'documents'}
                        onClick={() => onNavigate('documents')}
                        icon={Files}
                        label="知识库"
                    />
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={onOpenSettings}
                    className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-gray-500 transition-all hover:bg-gray-100 hover:text-gray-900"
                >
                    <Settings className="h-4 w-4 text-gray-500" />
                    <span className="hidden sm:block">设置</span>
                </button>
                <div className="mx-1 hidden h-5 w-px bg-gray-200 md:block"></div>
                <button className="flex items-center gap-2 rounded-full p-1 transition-colors hover:bg-gray-100">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                        JD
                    </div>
                </button>
            </div>
        </nav>
    )
}
