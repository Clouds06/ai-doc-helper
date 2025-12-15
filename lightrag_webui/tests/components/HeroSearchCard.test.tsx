import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HeroSearchCard } from '../../src/components/home/HeroSearchCard'
import { useUploadStore } from '../../src/hooks/useUploadStore'

vi.mock('../../src/hooks/useUploadStore', () => ({
  useUploadStore: vi.fn()
}))

vi.mock('../../src/hooks/useTypewriter', () => ({
  useTypewriterLoop: vi.fn(() => '这份财报的重点是什么？')
}))

describe('HeroSearchCard', () => {
  let mockOnSearch: ReturnType<typeof vi.fn<(query: string) => void>>
  let mockOpenUploadModal: ReturnType<typeof vi.fn<() => void>>

  beforeEach(() => {
    mockOnSearch = vi.fn<(query: string) => void>()
    mockOpenUploadModal = vi.fn<() => void>()

    vi.mocked(useUploadStore).mockImplementation((selector: any) => {
      const store = { open: mockOpenUploadModal }
      return selector(store)
    })
  })

  describe('基本渲染', () => {
    it('应正确渲染组件', () => {
      render(<HeroSearchCard onSearch={mockOnSearch} />)

      expect(screen.getByLabelText('上传文件')).toBeInTheDocument()
      expect(screen.getByLabelText('请输入你要查询的问题')).toBeInTheDocument()
    })

    it('应显示上传区域', () => {
      render(<HeroSearchCard onSearch={mockOnSearch} />)

      expect(screen.getByText(/点击上传/)).toBeInTheDocument()
      expect(screen.getByText(/或将文件拖拽到此处/)).toBeInTheDocument()
    })

    it('应显示文件类型图标', () => {
      const { container } = render(<HeroSearchCard onSearch={mockOnSearch} />)

      expect(container.querySelector('.lucide-image')).toBeInTheDocument()
      expect(container.querySelector('.lucide-file-text')).toBeInTheDocument()
      expect(container.querySelector('.lucide-mic')).toBeInTheDocument()
    })

    it('应显示搜索输入框', () => {
      render(<HeroSearchCard onSearch={mockOnSearch} />)

      const textarea = screen.getByLabelText('请输入你要查询的问题')
      expect(textarea).toBeInTheDocument()
      expect(textarea.tagName).toBe('TEXTAREA')
    })

    it('应显示提交按钮', () => {
      render(<HeroSearchCard onSearch={mockOnSearch} />)

      expect(screen.getByRole('button', { name: '发送问题' })).toBeInTheDocument()
    })
  })

  describe('上传功能', () => {
    it('应能点击上传按钮', async () => {
      const user = userEvent.setup()
      render(<HeroSearchCard onSearch={mockOnSearch} />)

      const uploadButton = screen.getByLabelText('上传文件')
      await user.click(uploadButton)

      expect(mockOpenUploadModal).toHaveBeenCalledTimes(1)
    })
  })

  describe('搜索输入', () => {
    it('应能输入文本', async () => {
      const user = userEvent.setup()
      render(<HeroSearchCard onSearch={mockOnSearch} />)

      const textarea = screen.getByLabelText('请输入你要查询的问题')
      await user.type(textarea, '测试查询')

      expect(textarea).toHaveValue('测试查询')
    })

    it('应能使用 initialQuery 初始化', () => {
      render(<HeroSearchCard onSearch={mockOnSearch} initialQuery="初始查询" />)

      const textarea = screen.getByLabelText('请输入你要查询的问题')
      expect(textarea).toHaveValue('初始查询')
    })

    it('有内容时提交按钮应启用', async () => {
      const user = userEvent.setup()
      render(<HeroSearchCard onSearch={mockOnSearch} />)

      const textarea = screen.getByLabelText('请输入你要查询的问题')
      const submitButton = screen.getByRole('button', { name: '发送问题' })

      expect(submitButton).toBeDisabled()

      await user.type(textarea, '有内容')

      expect(submitButton).toBeEnabled()
      expect(submitButton).toHaveClass('bg-blue-600', 'text-white')
    })

    it('无内容时提交按钮应禁用', () => {
      render(<HeroSearchCard onSearch={mockOnSearch} />)

      const submitButton = screen.getByRole('button', { name: '发送问题' })
      expect(submitButton).toBeDisabled()
      expect(submitButton).toHaveClass('bg-gray-100', 'text-gray-300')
    })

    it('输入框应自动调整高度', async () => {
      const user = userEvent.setup()
      render(<HeroSearchCard onSearch={mockOnSearch} />)

      const textarea = screen.getByLabelText('请输入你要查询的问题') as HTMLTextAreaElement

      await user.type(textarea, '第一行\n第二行\n第三行')

      expect(textarea.style.height).toBeTruthy()
    })
  })

  describe('搜索提交', () => {
    it('应能通过按钮提交搜索', async () => {
      const user = userEvent.setup()
      render(<HeroSearchCard onSearch={mockOnSearch} />)

      const textarea = screen.getByLabelText('请输入你要查询的问题')
      const submitButton = screen.getByRole('button', { name: '发送问题' })

      await user.type(textarea, '测试查询')
      await user.click(submitButton)

      expect(mockOnSearch).toHaveBeenCalledWith('测试查询')
    })

    it('应能通过 Enter 键提交搜索', async () => {
      const user = userEvent.setup()
      render(<HeroSearchCard onSearch={mockOnSearch} />)

      const textarea = screen.getByLabelText('请输入你要查询的问题')
      await user.type(textarea, '测试查询{Enter}')

      expect(mockOnSearch).toHaveBeenCalledWith('测试查询')
    })

    it('Shift+Enter 应换行而不提交', async () => {
      const user = userEvent.setup()
      render(<HeroSearchCard onSearch={mockOnSearch} />)

      const textarea = screen.getByLabelText('请输入你要查询的问题')
      await user.type(textarea, '第一行{Shift>}{Enter}{/Shift}第二行')

      expect(mockOnSearch).not.toHaveBeenCalled()
      expect(textarea).toHaveValue('第一行\n第二行')
    })

    it('应 trim 查询文本', async () => {
      const user = userEvent.setup()
      render(<HeroSearchCard onSearch={mockOnSearch} />)

      const textarea = screen.getByLabelText('请输入你要查询的问题')
      await user.type(textarea, '  测试查询  {Enter}')

      expect(mockOnSearch).toHaveBeenCalledWith('测试查询')
    })

    it('空内容或纯空格不应提交', async () => {
      const user = userEvent.setup()
      render(<HeroSearchCard onSearch={mockOnSearch} />)

      const textarea = screen.getByLabelText('请输入你要查询的问题')
      const submitButton = screen.getByRole('button', { name: '发送问题' })

      await user.type(textarea, '   ')
      await user.click(submitButton)

      expect(mockOnSearch).not.toHaveBeenCalled()
    })

    it('空内容按 Enter 不应提交', async () => {
      const user = userEvent.setup()
      render(<HeroSearchCard onSearch={mockOnSearch} />)

      const textarea = screen.getByLabelText('请输入你要查询的问题')
      await user.type(textarea, '{Enter}')

      expect(mockOnSearch).not.toHaveBeenCalled()
    })
  })

  describe('placeholder 和焦点', () => {
    it('无输入时应显示 placeholder', () => {
      render(<HeroSearchCard onSearch={mockOnSearch} />)

      expect(screen.getByText('这份财报的重点是什么？')).toBeInTheDocument()
    })

    it('有输入时不应显示 placeholder', async () => {
      const user = userEvent.setup()
      render(<HeroSearchCard onSearch={mockOnSearch} />)

      const textarea = screen.getByLabelText('请输入你要查询的问题')
      await user.type(textarea, '测试')

      expect(screen.queryByText('这份财报的重点是什么？')).not.toBeInTheDocument()
    })

    it('未聚焦时应显示光标动画', () => {
      const { container } = render(<HeroSearchCard onSearch={mockOnSearch} />)

      const cursor = container.querySelector('.animate-pulse')
      expect(cursor).toBeInTheDocument()
      expect(cursor?.textContent).toBe('|')
    })

    it('聚焦时不应显示光标动画', async () => {
      const user = userEvent.setup()
      const { container } = render(<HeroSearchCard onSearch={mockOnSearch} />)

      const textarea = screen.getByLabelText('请输入你要查询的问题')
      await user.click(textarea)

      await waitFor(() => {
        const cursor = container.querySelector('.animate-pulse')
        expect(cursor).not.toBeInTheDocument()
      })
    })
  })

  describe('样式和布局', () => {
    it('上传区域应有虚线边框', () => {
      const { container } = render(<HeroSearchCard onSearch={mockOnSearch} />)

      expect(container.querySelector('.border-dashed')).toBeInTheDocument()
    })

    it('textarea 应有最小和最大高度限制', () => {
      render(<HeroSearchCard onSearch={mockOnSearch} />)

      const textarea = screen.getByLabelText('请输入你要查询的问题') as HTMLTextAreaElement
      expect(textarea.style.minHeight).toBe('48px')
      expect(textarea.style.maxHeight).toBe('200px')
    })
  })

  describe('边界情况', () => {
    it('应处理空的 initialQuery', () => {
      render(<HeroSearchCard onSearch={mockOnSearch} initialQuery="" />)

      const textarea = screen.getByLabelText('请输入你要查询的问题')
      expect(textarea).toHaveValue('')
    })

    it('应处理未定义的 initialQuery', () => {
      render(<HeroSearchCard onSearch={mockOnSearch} />)

      const textarea = screen.getByLabelText('请输入你要查询的问题')
      expect(textarea).toHaveValue('')
    })

    it('应处理多次提交', async () => {
      const user = userEvent.setup()
      render(<HeroSearchCard onSearch={mockOnSearch} />)

      const textarea = screen.getByLabelText('请输入你要查询的问题')

      await user.type(textarea, '第一次查询{Enter}')
      await user.clear(textarea)
      await user.type(textarea, '第二次查询{Enter}')

      expect(mockOnSearch).toHaveBeenCalledTimes(2)
      expect(mockOnSearch).toHaveBeenNthCalledWith(1, '第一次查询')
      expect(mockOnSearch).toHaveBeenNthCalledWith(2, '第二次查询')
    })

    it('应处理包含换行的文本', async () => {
      const user = userEvent.setup()
      render(<HeroSearchCard onSearch={mockOnSearch} />)

      const textarea = screen.getByLabelText('请输入你要查询的问题')
      const submitButton = screen.getByRole('button', { name: '发送问题' })

      await user.type(textarea, '第一行{Shift>}{Enter}{/Shift}第二行')
      await user.click(submitButton)

      expect(mockOnSearch).toHaveBeenCalledWith('第一行\n第二行')
    })
  })
})

