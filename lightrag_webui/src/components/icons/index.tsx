// src/components/icons/index.tsx
/**
 * 统一的图标管理系统
 *
 * 优势：
 * 1. 集中管理所有图标，避免重复导入
 * 2. 支持按需加载，tree-shaking 优化
 * 3. 可以轻松切换图标实现（SVG/图标库/图标字体）
 * 4. 统一的尺寸和样式管理
 */

import { ComponentProps, JSX } from 'react'

type IconProps = ComponentProps<'svg'> & {
  size?: number | string
}

// 通用的 SVG 包装器
const createIcon = (path: string | JSX.Element, viewBox = '0 0 24 24') => {
  const Icon = ({ size = 20, className = '', ...props }: IconProps) => (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {typeof path === 'string' ? <path d={path} /> : path}
    </svg>
  )
  Icon.displayName = 'Icon'
  return Icon
}

// ==================== 导航类图标 ====================
export const IconSparkles = createIcon(
  <>
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
  </>
)

export const IconLayoutDashboard = createIcon('M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z')

export const IconMessageSquare = createIcon(
  <>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </>
)

export const IconFiles = createIcon(
  <>
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
  </>
)

export const IconSettings = createIcon(
  <>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </>
)

// ==================== 操作类图标 ====================
export const IconX = createIcon('M18 6 6 18M6 6l12 12')

export const IconUploadCloud = createIcon(
  <>
    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
    <path d="m12 12-3 3m0 0 3 3m-3-3v9" />
  </>
)

export const IconArrowRight = createIcon('M5 12h14m-7-7 7 7-7 7')

export const IconPlus = createIcon('M5 12h14m-7-7v14')

export const IconTrash2 = createIcon(
  <>
    <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    <line x1="10" x2="10" y1="11" y2="17" />
    <line x1="14" x2="14" y1="11" y2="17" />
  </>
)

export const IconSave = createIcon(
  <>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </>
)

export const IconRotateCcw = createIcon(
  <>
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </>
)

export const IconRefreshCw = createIcon(
  <>
    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
  </>
)

// ==================== 状态类图标 ====================
export const IconCheckCircle2 = createIcon(
  'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm-1.5-7.5 6-6'
)

export const IconAlertCircle = createIcon(
  <>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" x2="12" y1="8" y2="12" />
    <line x1="12" x2="12.01" y1="16" y2="16" />
  </>
)

export const IconInfo = createIcon(
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4m0-4h.01" />
  </>
)

export const IconActivity = createIcon(
  'M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2'
)

export const IconLoader2 = createIcon(
  <>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </>
)

// ==================== 内容类图标 ====================
export const IconFileText = createIcon(
  <>
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    <path d="M10 9H8m8 4H8m8 4H8" />
  </>
)

export const IconImageIcon = createIcon(
  <>
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
  </>
)

export const IconMic = createIcon(
  <>
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2m7 9v4m-4 0h8" />
  </>
)

export const IconCpu = createIcon(
  <>
    <rect width="16" height="16" x="4" y="4" rx="2" />
    <rect width="6" height="6" x="9" y="9" rx="1" />
    <path d="M15 2v2m0 16v2M2 15h2m16 0h2M2 9h2m16 0h2M9 2v2m0 16v2" />
  </>
)

// ==================== 功能类图标 ====================
export const IconSearch = createIcon(
  <>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </>
)

export const IconThermometer = createIcon('M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z')

export const IconHelpCircle = createIcon(
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3m.08 4h.01" />
  </>
)

export const IconChevronDown = createIcon('m6 9 6 6 6-6')

export const IconChevronRight = createIcon('m9 18 6-6-6-6')

export const IconChevronLeft = createIcon('m15 18-6-6 6-6')

export const IconPlay = createIcon('m6 3 14 9-14 9Z')

export const IconTarget = createIcon(
  <>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </>
)

export const IconBot = createIcon(
  <>
    <path d="M12 8V4H8" />
    <rect width="16" height="12" x="4" y="8" rx="2" />
    <path d="M2 14h2m16 0h2M8 18v2m8-2v2M9 10h.01M15 10h.01" />
  </>
)

export const IconUpload = createIcon(
  <>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" x2="12" y1="3" y2="15" />
  </>
)

// ==================== 评测相关图标 ====================
export const IconBookOpenCheck = createIcon(
  <>
    <path d="M8 3H2v15h7c1.7 0 3 1.3 3 3V7c0-2.2-1.8-4-4-4Z" />
    <path d="m16 12 2 2 4-4" />
    <path d="M22 6V3h-6c-2.2 0-4 1.8-4 4v14c0-1.7 1.3-3 3-3h7v-2.3" />
  </>
)

export const IconSearchCheck = createIcon(
  <>
    <path d="m8 11 2 2 4-4" />
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </>
)

export const IconFilterIcon = createIcon(
  <>
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </>
)

export const IconListFilter = createIcon(
  <>
    <path d="M3 6h18M7 12h10M10 18h4" />
  </>
)

// ==================== 导出所有图标 ====================
export default {
  // 导航
  Sparkles: IconSparkles,
  LayoutDashboard: IconLayoutDashboard,
  MessageSquare: IconMessageSquare,
  Files: IconFiles,
  Settings: IconSettings,

  // 操作
  X: IconX,
  UploadCloud: IconUploadCloud,
  ArrowRight: IconArrowRight,
  Plus: IconPlus,
  Trash2: IconTrash2,
  Save: IconSave,
  RotateCcw: IconRotateCcw,
  RefreshCw: IconRefreshCw,

  // 状态
  CheckCircle2: IconCheckCircle2,
  AlertCircle: IconAlertCircle,
  Info: IconInfo,
  Activity: IconActivity,
  Loader2: IconLoader2,

  // 内容
  FileText: IconFileText,
  ImageIcon: IconImageIcon,
  Mic: IconMic,
  Cpu: IconCpu,

  // 功能
  Search: IconSearch,
  Thermometer: IconThermometer,
  HelpCircle: IconHelpCircle,
  ChevronDown: IconChevronDown,
  ChevronRight: IconChevronRight,
  ChevronLeft: IconChevronLeft,
  Play: IconPlay,
  Target: IconTarget,
  Bot: IconBot,
  Upload: IconUpload,

  // 评测
  BookOpenCheck: IconBookOpenCheck,
  SearchCheck: IconSearchCheck,
  FilterIcon: IconFilterIcon,
  ListFilter: IconListFilter
}

