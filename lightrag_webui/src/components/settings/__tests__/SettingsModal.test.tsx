import { describe, test, expect, beforeEach, mock } from 'bun:test'
import { render } from '@testing-library/react'
import { SettingsModal } from '../SettingsModal'
import { useRagStore } from '../../../hooks/useRagStore'

mock.module('../../../hooks/useRagStore', () => ({
  useRagStore: mock(() => {})
}))

describe('SettingsModal', () => {
  let mockShowToast: ReturnType<typeof mock>
  let mockOnClose: ReturnType<typeof mock>
  let mockSetTemperature: ReturnType<typeof mock>
  let mockSetChunkTopK: ReturnType<typeof mock>
  let mockSetSystemPrompt: ReturnType<typeof mock>
  let mockSetEvalResult: ReturnType<typeof mock>
  let mockSetPrevEvalResult: ReturnType<typeof mock>

  beforeEach(() => {
    mockShowToast = mock()
    mockOnClose = mock()
    mockSetTemperature = mock()
    mockSetChunkTopK = mock()
    mockSetSystemPrompt = mock()
    mockSetEvalResult = mock()
    mockSetPrevEvalResult = mock()

    // @ts-expect-error: 模拟 useRagStore
    useRagStore.mockImplementation((selector: any) => {
      const store = {
        temperature: 0.7,
        chunk_top_k: 20,
        systemPrompt: 'Default prompt',
        evalResult: null,
        setTemperature: mockSetTemperature,
        setChunkTopK: mockSetChunkTopK,
        setSystemPrompt: mockSetSystemPrompt,
        setEvalResult: mockSetEvalResult,
        setPrevEvalResult: mockSetPrevEvalResult
      }
      return selector(store)
    })
  })

  describe('基本渲染', () => {
    test('应在 isOpen=true 时显示弹窗', () => {
      const { container } = render(
        <SettingsModal isOpen={true} onClose={mockOnClose} showToast={mockShowToast} />
      )

      expect(container.textContent).toContain('RAG 设置')
      expect(container.textContent).toContain('调优参数配置')
    })

    test('应在 isOpen=false 时隐藏弹窗', () => {
      const { container } = render(
        <SettingsModal isOpen={false} onClose={mockOnClose} showToast={mockShowToast} />
      )

      expect(container.firstChild).toBeNull()
    })

    test('应显示标签页切换按钮', () => {
      const { container } = render(
        <SettingsModal isOpen={true} onClose={mockOnClose} showToast={mockShowToast} />
      )

      expect(container.textContent).toContain('参数配置')
      expect(container.textContent).toContain('评测面板')
    })

    test('应显示关闭按钮', () => {
      const { container } = render(
        <SettingsModal isOpen={true} onClose={mockOnClose} showToast={mockShowToast} />
      )

      const buttons = container.querySelectorAll('button')
      expect(buttons.length).toBeGreaterThan(0)
    })
  })

  describe('标签页切换', () => {
    test('应默认显示参数配置标签页', () => {
      const { container } = render(
        <SettingsModal isOpen={true} onClose={mockOnClose} showToast={mockShowToast} />
      )

      expect(container.textContent).toContain('温度')
      expect(container.textContent).toContain('文本块召回数量')
    })

    test('应显示评测面板标签', () => {
      const { container } = render(
        <SettingsModal isOpen={true} onClose={mockOnClose} showToast={mockShowToast} />
      )

      expect(container.textContent).toContain('评测面板')
    })

    test('应显示参数配置标签', () => {
      const { container } = render(
        <SettingsModal isOpen={true} onClose={mockOnClose} showToast={mockShowToast} />
      )

      expect(container.textContent).toContain('参数配置')
    })

    test('应包含两个标签页', () => {
      const { container } = render(
        <SettingsModal isOpen={true} onClose={mockOnClose} showToast={mockShowToast} />
      )

      const tabText = container.textContent || ''
      expect(tabText).toContain('参数配置')
      expect(tabText).toContain('评测面板')
    })
  })

  describe('关闭功能', () => {
    test('应显示关闭按钮', () => {
      const { container } = render(
        <SettingsModal isOpen={true} onClose={mockOnClose} showToast={mockShowToast} />
      )

      const buttons = container.querySelectorAll('button')
      const closeButton = Array.from(buttons).find((btn) => btn.querySelector('svg'))
      expect(closeButton).not.toBeNull()
    })

    test('关闭按钮可点击', () => {
      const { container } = render(
        <SettingsModal isOpen={true} onClose={mockOnClose} showToast={mockShowToast} />
      )

      const buttons = container.querySelectorAll('button')
      const closeButton = Array.from(buttons).find((btn) => btn.querySelector('svg'))

      closeButton?.click()
      expect(mockOnClose.mock.calls.length).toBeGreaterThan(0)
    })
  })
})

