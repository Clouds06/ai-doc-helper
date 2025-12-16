import { describe, test, expect, beforeAll, afterAll, beforeEach, mock } from 'bun:test'
import { render } from '@testing-library/react'

// 保存原始模块
let originalUseUploadStore: any
let originalUseTypewriter: any

describe('HeroSearchCard', () => {
  let mockOnSearch: ReturnType<typeof mock>
  let mockOpenUploadModal: ReturnType<typeof mock>
  let HeroSearchCard: any

  beforeAll(async () => {
    // 保存原始模块
    const uploadStoreModule = await import('../../../hooks/useUploadStore')
    const typewriterModule = await import('../../../hooks/useTypewriter')
    originalUseUploadStore = uploadStoreModule.useUploadStore
    originalUseTypewriter = typewriterModule.useTypewriterLoop

    // 导入组件（在 mock 之后）
    const heroModule = await import('../HeroSearchCard')
    HeroSearchCard = heroModule.HeroSearchCard
  })

  afterAll(() => {
    // 恢复原始模块
    mock.module('../../../hooks/useUploadStore', () => ({
      useUploadStore: originalUseUploadStore
    }))

    mock.module('../../../hooks/useTypewriter', () => ({
      useTypewriterLoop: originalUseTypewriter
    }))
  })

  beforeEach(() => {
    mockOnSearch = mock()
    mockOpenUploadModal = mock()

    // 在每个测试前设置 mock
    mock.module('../../../hooks/useUploadStore', () => ({
      useUploadStore: (selector: any) => {
        const store = { openUploadModal: mockOpenUploadModal }
        return selector ? selector(store) : store
      }
    }))

    mock.module('../../../hooks/useTypewriter', () => ({
      useTypewriterLoop: mock(() => '这份财报的重点是什么？')
    }))
  })

  describe('基本渲染', () => {
    test('应正确渲染组件', () => {
      const { container } = render(<HeroSearchCard onSearch={mockOnSearch} />)

      const uploadButton = Array.from(container.querySelectorAll('button')).find(
        (b) => b.textContent?.includes('上传') || b.querySelector('svg')
      )
      expect(uploadButton).not.toBeNull()
      expect(container.querySelector('textarea')).not.toBeNull()
    })

    test('应显示上传区域', () => {
      const { container } = render(<HeroSearchCard onSearch={mockOnSearch} />)

      expect(container.textContent).toContain('点击上传')
      expect(container.textContent).toContain('或将文件拖拽到此处')
    })

    test('应显示文件类型图标', () => {
      const { container } = render(<HeroSearchCard onSearch={mockOnSearch} />)

      expect(container.querySelector('.lucide-image')).not.toBeNull()
      expect(container.querySelector('.lucide-file-text')).not.toBeNull()
      expect(container.querySelector('.lucide-mic')).not.toBeNull()
    })

    test('应显示搜索输入框', () => {
      const { container } = render(<HeroSearchCard onSearch={mockOnSearch} />)

      const textarea = container.querySelector('textarea')
      expect(textarea).not.toBeNull()
      expect(textarea?.tagName).toBe('TEXTAREA')
    })

    test('应显示提交按钮', () => {
      const { container } = render(<HeroSearchCard onSearch={mockOnSearch} />)

      const button = Array.from(container.querySelectorAll('button')).find(
        (b) => b.getAttribute('aria-label') === '发送问题'
      )
      expect(button).not.toBeNull()
    })
  })

  describe('上传功能', () => {
    test('应显示上传按钮', () => {
      const { container } = render(<HeroSearchCard onSearch={mockOnSearch} />)

      const uploadButton = container.querySelector('button[aria-label="上传文件"]')
      expect(uploadButton).not.toBeNull()
    })
  })

  describe('搜索输入', () => {
    test('应显示输入框', () => {
      const { container } = render(<HeroSearchCard onSearch={mockOnSearch} />)

      const textarea = container.querySelector('textarea') as HTMLTextAreaElement
      expect(textarea).not.toBeNull()
    })

    test('应能使用 initialQuery 初始化', () => {
      const { container } = render(
        <HeroSearchCard onSearch={mockOnSearch} initialQuery="初始查询" />
      )

      const textarea = container.querySelector('textarea') as HTMLTextAreaElement
      expect(textarea?.value).toBe('初始查询')
    })

    test('无内容时提交按钮应禁用', () => {
      const { container } = render(<HeroSearchCard onSearch={mockOnSearch} />)

      const submitButton = Array.from(container.querySelectorAll('button')).find(
        (b) => b.getAttribute('aria-label') === '发送问题'
      ) as HTMLButtonElement
      expect(submitButton?.disabled).toBe(true)
      expect(submitButton?.classList.contains('bg-gray-100')).toBe(true)
    })

    test('输入框应有样式属性', () => {
      const { container } = render(<HeroSearchCard onSearch={mockOnSearch} />)

      const textarea = container.querySelector('textarea') as HTMLTextAreaElement
      expect(textarea?.style.minHeight).toBeTruthy()
      expect(textarea?.style.maxHeight).toBeTruthy()
    })
  })

  describe('搜索提交', () => {
    test('应显示提交按钮', () => {
      const { container } = render(<HeroSearchCard onSearch={mockOnSearch} />)

      const submitButton = Array.from(container.querySelectorAll('button')).find(
        (b) => b.getAttribute('aria-label') === '发送问题'
      )
      expect(submitButton).not.toBeNull()
    })

    test('初始状态下提交按钮禁用', () => {
      const { container } = render(<HeroSearchCard onSearch={mockOnSearch} />)

      const submitButton = Array.from(container.querySelectorAll('button')).find(
        (b) => b.getAttribute('aria-label') === '发送问题'
      ) as HTMLButtonElement
      expect(submitButton?.disabled).toBe(true)
    })
  })

  describe('placeholder 和焦点', () => {
    test('无输入时应显示 placeholder', () => {
      const { container } = render(<HeroSearchCard onSearch={mockOnSearch} />)

      expect(container.textContent).toContain('这份财报的重点是什么？')
    })

    test('未聚焦时应显示光标动画', () => {
      const { container } = render(<HeroSearchCard onSearch={mockOnSearch} />)

      const cursor = container.querySelector('.animate-pulse')
      expect(cursor).not.toBeNull()
      expect(cursor?.textContent).toBe('|')
    })
  })

  describe('样式和布局', () => {
    test('上传区域应有虚线边框', () => {
      const { container } = render(<HeroSearchCard onSearch={mockOnSearch} />)

      expect(container.querySelector('.border-dashed')).not.toBeNull()
    })

    test('textarea 应有最小和最大高度限制', () => {
      const { container } = render(<HeroSearchCard onSearch={mockOnSearch} />)

      const textarea = container.querySelector('textarea') as HTMLTextAreaElement
      expect(textarea?.style.minHeight).toBe('48px')
      expect(textarea?.style.maxHeight).toBe('200px')
    })
  })

  describe('边界情况', () => {
    test('应处理空的 initialQuery', () => {
      const { container } = render(<HeroSearchCard onSearch={mockOnSearch} initialQuery="" />)

      const textarea = container.querySelector('textarea') as HTMLTextAreaElement
      expect(textarea?.value).toBe('')
    })

    test('应处理未定义的 initialQuery', () => {
      const { container } = render(<HeroSearchCard onSearch={mockOnSearch} />)

      const textarea = container.querySelector('textarea') as HTMLTextAreaElement
      expect(textarea?.value).toBe('')
    })

    test('组件应正常渲染', () => {
      const { container } = render(<HeroSearchCard onSearch={mockOnSearch} />)

      expect(container.querySelector('textarea')).not.toBeNull()
      expect(container.querySelectorAll('button').length).toBeGreaterThan(0)
    })
  })
})

