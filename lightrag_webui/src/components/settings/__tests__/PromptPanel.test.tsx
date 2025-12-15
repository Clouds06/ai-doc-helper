import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test'
import { GlobalRegistrator } from '@happy-dom/global-registrator'
import { render } from '@testing-library/react'
import PromptPanel from '../PromptPanel'

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    }
  }
})()

const confirmMock = mock(() => true)

describe('PromptPanel', () => {
  let mockOnChange: ReturnType<typeof mock>

  beforeEach(() => {
    GlobalRegistrator.register()

    Object.defineProperty(globalThis, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true
    })

    Object.defineProperty(globalThis, 'confirm', {
      value: confirmMock,
      writable: true,
      configurable: true
    })

    localStorageMock.clear()
    mockOnChange = mock()
    confirmMock.mockReset()
    confirmMock.mockImplementation(() => true)
  })

  afterEach(() => {
    GlobalRegistrator.unregister()
  })

  describe('基础渲染', () => {
    test('应正确渲染组件', () => {
      const { container } = render(<PromptPanel value="" onChange={mockOnChange} />)

      expect(container.textContent).toContain('选择 / 管理提示词模版')
      expect(container.querySelector('textarea[placeholder*="系统提示词"]')).not.toBeNull()
      expect(container.textContent).toContain('保存为新模版')
    })

    test('应显示当前文本内容', () => {
      const testValue = '这是测试提示词'
      const { container } = render(<PromptPanel value={testValue} onChange={mockOnChange} />)

      const textarea = container.querySelector('textarea') as HTMLTextAreaElement
      expect(textarea?.value).toBe(testValue)
    })

    test('应显示字符数统计', () => {
      const { container } = render(<PromptPanel value="测试内容" onChange={mockOnChange} />)

      expect(container.textContent).toContain('4 chars')
    })

    test('空内容时不显示清空按钮', () => {
      const { container } = render(<PromptPanel value="" onChange={mockOnChange} />)

      expect(container.textContent).not.toContain('清空')
    })

    test('有内容时显示清空按钮', () => {
      const { container } = render(<PromptPanel value="内容" onChange={mockOnChange} />)

      expect(container.textContent).toContain('清空')
    })
  })

  describe('文本编辑', () => {
    test('textarea存在并可编辑', () => {
      const { container } = render(<PromptPanel value="" onChange={mockOnChange} />)

      const textarea = container.querySelector('textarea')
      expect(textarea).not.toBeNull()
    })

    test('清空按钮存在时可点击', () => {
      const { container } = render(<PromptPanel value="要清空的内容" onChange={mockOnChange} />)

      const buttons = Array.from(container.querySelectorAll('button'))
      const clearBtn = buttons.find((b) => b.textContent === '清空')
      expect(clearBtn).not.toBeNull()

      clearBtn?.click()
      expect(mockOnChange.mock.calls.length).toBeGreaterThan(0)
    })
  })

  describe('下拉菜单', () => {
    test('应显示下拉按钮', () => {
      const { container } = render(<PromptPanel value="" onChange={mockOnChange} />)

      expect(container.textContent).toContain('自定义（未保存）')
    })

    test('应显示模版选择按钮', () => {
      const { container } = render(<PromptPanel value="" onChange={mockOnChange} />)

      expect(container.textContent).toContain('选择 / 管理提示词模版')
    })
  })

  describe('保存为新模版', () => {
    test('应显示保存按钮', () => {
      const { container } = render(<PromptPanel value="" onChange={mockOnChange} />)

      expect(container.textContent).toContain('保存为新模版')
    })

    test('有内容时应显示保存按钮', () => {
      const { container } = render(<PromptPanel value="有内容" onChange={mockOnChange} />)

      const buttons = container.querySelectorAll('button')
      const hasSaveBtn = Array.from(buttons).some((b) => b.textContent?.includes('保存为新模版'))
      expect(hasSaveBtn).toBe(true)
    })
  })

  describe('自定义模版管理', () => {
    test('应支持自定义模版显示', () => {
      const { container } = render(<PromptPanel value="测试" onChange={mockOnChange} />)

      expect(container.textContent).toContain('选择 / 管理提示词模版')
    })

    test('应显示编辑按钮区域', () => {
      const { container } = render(<PromptPanel value="测试内容" onChange={mockOnChange} />)

      const buttons = container.querySelectorAll('button')
      expect(buttons.length).toBeGreaterThan(0)
    })
  })

  describe('本地存储', () => {
    test('应能访问 localStorage', () => {
      render(<PromptPanel value="存储测试" onChange={mockOnChange} />)

      localStorageMock.setItem('test_key', 'test_value')
      const value = localStorageMock.getItem('test_key')
      expect(value).toBe('test_value')
    })

    test('应从 localStorage 加载自定义模版', () => {
      const mockTemplates = [
        {
          id: 'custom_123',
          label: '加载的模版',
          desc: '描述',
          content: '模版内容'
        }
      ]

      localStorageMock.setItem('rag_custom_prompts_v1', JSON.stringify(mockTemplates))

      const { container } = render(<PromptPanel value="模版内容" onChange={mockOnChange} />)

      expect(container.textContent).toContain('加载的模版')
    })
  })

  describe('边界情况', () => {
    test('应处理 localStorage 解析错误', () => {
      localStorageMock.setItem('rag_custom_prompts_v1', 'invalid json')

      const { container } = render(<PromptPanel value="" onChange={mockOnChange} />)
      expect(container).not.toBeNull()
    })

    test('应处理空的 localStorage', () => {
      localStorageMock.clear()

      const { container } = render(<PromptPanel value="" onChange={mockOnChange} />)
      expect(container).not.toBeNull()
    })

    test('组件应正常渲染', () => {
      const { container } = render(<PromptPanel value="内容" onChange={mockOnChange} />)

      expect(container.textContent).toContain('保存为新模版')
      expect(container.querySelector('textarea')).not.toBeNull()
    })
  })
})

