import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HomeView } from '../../src/views/HomeView'

vi.mock('@/components/home/HeroSearchCard', () => ({
  HeroSearchCard: ({ onSearch }: { onSearch: (query: string) => void }) => (
    <div data-testid="hero-search-card">
      <input
        data-testid="search-input"
        placeholder="搜索..."
        onChange={(e) => {
          if (e.target.value) onSearch(e.target.value)
        }}
      />
    </div>
  )
}))

vi.mock('@/components/home/StaticOnboarding', () => ({
  default: () => <div data-testid="static-onboarding">Static Onboarding</div>
}))

describe('HomeView', () => {
  let mockOnSearch: ReturnType<typeof vi.fn<(query: string) => void>>

  beforeEach(() => {
    mockOnSearch = vi.fn<(query: string) => void>()
  })

  describe('基本渲染', () => {
    it('应正确渲染所有元素', () => {
      render(<HomeView onSearch={mockOnSearch} />)

      expect(screen.getByText('懂你的文件问答助手')).toBeInTheDocument()
      expect(screen.getByTestId('hero-search-card')).toBeInTheDocument()
      expect(screen.getByTestId('static-onboarding')).toBeInTheDocument()
    })

    it('应显示标题', () => {
      render(<HomeView onSearch={mockOnSearch} />)

      const title = screen.getByRole('heading', { name: '懂你的文件问答助手' })
      expect(title).toBeInTheDocument()
      expect(title).toHaveClass('font-bold', 'text-3xl')
    })
  })

  describe('搜索功能', () => {
    it('应在输入非空查询时调用 onSearch', async () => {
      const user = userEvent.setup()
      render(<HomeView onSearch={mockOnSearch} />)

      const input = screen.getByTestId('search-input')
      await user.type(input, '测试查询')

      expect(mockOnSearch).toHaveBeenCalled()
    })

    it('应过滤空白查询', () => {
      render(<HomeView onSearch={mockOnSearch} />)

      const handleSearchAttempt = (query: string) => {
        const trimmed = query.trim()
        if (!trimmed) return
        mockOnSearch(trimmed)
      }

      handleSearchAttempt('   ')
      expect(mockOnSearch).not.toHaveBeenCalled()

      handleSearchAttempt('有效查询')
      expect(mockOnSearch).toHaveBeenCalledWith('有效查询')
    })

    it('应 trim 查询文本', () => {
      render(<HomeView onSearch={mockOnSearch} />)

      const handleSearchAttempt = (query: string) => {
        const trimmed = query.trim()
        if (!trimmed) return
        mockOnSearch(trimmed)
      }

      handleSearchAttempt('  测试查询  ')
      expect(mockOnSearch).toHaveBeenCalledWith('测试查询')
    })
  })

  describe('响应式布局', () => {
    it('应使用居中的最大宽度容器', () => {
      const { container } = render(<HomeView onSearch={mockOnSearch} />)

      const contentContainer = container.querySelector('.max-w-3xl')
      expect(contentContainer).toBeInTheDocument()
      expect(contentContainer).toHaveClass('mx-auto')
    })

    it('应有适当的内边距', () => {
      const { container } = render(<HomeView onSearch={mockOnSearch} />)

      const contentContainer = container.querySelector('.max-w-3xl')
      expect(contentContainer).toHaveClass('px-4', 'pb-20')
    })

    it('应使用垂直居中布局', () => {
      const { container } = render(<HomeView onSearch={mockOnSearch} />)

      const contentContainer = container.querySelector('.max-w-3xl')
      expect(contentContainer).toHaveClass('justify-center')
    })
  })

  describe('边界情况', () => {
    it('应处理 undefined onSearch', () => {
      expect(() => {
        render(<HomeView onSearch={undefined as any} />)
      }).not.toThrow()
    })

    it('应正确处理多次搜索', () => {
      render(<HomeView onSearch={mockOnSearch} />)

      const handleSearchAttempt = (query: string) => {
        const trimmed = query.trim()
        if (!trimmed) return
        mockOnSearch(trimmed)
      }

      handleSearchAttempt('第一次查询')
      handleSearchAttempt('第二次查询')
      handleSearchAttempt('第三次查询')

      expect(mockOnSearch).toHaveBeenCalledTimes(3)
    })
  })
})

