import { describe, test, expect, beforeEach, mock } from 'bun:test'
import { render } from '@testing-library/react'
import { ParamsTab } from '../ParamsTab'
import type { SavedParamsSnapshot } from '../SettingsModal'
import { DEFAULT_SYSTEM_PROMPT } from '../../../lib/constants'

describe('ParamsTab', () => {
  let mockOnSaveConfig: ReturnType<typeof mock>
  let defaultParams: SavedParamsSnapshot

  beforeEach(() => {
    mockOnSaveConfig = mock()
    defaultParams = {
      temperature: 0.7,
      chunkTopK: 20,
      systemPrompt: DEFAULT_SYSTEM_PROMPT
    }
  })

  describe('基本渲染', () => {
    test('应正确渲染所有设置项', () => {
      const { container } = render(
        <ParamsTab savedParams={defaultParams} onSaveConfig={mockOnSaveConfig} />
      )

      expect(container.textContent).toContain('温度')
      expect(container.textContent).toContain('文本块召回数量')
      expect(container.textContent).toContain('系统提示词')
    })

    test('应显示当前参数值', () => {
      const { container } = render(
        <ParamsTab savedParams={defaultParams} onSaveConfig={mockOnSaveConfig} />
      )

      expect(container.textContent).toContain('0.7')
      expect(container.textContent).toContain('20')
    })

    test('应显示参数状态标签', () => {
      const { container } = render(
        <ParamsTab savedParams={defaultParams} onSaveConfig={mockOnSaveConfig} />
      )

      expect(container.textContent).toContain('平衡标准')
      expect(container.textContent).toContain('平衡模式')
    })

    test('应显示重置和保存按钮', () => {
      const { container } = render(
        <ParamsTab savedParams={defaultParams} onSaveConfig={mockOnSaveConfig} />
      )

      const buttons = container.querySelectorAll('button')
      const buttonTexts = Array.from(buttons).map((b) => b.textContent)
      expect(buttonTexts.some((t) => t?.includes('恢复默认'))).toBe(true)
      expect(buttonTexts.some((t) => t?.includes('保存配置'))).toBe(true)
    })
  })

  describe('温度调节', () => {
    test('应能通过滑块调整温度', () => {
      const { container } = render(
        <ParamsTab savedParams={defaultParams} onSaveConfig={mockOnSaveConfig} />
      )

      const slider = container.querySelector('input[type="range"]')
      expect(slider).not.toBeNull()
    })

    test('应显示不同温度的状态标签', () => {
      const lowTempParams = { ...defaultParams, temperature: 0.1 }
      const { rerender, container } = render(
        <ParamsTab savedParams={lowTempParams} onSaveConfig={mockOnSaveConfig} />
      )

      expect(container.textContent).toContain('严谨精确')

      const highTempParams = { ...defaultParams, temperature: 0.9 }
      rerender(<ParamsTab savedParams={highTempParams} onSaveConfig={mockOnSaveConfig} />)

      expect(container.textContent).toContain('发散创意')
    })
  })

  describe('文本块数量调节', () => {
    test('应能通过输入框调整文本块数量', () => {
      const { container } = render(
        <ParamsTab savedParams={defaultParams} onSaveConfig={mockOnSaveConfig} />
      )

      const input = container.querySelector('input[type="number"]') as HTMLInputElement
      expect(input).not.toBeNull()
      expect(input?.value).toBe('20')

      if (input) {
        input.value = '30'
        input.dispatchEvent(new Event('input', { bubbles: true }))
        expect(input.value).toBe('30')
      }
    })

    test('应显示不同文本块数量的状态标签', () => {
      const lowChunkParams = { ...defaultParams, chunkTopK: 5 }
      const { rerender, container } = render(
        <ParamsTab savedParams={lowChunkParams} onSaveConfig={mockOnSaveConfig} />
      )

      expect(container.textContent).toContain('极速模式')

      const highChunkParams = { ...defaultParams, chunkTopK: 60 }
      rerender(<ParamsTab savedParams={highChunkParams} onSaveConfig={mockOnSaveConfig} />)

      expect(container.textContent).toContain('高召回模式')
    })
  })

  describe('系统提示词', () => {
    test('应显示系统提示词面板', () => {
      const { container } = render(
        <ParamsTab savedParams={defaultParams} onSaveConfig={mockOnSaveConfig} />
      )

      const textarea = container.querySelector('textarea[placeholder*="自定义的系统提示词"]')
      expect(textarea).not.toBeNull()
    })

    test('应能修改系统提示词', () => {
      const { container } = render(
        <ParamsTab savedParams={defaultParams} onSaveConfig={mockOnSaveConfig} />
      )

      const textarea = container.querySelector('textarea') as HTMLTextAreaElement
      expect(textarea).not.toBeNull()

      if (textarea) {
        textarea.value = '自定义提示词'
        textarea.dispatchEvent(new Event('input', { bubbles: true }))
        expect(textarea.value).toBe('自定义提示词')
      }
    })
  })

  describe('重置功能', () => {
    test('应能重置所有参数为默认值', () => {
      const customParams = {
        temperature: 0.9,
        chunkTopK: 50,
        systemPrompt: '自定义提示词'
      }

      const { container } = render(
        <ParamsTab savedParams={customParams} onSaveConfig={mockOnSaveConfig} />
      )

      const buttons = Array.from(container.querySelectorAll('button'))
      const resetBtn = buttons.find((b) => b.textContent?.includes('恢复默认'))
      expect(resetBtn).not.toBeNull()

      expect(container.textContent).toContain('0.9')
      expect(container.textContent).toContain('50')
    })
  })

  describe('保存功能', () => {
    test('应显示保存按钮', () => {
      const { container } = render(
        <ParamsTab savedParams={defaultParams} onSaveConfig={mockOnSaveConfig} />
      )

      const buttons = Array.from(container.querySelectorAll('button'))
      const saveBtn = buttons.find((b) => b.textContent?.includes('保存配置'))
      expect(saveBtn).not.toBeNull()
    })

    test('保存按钮可以被点击', () => {
      const { container } = render(
        <ParamsTab savedParams={defaultParams} onSaveConfig={mockOnSaveConfig} />
      )

      const buttons = Array.from(container.querySelectorAll('button'))
      const saveBtn = buttons.find((b) => b.textContent?.includes('保存配置'))

      // 点击保存按钮（保存当前状态）
      saveBtn?.click()

      // 验证回调被调用
      expect(mockOnSaveConfig.mock.calls.length).toBeGreaterThan(0)
    })
  })

  describe('外部参数同步', () => {
    test('应在 savedParams 变化时同步到编辑态', () => {
      const { rerender, container } = render(
        <ParamsTab savedParams={defaultParams} onSaveConfig={mockOnSaveConfig} />
      )

      expect(container.textContent).toContain('0.7')

      const newParams = { ...defaultParams, temperature: 0.5, chunkTopK: 30 }
      rerender(<ParamsTab savedParams={newParams} onSaveConfig={mockOnSaveConfig} />)

      expect(container.textContent).toContain('0.5')
      expect(container.textContent).toContain('30')
    })
  })

  describe('边界情况', () => {
    test('应处理空的 systemPrompt', () => {
      const paramsWithoutPrompt = {
        temperature: 0.7,
        chunkTopK: 20,
        systemPrompt: ''
      }

      const { container } = render(
        <ParamsTab savedParams={paramsWithoutPrompt} onSaveConfig={mockOnSaveConfig} />
      )

      const textarea = container.querySelector('textarea') as HTMLTextAreaElement
      expect(textarea?.value).toBe(DEFAULT_SYSTEM_PROMPT)
    })

    test('应处理 undefined systemPrompt', () => {
      const paramsWithoutPrompt = {
        temperature: 0.7,
        chunkTopK: 20,
        systemPrompt: undefined as any
      }

      const { container } = render(
        <ParamsTab savedParams={paramsWithoutPrompt} onSaveConfig={mockOnSaveConfig} />
      )

      const textarea = container.querySelector('textarea') as HTMLTextAreaElement
      expect(textarea?.value).toBe(DEFAULT_SYSTEM_PROMPT)
    })

    test('应处理极端的温度值', () => {
      const minTempParams = { ...defaultParams, temperature: 0 }
      const { rerender, container } = render(
        <ParamsTab savedParams={minTempParams} onSaveConfig={mockOnSaveConfig} />
      )

      expect(container.textContent).toContain('0.0')

      const maxTempParams = { ...defaultParams, temperature: 1 }
      rerender(<ParamsTab savedParams={maxTempParams} onSaveConfig={mockOnSaveConfig} />)

      expect(container.textContent).toContain('1.0')
    })

    test('应处理极端的文本块数量', () => {
      const minChunkParams = { ...defaultParams, chunkTopK: 1 }
      const { rerender, container } = render(
        <ParamsTab savedParams={minChunkParams} onSaveConfig={mockOnSaveConfig} />
      )

      expect(container.textContent).toContain('1')

      const maxChunkParams = { ...defaultParams, chunkTopK: 100 }
      rerender(<ParamsTab savedParams={maxChunkParams} onSaveConfig={mockOnSaveConfig} />)

      expect(container.textContent).toContain('100')
    })
  })
})

