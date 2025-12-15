import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ParamsTab } from '../../src/components/settings/ParamsTab'
import type { SavedParamsSnapshot } from '../../src/components/settings/SettingsModal'
import { DEFAULT_SYSTEM_PROMPT } from '../../src/lib/constants'

describe('ParamsTab', () => {
  let mockOnSaveConfig: (next: SavedParamsSnapshot) => void
  let defaultParams: SavedParamsSnapshot

  beforeEach(() => {
    mockOnSaveConfig = vi.fn<(next: SavedParamsSnapshot) => void>()
    defaultParams = {
      temperature: 0.7,
      chunkTopK: 20,
      systemPrompt: DEFAULT_SYSTEM_PROMPT
    }
  })

  describe('基本渲染', () => {
    it('应正确渲染所有设置项', () => {
      render(<ParamsTab savedParams={defaultParams} onSaveConfig={mockOnSaveConfig} />)

      expect(screen.getByText('温度')).toBeInTheDocument()
      expect(screen.getByText('文本块召回数量')).toBeInTheDocument()
      expect(screen.getByText('系统提示词')).toBeInTheDocument()
    })

    it('应显示当前参数值', () => {
      render(<ParamsTab savedParams={defaultParams} onSaveConfig={mockOnSaveConfig} />)

      expect(screen.getByText('0.7')).toBeInTheDocument()
      expect(screen.getByText('20')).toBeInTheDocument()
    })

    it('应显示参数状态标签', () => {
      render(<ParamsTab savedParams={defaultParams} onSaveConfig={mockOnSaveConfig} />)

      expect(screen.getByText('平衡标准')).toBeInTheDocument()
      expect(screen.getByText('平衡模式')).toBeInTheDocument()
    })

    it('应显示重置和保存按钮', () => {
      render(<ParamsTab savedParams={defaultParams} onSaveConfig={mockOnSaveConfig} />)

      expect(screen.getByRole('button', { name: '恢复默认' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '保存配置' })).toBeInTheDocument()
    })
  })

  describe('温度调节', () => {
    it('应能通过滑块调整温度', async () => {
      const user = userEvent.setup()
      render(<ParamsTab savedParams={defaultParams} onSaveConfig={mockOnSaveConfig} />)

      const slider = screen.getByRole('slider')
      await user.click(slider)

      expect(slider).toBeInTheDocument()
    })

    it('应显示不同温度的状态标签', () => {
      const lowTempParams = { ...defaultParams, temperature: 0.1 }
      const { rerender } = render(
        <ParamsTab savedParams={lowTempParams} onSaveConfig={mockOnSaveConfig} />
      )

      expect(screen.getByText('严谨精确')).toBeInTheDocument()

      const highTempParams = { ...defaultParams, temperature: 0.9 }
      rerender(<ParamsTab savedParams={highTempParams} onSaveConfig={mockOnSaveConfig} />)

      expect(screen.getByText('发散创意')).toBeInTheDocument()
    })
  })

  describe('文本块数量调节', () => {
    it('应能通过输入框调整文本块数量', async () => {
      const user = userEvent.setup()
      render(<ParamsTab savedParams={defaultParams} onSaveConfig={mockOnSaveConfig} />)

      const input = screen.getByDisplayValue('20')
      await user.clear(input)
      await user.type(input, '30')

      expect(input).toHaveValue(30)
    })

    it('应显示不同文本块数量的状态标签', () => {
      const lowChunkParams = { ...defaultParams, chunkTopK: 5 }
      const { rerender } = render(
        <ParamsTab savedParams={lowChunkParams} onSaveConfig={mockOnSaveConfig} />
      )

      expect(screen.getByText('极速模式')).toBeInTheDocument()

      const highChunkParams = { ...defaultParams, chunkTopK: 60 }
      rerender(<ParamsTab savedParams={highChunkParams} onSaveConfig={mockOnSaveConfig} />)

      expect(screen.getByText('高召回模式')).toBeInTheDocument()
    })
  })

  describe('系统提示词', () => {
    it('应显示系统提示词面板', () => {
      render(<ParamsTab savedParams={defaultParams} onSaveConfig={mockOnSaveConfig} />)

      expect(screen.getByPlaceholderText('在此输入自定义的系统提示词...')).toBeInTheDocument()
    })

    it('应能修改系统提示词', async () => {
      const user = userEvent.setup()
      render(<ParamsTab savedParams={defaultParams} onSaveConfig={mockOnSaveConfig} />)

      const textarea = screen.getByPlaceholderText('在此输入自定义的系统提示词...')
      await user.clear(textarea)
      await user.type(textarea, '自定义提示词')

      expect(textarea).toHaveValue('自定义提示词')
    })
  })

  describe('重置功能', () => {
    it('应能重置所有参数为默认值', async () => {
      const user = userEvent.setup()
      const customParams = {
        temperature: 0.9,
        chunkTopK: 50,
        systemPrompt: '自定义提示词'
      }

      render(<ParamsTab savedParams={customParams} onSaveConfig={mockOnSaveConfig} />)

      const resetBtn = screen.getByRole('button', { name: '恢复默认' })
      await user.click(resetBtn)

      // 验证显示默认值
      expect(screen.getByText('0.7')).toBeInTheDocument()
      expect(screen.getByText('20')).toBeInTheDocument()
    })
  })

  describe('保存功能', () => {
    it('应能保存修改后的参数', async () => {
      const user = userEvent.setup()
      render(<ParamsTab savedParams={defaultParams} onSaveConfig={mockOnSaveConfig} />)

      const input = screen.getByDisplayValue('20')
      await user.clear(input)
      await user.type(input, '30')

      const saveBtn = screen.getByRole('button', { name: '保存配置' })
      await user.click(saveBtn)

      expect(mockOnSaveConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          chunkTopK: 30
        })
      )
    })

    it('应能保存重置后的参数', async () => {
      const user = userEvent.setup()
      const customParams = {
        temperature: 0.9,
        chunkTopK: 50,
        systemPrompt: '自定义提示词'
      }

      render(<ParamsTab savedParams={customParams} onSaveConfig={mockOnSaveConfig} />)

      const resetBtn = screen.getByRole('button', { name: '恢复默认' })
      await user.click(resetBtn)

      const saveBtn = screen.getByRole('button', { name: '保存配置' })
      await user.click(saveBtn)

      expect(mockOnSaveConfig).toHaveBeenCalledWith({
        temperature: 0.7,
        chunkTopK: 20,
        systemPrompt: DEFAULT_SYSTEM_PROMPT
      })
    })
  })

  describe('外部参数同步', () => {
    it('应在 savedParams 变化时同步到编辑态', async () => {
      const { rerender } = render(
        <ParamsTab savedParams={defaultParams} onSaveConfig={mockOnSaveConfig} />
      )

      expect(screen.getByText('0.7')).toBeInTheDocument()

      const newParams = { ...defaultParams, temperature: 0.5, chunkTopK: 30 }
      rerender(<ParamsTab savedParams={newParams} onSaveConfig={mockOnSaveConfig} />)

      await waitFor(() => {
        expect(screen.getByText('0.5')).toBeInTheDocument()
        expect(screen.getByText('30')).toBeInTheDocument()
      })
    })
  })

  describe('边界情况', () => {
    it('应处理空的 systemPrompt', () => {
      const paramsWithoutPrompt = {
        temperature: 0.7,
        chunkTopK: 20,
        systemPrompt: ''
      }

      render(<ParamsTab savedParams={paramsWithoutPrompt} onSaveConfig={mockOnSaveConfig} />)

      const textarea = screen.getByPlaceholderText('在此输入自定义的系统提示词...')
      expect(textarea).toHaveValue(DEFAULT_SYSTEM_PROMPT)
    })

    it('应处理 undefined systemPrompt', () => {
      const paramsWithoutPrompt = {
        temperature: 0.7,
        chunkTopK: 20,
        systemPrompt: undefined as any
      }

      render(<ParamsTab savedParams={paramsWithoutPrompt} onSaveConfig={mockOnSaveConfig} />)

      const textarea = screen.getByPlaceholderText('在此输入自定义的系统提示词...')
      expect(textarea).toHaveValue(DEFAULT_SYSTEM_PROMPT)
    })

    it('应处理极端的温度值', () => {
      const minTempParams = { ...defaultParams, temperature: 0 }
      const { rerender } = render(
        <ParamsTab savedParams={minTempParams} onSaveConfig={mockOnSaveConfig} />
      )

      expect(screen.getByText('0.0')).toBeInTheDocument()

      const maxTempParams = { ...defaultParams, temperature: 1 }
      rerender(<ParamsTab savedParams={maxTempParams} onSaveConfig={mockOnSaveConfig} />)

      expect(screen.getByText('1.0')).toBeInTheDocument()
    })

    it('应处理极端的文本块数量', () => {
      const minChunkParams = { ...defaultParams, chunkTopK: 1 }
      const { rerender } = render(
        <ParamsTab savedParams={minChunkParams} onSaveConfig={mockOnSaveConfig} />
      )

      expect(screen.getByText('1')).toBeInTheDocument()

      const maxChunkParams = { ...defaultParams, chunkTopK: 100 }
      rerender(<ParamsTab savedParams={maxChunkParams} onSaveConfig={mockOnSaveConfig} />)

      expect(screen.getByText('100')).toBeInTheDocument()
    })
  })
})

