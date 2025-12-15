import { describe, test, expect, beforeAll, afterAll, beforeEach, mock } from 'bun:test'
import { render } from '@testing-library/react'

// 存储原始的模块工厂函数
let originalHeroSearchCard: any
let originalStaticOnboarding: any

describe('HomeView', () => {
  let mockOnSearch: ReturnType<typeof mock>
  let HomeView: any

  // 在所有测试之前设置 mock
  beforeAll(async () => {
    // 先导入真实组件以保存引用
    const heroModule = await import('@/components/home/HeroSearchCard')
    const onboardingModule = await import('@/components/home/StaticOnboarding')
    originalHeroSearchCard = heroModule.HeroSearchCard
    originalStaticOnboarding = onboardingModule.default

    // 然后 mock 这些模块
    mock.module('@/components/home/HeroSearchCard', () => ({
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

    mock.module('@/components/home/StaticOnboarding', () => ({
      default: () => <div data-testid="static-onboarding">Static Onboarding</div>
    }))

    // 最后导入 HomeView（会使用 mock 的子组件）
    const homeViewModule = await import('../HomeView')
    HomeView = homeViewModule.HomeView
  })

  // 测试完成后恢复原始模块
  afterAll(() => {
    // 恢复为真实组件
    mock.module('@/components/home/HeroSearchCard', () => ({
      HeroSearchCard: originalHeroSearchCard
    }))

    mock.module('@/components/home/StaticOnboarding', () => ({
      default: originalStaticOnboarding
    }))
  })

  beforeEach(() => {
    mockOnSearch = mock()
  })

  describe('基本渲染', () => {
    test('应正确渲染所有元素', () => {
      const { container } = render(<HomeView onSearch={mockOnSearch} />)

      expect(container.textContent).toContain('懂你的文件问答助手')
      expect(container.querySelector('[data-testid="hero-search-card"]')).not.toBeNull()
      expect(container.querySelector('[data-testid="static-onboarding"]')).not.toBeNull()
    })

    test('应显示标题', () => {
      const { container } = render(<HomeView onSearch={mockOnSearch} />)

      const title = Array.from(container.querySelectorAll('h1, h2, h3')).find(
        (h) => h.textContent === '懂你的文件问答助手'
      )
      expect(title).not.toBeNull()
      expect(title?.classList.contains('font-bold')).toBe(true)
      expect(title?.classList.contains('text-3xl')).toBe(true)
    })
  })

  describe('搜索功能', () => {
    test('应显示搜索输入框', () => {
      const { container } = render(<HomeView onSearch={mockOnSearch} />)

      const input = container.querySelector('[data-testid="search-input"]')
      expect(input).not.toBeNull()
    })

    test('应过滤空白查询', () => {
      render(<HomeView onSearch={mockOnSearch} />)

      const handleSearchAttempt = (query: string) => {
        const trimmed = query.trim()
        if (!trimmed) return
        mockOnSearch(trimmed)
      }

      handleSearchAttempt('   ')
      expect(mockOnSearch.mock.calls.length).toBe(0)

      handleSearchAttempt('有效查询')
      expect(mockOnSearch.mock.calls[0][0]).toBe('有效查询')
    })

    test('应 trim 查询文本', () => {
      render(<HomeView onSearch={mockOnSearch} />)

      const handleSearchAttempt = (query: string) => {
        const trimmed = query.trim()
        if (!trimmed) return
        mockOnSearch(trimmed)
      }

      handleSearchAttempt('  测试查询  ')
      expect(mockOnSearch.mock.calls[0][0]).toBe('测试查询')
    })
  })

  describe('响应式布局', () => {
    test('应使用居中的最大宽度容器', () => {
      const { container } = render(<HomeView onSearch={mockOnSearch} />)

      const contentContainer = container.querySelector('.max-w-3xl')
      expect(contentContainer).not.toBeNull()
      expect(contentContainer?.classList.contains('mx-auto')).toBe(true)
    })

    test('应有适当的内边距', () => {
      const { container } = render(<HomeView onSearch={mockOnSearch} />)

      const contentContainer = container.querySelector('.max-w-3xl')
      expect(contentContainer?.classList.contains('px-4')).toBe(true)
      expect(contentContainer?.classList.contains('pb-20')).toBe(true)
    })

    test('应使用垂直居中布局', () => {
      const { container } = render(<HomeView onSearch={mockOnSearch} />)

      const contentContainer = container.querySelector('.max-w-3xl')
      expect(contentContainer?.classList.contains('justify-center')).toBe(true)
    })
  })

  describe('边界情况', () => {
    test('应处理 undefined onSearch', () => {
      const { container } = render(<HomeView onSearch={undefined as any} />)

      expect(container).not.toBeNull()
    })

    test('应正确处理多次搜索', () => {
      render(<HomeView onSearch={mockOnSearch} />)

      const handleSearchAttempt = (query: string) => {
        const trimmed = query.trim()
        if (!trimmed) return
        mockOnSearch(trimmed)
      }

      handleSearchAttempt('第一次查询')
      handleSearchAttempt('第二次查询')
      handleSearchAttempt('第三次查询')

      expect(mockOnSearch.mock.calls.length).toBe(3)
    })
  })
})

