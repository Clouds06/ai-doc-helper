import {
    Sparkles,
    RefreshCw,
    ArrowRight,
    FileText,
    BarChart3,
    Code,
    Settings,
    BookOpen,
    MessageCircle
} from 'lucide-react'
import { ALL_SCENARIOS, THEME_STYLES } from '../../data/mock'

interface ScenarioSectionProps {
    onSearch: (query: string) => void
}

// 创建图标映射函数
const getIconComponent = (iconName: string, size = 'w-4 h-4') => {
    switch (iconName) {
    case 'FileText':
        return <FileText className={size} />
    case 'BarChart3':
        return <BarChart3 className={size} />
    case 'Code':
        return <Code className={size} />
    case 'Settings':
        return <Settings className={size} />
    case 'BookOpen':
        return <BookOpen className={size} />
    case 'MessageCircle':
        return <MessageCircle className={size} />
    default:
        return null
    }
}

export const ScenarioSection = ({ onSearch }: ScenarioSectionProps) => {
    return (
        <div className="w-full">
            <div className="mb-3 flex items-center justify-between px-1">
                <h3 className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
                    <Sparkles className="h-3 w-3 text-blue-400" />
                    可以这样问
                </h3>
                <button className="flex items-center gap-1 rounded px-2 py-1 text-[10px] text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-700">
                    <RefreshCw className="h-3 w-3" />
                    换一批
                </button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {ALL_SCENARIOS.slice(0, 3).map((demo) => {
                    const style = THEME_STYLES[demo.theme]
                    return (
                        <button
                            key={demo.id}
                            onClick={() => onSearch(demo.query)}
                            className="group relative overflow-hidden rounded-xl border border-gray-100 bg-white p-3 text-left shadow-sm transition-all duration-200 hover:border-blue-300 hover:shadow-md"
                        >
                            <div className="relative z-10 mb-2 flex items-start justify-between">
                                <div
                                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-300 ${style.bg} ${style.text} ${style.hoverBg} ${style.hoverText}`}
                                >
                                    {getIconComponent(demo.icon)}
                                </div>
                                <ArrowRight className="h-3 w-3 text-gray-300 transition-colors group-hover:text-blue-500" />
                            </div>
                            <h4 className="relative z-10 mb-1 line-clamp-1 text-xs font-medium text-gray-800">
                                {demo.title}
                            </h4>
                            <p className="relative z-10 line-clamp-1 text-[10px] text-gray-400 group-hover:text-gray-500">
                                {demo.desc}
                            </p>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}