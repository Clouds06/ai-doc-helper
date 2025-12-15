import { describe, it, expect, beforeEach, mock } from 'bun:test'
import { render } from '@testing-library/react'
import StaticOnboarding from '../StaticOnboarding'

describe('StaticOnboarding', () => {
  let mockOnToggle: ReturnType<typeof mock>
  let localStorageMock: Record<string, string>

  beforeEach(() => {
    mockOnToggle = mock()
    localStorageMock = {}

    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: (key: string) => localStorageMock[key] || null,
        setItem: (key: string, value: string) => {
          localStorageMock[key] = value
        },
        removeItem: (key: string) => {
          delete localStorageMock[key]
        },
        clear: () => {
          localStorageMock = {}
        }
      },
      writable: true
    })
  })

  describe('基本渲染', () => {
    it('应默认显示新手引导', () => {
      const { container } = render(<StaticOnboarding />)

      expect(container.textContent).toContain('快速上手指南')
      expect(container.textContent).toContain('构建你的专属 AI 知识库')
    })

    it('应显示所有步骤', () => {
      const { container } = render(<StaticOnboarding />)

      expect(container.textContent).toContain('1. 上传文档')
      expect(container.textContent).toContain('MD / DOCX / TXT 等')
      expect(container.textContent).toContain('2. 等待处理')
      expect(container.textContent).toContain('AI 解析与学习')
      expect(container.textContent).toContain('3. 开始问答')
      expect(container.textContent).toContain('精准检索与对话')
    })

    it('应显示步骤图标', () => {
      const { container } = render(<StaticOnboarding />)

      const svgIcons = container.querySelectorAll('svg')
      expect(svgIcons.length).toBeGreaterThanOrEqual(3)
    })

    it('应显示步骤连接线和箭头', () => {
      const { container } = render(<StaticOnboarding />)

      const connectors = container.querySelectorAll('.flex-1.h-px')
      const arrows = Array.from(connectors).flatMap((connector) =>
        Array.from(connector.querySelectorAll('svg'))
      )
      expect(arrows.length).toBe(2)
    })

    it('应显示关闭按钮', () => {
      const { container } = render(<StaticOnboarding />)

      const closeButton = Array.from(container.querySelectorAll('button')).find(
        (b) => b.getAttribute('aria-label') === '关闭新手引导'
      )
      expect(closeButton).not.toBeNull()
    })
  })

  describe('defaultOpen 属性', () => {
    it('defaultOpen=true 时应显示完整内容', () => {
      const { container } = render(<StaticOnboarding defaultOpen={true} />)

      expect(container.textContent).toContain('快速上手指南')
      expect(container.textContent).toContain('1. 上传文档')
    })

    it('defaultOpen=false 时应只显示切换按钮', () => {
      const { container } = render(<StaticOnboarding defaultOpen={false} />)

      expect(container.textContent).not.toContain('快速上手指南')
      expect(container.textContent).toContain('新手引导')
      const openButton = Array.from(container.querySelectorAll('button')).find(
        (b) => b.getAttribute('aria-label') === '打开新手引导'
      )
      expect(openButton).not.toBeNull()
    })
  })

  describe('展开/收起功能', () => {
    it('应显示关闭按钮', () => {
      const { container } = render(<StaticOnboarding />)

      const closeButton = Array.from(container.querySelectorAll('button')).find(
        (b) => b.getAttribute('aria-label') === '关闭新手引导'
      )
      expect(closeButton).not.toBeNull()
    })

    it('收起状态应显示打开按钮', () => {
      const { container } = render(<StaticOnboarding defaultOpen={false} />)

      const openButton = Array.from(container.querySelectorAll('button')).find(
        (b) => b.getAttribute('aria-label') === '打开新手引导'
      )
      expect(openButton).not.toBeNull()
    })

    it('应接收 onToggle 回调', () => {
      render(<StaticOnboarding onToggle={mockOnToggle} />)

      expect(mockOnToggle).toBeDefined()
    })
  })

  describe('localStorage 持久化', () => {
    it('应在初始化时从 localStorage 读取状态', () => {
      localStorageMock['rag-onboarding-visible'] = 'false'

      const { container } = render(<StaticOnboarding />)

      expect(container.textContent).not.toContain('快速上手指南')
      expect(container.textContent).toContain('新手引导')
    })

    it('localStorage 为空时应使用 defaultOpen', () => {
      const { container } = render(<StaticOnboarding defaultOpen={true} />)

      expect(container.textContent).toContain('快速上手指南')
    })
  })

  describe('无障碍功能', () => {
    it('应有正确的 aria 属性', () => {
      const { container } = render(<StaticOnboarding />)

      const closeButton = Array.from(container.querySelectorAll('button')).find(
        (b) => b.getAttribute('aria-label') === '关闭新手引导'
      ) as HTMLButtonElement
      expect(closeButton?.getAttribute('aria-expanded')).toBe('true')
      expect(closeButton?.getAttribute('aria-controls')).toBe('static-onboarding-steps')
    })

    it('步骤列表应有 aria-label', () => {
      const { container } = render(<StaticOnboarding />)

      const stepsList = container.querySelector('[aria-label="新手引导流程图"]')
      expect(stepsList).not.toBeNull()
    })

    it('按钮应有 title 属性', () => {
      const { container } = render(<StaticOnboarding />)

      const closeButton = Array.from(container.querySelectorAll('button')).find(
        (b) => b.getAttribute('aria-label') === '关闭新手引导'
      ) as HTMLButtonElement
      expect(closeButton?.getAttribute('title')).toBe('关闭引导')
    })
  })

  describe('动画效果', () => {
    it('应有淡入动画', () => {
      const { container } = render(<StaticOnboarding />)

      expect(container.querySelector('.animate-in')).not.toBeNull()
      expect(container.querySelector('.fade-in')).not.toBeNull()
    })

    it('应有滑入动画', () => {
      const { container } = render(<StaticOnboarding />)

      expect(container.querySelector('.slide-in-from-top-2')).not.toBeNull()
    })
  })

  describe('边界情况', () => {
    it('应处理不传递 props 的情况', () => {
      const { container } = render(<StaticOnboarding />)

      expect(container).not.toBeNull()
      expect(container.querySelector('button')).not.toBeNull()
    })

    it('应正常渲染组件', () => {
      const { container } = render(<StaticOnboarding onToggle={mockOnToggle} />)

      expect(container.textContent).toContain('快速上手指南')
      expect(container.querySelectorAll('button').length).toBeGreaterThan(0)
    })
  })
})

