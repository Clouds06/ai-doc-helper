import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StaticOnboarding from '../../src/components/home/StaticOnboarding'

describe('StaticOnboarding', () => {
  let mockOnToggle: ReturnType<typeof vi.fn<(open: boolean) => void>>
  let localStorageMock: Record<string, string>

  beforeEach(() => {
    mockOnToggle = vi.fn<(open: boolean) => void>()
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

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('基本渲染', () => {
    it('应默认显示新手引导', () => {
      render(<StaticOnboarding />)

      expect(screen.getByText('快速上手指南')).toBeInTheDocument()
      expect(screen.getByText('构建你的专属 AI 知识库')).toBeInTheDocument()
    })

    it('应显示所有步骤', () => {
      render(<StaticOnboarding />)

      expect(screen.getByText('1. 上传文档')).toBeInTheDocument()
      expect(screen.getByText('MD / DOCX / TXT 等')).toBeInTheDocument()

      expect(screen.getByText('2. 等待处理')).toBeInTheDocument()
      expect(screen.getByText('AI 解析与学习')).toBeInTheDocument()

      expect(screen.getByText('3. 开始问答')).toBeInTheDocument()
      expect(screen.getByText('精准检索与对话')).toBeInTheDocument()
    })

    it('应显示步骤图标', () => {
      const { container } = render(<StaticOnboarding />)

      // 检查是否有 SVG 图标
      const svgIcons = container.querySelectorAll('svg')
      expect(svgIcons.length).toBeGreaterThanOrEqual(3) // 至少有3个步骤图标
    })

    it('应显示步骤连接线和箭头', () => {
      const { container } = render(<StaticOnboarding />)

      const arrows = container.querySelectorAll('.lucide-arrow-right')
      expect(arrows.length).toBe(2)
    })

    it('应显示关闭按钮', () => {
      render(<StaticOnboarding />)

      const closeButton = screen.getByRole('button', { name: '关闭新手引导' })
      expect(closeButton).toBeInTheDocument()
    })
  })

  describe('defaultOpen 属性', () => {
    it('defaultOpen=true 时应显示完整内容', () => {
      render(<StaticOnboarding defaultOpen={true} />)

      expect(screen.getByText('快速上手指南')).toBeInTheDocument()
      expect(screen.getByText('1. 上传文档')).toBeInTheDocument()
    })

    it('defaultOpen=false 时应只显示切换按钮', () => {
      render(<StaticOnboarding defaultOpen={false} />)

      expect(screen.queryByText('快速上手指南')).not.toBeInTheDocument()
      expect(screen.getByText('新手引导')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '打开新手引导' })).toBeInTheDocument()
    })
  })

  describe('展开/收起功能', () => {
    it('应能关闭新手引导', async () => {
      const user = userEvent.setup()
      render(<StaticOnboarding />)

      const closeButton = screen.getByRole('button', { name: '关闭新手引导' })
      await user.click(closeButton)

      await waitFor(() => {
        expect(screen.queryByText('快速上手指南')).not.toBeInTheDocument()
        expect(screen.getByText('新手引导')).toBeInTheDocument()
      })
    })

    it('应能重新打开新手引导', async () => {
      const user = userEvent.setup()
      render(<StaticOnboarding defaultOpen={false} />)

      const openButton = screen.getByRole('button', { name: '打开新手引导' })
      await user.click(openButton)

      await waitFor(() => {
        expect(screen.getByText('快速上手指南')).toBeInTheDocument()
        expect(screen.getByText('1. 上传文档')).toBeInTheDocument()
      })
    })

    it('应在关闭时调用 onToggle', async () => {
      const user = userEvent.setup()
      render(<StaticOnboarding onToggle={mockOnToggle} />)

      const closeButton = screen.getByRole('button', { name: '关闭新手引导' })
      await user.click(closeButton)

      expect(mockOnToggle).toHaveBeenCalledWith(false)
    })

    it('应在打开时调用 onToggle', async () => {
      const user = userEvent.setup()
      render(<StaticOnboarding defaultOpen={false} onToggle={mockOnToggle} />)

      const openButton = screen.getByRole('button', { name: '打开新手引导' })
      await user.click(openButton)

      expect(mockOnToggle).toHaveBeenCalledWith(true)
    })
  })

  describe('localStorage 持久化', () => {
    it('应在初始化时从 localStorage 读取状态', async () => {
      localStorageMock['rag-onboarding-visible'] = 'false'

      render(<StaticOnboarding />)

      await waitFor(() => {
        expect(screen.queryByText('快速上手指南')).not.toBeInTheDocument()
        expect(screen.getByText('新手引导')).toBeInTheDocument()
      })
    })

    it('应在关闭时保存状态到 localStorage', async () => {
      const user = userEvent.setup()
      render(<StaticOnboarding />)

      const closeButton = screen.getByRole('button', { name: '关闭新手引导' })
      await user.click(closeButton)

      await waitFor(() => {
        expect(localStorageMock['rag-onboarding-visible']).toBe('false')
      })
    })

    it('应在打开时保存状态到 localStorage', async () => {
      const user = userEvent.setup()
      render(<StaticOnboarding defaultOpen={false} />)

      const openButton = screen.getByRole('button', { name: '打开新手引导' })
      await user.click(openButton)

      await waitFor(() => {
        expect(localStorageMock['rag-onboarding-visible']).toBe('true')
      })
    })

    it('localStorage 为空时应使用 defaultOpen', () => {
      render(<StaticOnboarding defaultOpen={true} />)

      expect(screen.getByText('快速上手指南')).toBeInTheDocument()
    })
  })

  describe('无障碍功能', () => {
    it('应有正确的 aria 属性', () => {
      render(<StaticOnboarding />)

      const closeButton = screen.getByRole('button', { name: '关闭新手引导' })
      expect(closeButton).toHaveAttribute('aria-expanded', 'true')
      expect(closeButton).toHaveAttribute('aria-controls', 'static-onboarding-steps')
    })

    it('步骤列表应有 aria-label', () => {
      render(<StaticOnboarding />)

      const stepsList = screen.getByLabelText('新手引导流程图')
      expect(stepsList).toBeInTheDocument()
    })

    it('按钮应有 title 属性', () => {
      render(<StaticOnboarding />)

      const closeButton = screen.getByRole('button', { name: '关闭新手引导' })
      expect(closeButton).toHaveAttribute('title', '关闭引导')
    })
  })

  describe('动画效果', () => {
    it('应有淡入动画', () => {
      const { container } = render(<StaticOnboarding />)

      expect(container.querySelector('.animate-in')).toBeInTheDocument()
      expect(container.querySelector('.fade-in')).toBeInTheDocument()
    })

    it('应有滑入动画', () => {
      const { container } = render(<StaticOnboarding />)

      expect(container.querySelector('.slide-in-from-top-2')).toBeInTheDocument()
    })
  })

  describe('边界情况', () => {
    it('应处理不传递 props 的情况', () => {
      expect(() => {
        render(<StaticOnboarding />)
      }).not.toThrow()
    })

    it('应处理多次切换状态', async () => {
      const user = userEvent.setup()
      render(<StaticOnboarding onToggle={mockOnToggle} />)

      const closeButton = screen.getByRole('button', { name: '关闭新手引导' })
      await user.click(closeButton)

      const openButton = await screen.findByRole('button', { name: '打开新手引导' })
      await user.click(openButton)

      const closeButton2 = await screen.findByRole('button', { name: '关闭新手引导' })
      await user.click(closeButton2)

      expect(mockOnToggle).toHaveBeenCalledTimes(3)
      expect(mockOnToggle).toHaveBeenNthCalledWith(1, false)
      expect(mockOnToggle).toHaveBeenNthCalledWith(2, true)
      expect(mockOnToggle).toHaveBeenNthCalledWith(3, false)
    })
  })
})

