import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test'
import { render } from '@testing-library/react'
import { GlobalRegistrator } from '@happy-dom/global-registrator'
import { TopNavbar } from '../TopNavbar'
import { BrowserRouter } from 'react-router-dom'

const mockNavigate = mock()
const mockLocation = { pathname: '/' }

mock.module('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
  BrowserRouter: ({ children }: any) => children
}))

describe('TopNavbar', () => {
  let mockOnOpenSettings: ReturnType<typeof mock>

  beforeEach(() => {
    GlobalRegistrator.register()
    mockOnOpenSettings = mock()
    mockNavigate.mockReset()
    mockLocation.pathname = '/'
  })

  afterEach(() => {
    GlobalRegistrator.unregister()
  })

  const renderNavbar = () => {
    return render(
      <BrowserRouter>
        <TopNavbar onOpenSettings={mockOnOpenSettings} />
      </BrowserRouter>
    )
  }

  describe('基本渲染', () => {
    test('应正确渲染导航栏', () => {
      const { container } = renderNavbar()

      expect(container.querySelector('nav')).not.toBeNull()
      expect(container.querySelector('.sticky')).not.toBeNull()
    })

    test('应显示品牌标识', () => {
      const { container } = renderNavbar()

      expect(container.textContent).toContain('AI知识库文档助手')
    })

    test('应显示 logo 图标', () => {
      const { container } = renderNavbar()

      const logo = container.querySelector('.lucide-sparkles')
      expect(logo).not.toBeNull()
    })

    test('应显示所有导航按钮', () => {
      const { container } = renderNavbar()

      expect(container.textContent).toContain('首页')
      expect(container.textContent).toContain('对话')
      expect(container.textContent).toContain('知识库')
    })

    test('应显示设置按钮', () => {
      const { container } = renderNavbar()

      expect(container.textContent).toContain('设置')
      const settingsIcon = container.querySelector('.lucide-settings')
      expect(settingsIcon).not.toBeNull()
    })
  })

  describe('激活状态', () => {
    test('首页路径应激活首页按钮', () => {
      mockLocation.pathname = '/'
      const { container } = renderNavbar()

      const buttons = container.querySelectorAll('button')
      const homeButton = Array.from(buttons).find((b) => b.textContent?.includes('首页'))

      expect(homeButton?.classList.contains('bg-blue-50')).toBe(true)
      expect(homeButton?.classList.contains('text-blue-700')).toBe(true)
    })

    test('对话路径应激活对话按钮', () => {
      mockLocation.pathname = '/chat'
      const { container } = renderNavbar()

      const buttons = container.querySelectorAll('button')
      const chatButton = Array.from(buttons).find((b) => b.textContent?.includes('对话'))

      expect(chatButton?.classList.contains('bg-blue-50')).toBe(true)
    })

    test('文档路径应激活知识库按钮', () => {
      mockLocation.pathname = '/documents'
      const { container } = renderNavbar()

      const buttons = container.querySelectorAll('button')
      const docsButton = Array.from(buttons).find((b) => b.textContent?.includes('知识库'))

      expect(docsButton?.classList.contains('bg-blue-50')).toBe(true)
    })

    test('嵌套路径应正确识别激活状态', () => {
      mockLocation.pathname = '/chat/123'
      const { container } = renderNavbar()

      const buttons = container.querySelectorAll('button')
      const chatButton = Array.from(buttons).find((b) => b.textContent?.includes('对话'))

      expect(chatButton?.classList.contains('bg-blue-50')).toBe(true)
    })
  })

  describe('导航图标', () => {
    test('应显示首页图标', () => {
      const { container } = renderNavbar()

      const icon = container.querySelector('.lucide-layout-dashboard')
      expect(icon).not.toBeNull()
    })

    test('应显示对话图标', () => {
      const { container } = renderNavbar()

      const icon = container.querySelector('.lucide-message-square')
      expect(icon).not.toBeNull()
    })

    test('应显示知识库图标', () => {
      const { container } = renderNavbar()

      const icon = container.querySelector('.lucide-files')
      expect(icon).not.toBeNull()
    })

    test('激活按钮的图标应有蓝色样式', () => {
      mockLocation.pathname = '/'
      const { container } = renderNavbar()

      const homeButton = Array.from(container.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('首页')
      )
      const icon = homeButton?.querySelector('.text-blue-600')
      expect(icon).not.toBeNull()
    })

    test('非激活按钮的图标应为灰色', () => {
      mockLocation.pathname = '/'
      const { container } = renderNavbar()

      const chatButton = Array.from(container.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('对话')
      )
      const icon = chatButton?.querySelector('.text-gray-500')
      expect(icon).not.toBeNull()
    })
  })

  describe('设置按钮', () => {
    test('点击设置按钮应调用回调', () => {
      const { container } = renderNavbar()

      const buttons = container.querySelectorAll('button')
      const settingsButton = Array.from(buttons).find((b) => b.textContent?.includes('设置'))

      settingsButton?.click()
      expect(mockOnOpenSettings.mock.calls.length).toBe(1)
    })

    test('设置按钮应有正确样式', () => {
      const { container } = renderNavbar()

      const buttons = container.querySelectorAll('button')
      const settingsButton = Array.from(buttons).find((b) => b.textContent?.includes('设置'))

      expect(settingsButton?.classList.contains('text-gray-500')).toBe(true)
    })
  })

  describe('响应式设计', () => {
    test('按钮文本在小屏幕应隐藏', () => {
      const { container } = renderNavbar()

      const buttons = container.querySelectorAll('button')
      const homeButton = Array.from(buttons).find((b) => b.textContent?.includes('首页'))
      const label = homeButton?.querySelector('span')

      expect(label?.classList.contains('hidden')).toBe(true)
      expect(label?.classList.contains('sm:block')).toBe(true)
    })

    test('所有导航按钮都应支持响应式文本', () => {
      const { container } = renderNavbar()

      const hiddenLabels = container.querySelectorAll('span.hidden.sm\\:block')
      expect(hiddenLabels.length).toBeGreaterThan(0)
    })
  })

  describe('边界情况', () => {
    test('未知路径应默认激活首页', () => {
      mockLocation.pathname = '/unknown'
      const { container } = renderNavbar()

      const buttons = container.querySelectorAll('button')
      const homeButton = Array.from(buttons).find((b) => b.textContent?.includes('首页'))

      expect(homeButton?.classList.contains('bg-blue-50')).toBe(true)
    })

    test('应处理空路径', () => {
      mockLocation.pathname = ''
      const { container } = renderNavbar()

      expect(container.querySelector('nav')).not.toBeNull()
    })

    test('应处理多次点击', () => {
      const { container } = renderNavbar()

      const settingsButton = Array.from(container.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('设置')
      )

      settingsButton?.click()
      settingsButton?.click()
      settingsButton?.click()

      expect(mockOnOpenSettings.mock.calls.length).toBe(3)
    })
  })
})

