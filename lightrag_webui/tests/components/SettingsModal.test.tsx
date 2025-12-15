import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SettingsModal } from '../../src/components/settings/SettingsModal'
import { useRagStore } from '../../src/hooks/useRagStore'

vi.mock('../../src/hooks/useRagStore', () => ({
  useRagStore: vi.fn()
}))

describe('SettingsModal', () => {
  let mockShowToast: (message: string, type: 'success' | 'warning' | 'info') => void
  let mockOnClose: () => void
  let mockSetTemperature: (value: number) => void
  let mockSetChunkTopK: (value: number) => void
  let mockSetSystemPrompt: (value: string) => void
  let mockSetEvalResult: (value: any) => void
  let mockSetPrevEvalResult: (value: any) => void

  beforeEach(() => {
    mockShowToast = vi.fn()
    mockOnClose = vi.fn()
    mockSetTemperature = vi.fn()
    mockSetChunkTopK = vi.fn()
    mockSetSystemPrompt = vi.fn()
    mockSetEvalResult = vi.fn()
    mockSetPrevEvalResult = vi.fn()

    vi.mocked(useRagStore).mockImplementation((selector: any) => {
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

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('基本渲染', () => {
    it('应在 isOpen=true 时显示弹窗', () => {
      render(<SettingsModal isOpen={true} onClose={mockOnClose} showToast={mockShowToast} />)

      expect(screen.getByText('RAG 设置')).toBeInTheDocument()
      expect(screen.getByText(/调优参数配置/)).toBeInTheDocument()
    })

    it('应在 isOpen=false 时隐藏弹窗', () => {
      const { container } = render(
        <SettingsModal isOpen={false} onClose={mockOnClose} showToast={mockShowToast} />
      )

      expect(container.firstChild).toBeNull()
    })

    it('应显示标签页切换按钮', () => {
      render(<SettingsModal isOpen={true} onClose={mockOnClose} showToast={mockShowToast} />)

      expect(screen.getByText('参数配置')).toBeInTheDocument()
      expect(screen.getByText('评测面板')).toBeInTheDocument()
    })

    it('应显示关闭按钮', () => {
      render(<SettingsModal isOpen={true} onClose={mockOnClose} showToast={mockShowToast} />)

      const closeButton = screen.getByRole('button', { name: '' })
      expect(closeButton).toBeInTheDocument()
    })
  })

  describe('标签页切换', () => {
    it('应默认显示参数配置标签页', () => {
      render(<SettingsModal isOpen={true} onClose={mockOnClose} showToast={mockShowToast} />)

      expect(screen.getByText('温度')).toBeInTheDocument()
      expect(screen.getByText('文本块召回数量')).toBeInTheDocument()
    })

    it('应能切换到评测面板', async () => {
      const user = userEvent.setup()
      render(<SettingsModal isOpen={true} onClose={mockOnClose} showToast={mockShowToast} />)

      const evalTab = screen.getByText('评测面板')
      await user.click(evalTab)

      expect(screen.getByText('开始全量评测')).toBeInTheDocument()
    })

    it('应能切换回参数配置', async () => {
      const user = userEvent.setup()
      render(<SettingsModal isOpen={true} onClose={mockOnClose} showToast={mockShowToast} />)

      const evalTab = screen.getByText('评测面板')
      await user.click(evalTab)

      const paramsTab = screen.getByText('参数配置')
      await user.click(paramsTab)

      expect(screen.getByText('温度')).toBeInTheDocument()
    })

    it('应在切换标签时保留当前标签状态', async () => {
      const user = userEvent.setup()
      render(<SettingsModal isOpen={true} onClose={mockOnClose} showToast={mockShowToast} />)

      await user.click(screen.getByText('评测面板'))
      expect(screen.getByText('开始全量评测')).toBeInTheDocument()

      await user.click(screen.getByText('参数配置'))
      expect(screen.getByText('温度')).toBeInTheDocument()

      await user.click(screen.getByText('评测面板'))
      expect(screen.getByText('开始全量评测')).toBeInTheDocument()
    })
  })

  describe('关闭功能', () => {
    it('应能通过关闭按钮关闭弹窗', async () => {
      const user = userEvent.setup()
      render(<SettingsModal isOpen={true} onClose={mockOnClose} showToast={mockShowToast} />)

      const closeButtons = screen.getAllByRole('button', { name: '' })
      const closeButton = closeButtons.find((btn) => btn.querySelector('.lucide-x'))

      if (closeButton) {
        await user.click(closeButton)
        expect(mockOnClose).toHaveBeenCalled()
      }
    })
  })
})

