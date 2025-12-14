import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import PromptPanel from '../../src/components/settings/PromptPanel'

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

const confirmMock = vi.fn()

beforeAll(() => {
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true
  })

  Object.defineProperty(window, 'confirm', {
    value: confirmMock,
    writable: true
  })
})

describe('PromptPanel', () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    localStorageMock.clear()
    mockOnChange.mockClear()
    confirmMock.mockClear()
    confirmMock.mockReturnValue(true)
  })

  describe('基础渲染', () => {
    it('应正确渲染组件', () => {
      render(<PromptPanel value="" onChange={mockOnChange} />)

      expect(screen.getByText('选择 / 管理提示词模版')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('在此输入自定义的系统提示词...')).toBeInTheDocument()
      expect(screen.getByText('保存为新模版')).toBeInTheDocument()
    })

    it('应显示当前文本内容', () => {
      const testValue = '这是测试提示词'
      render(<PromptPanel value={testValue} onChange={mockOnChange} />)

      const textarea = screen.getByPlaceholderText('在此输入自定义的系统提示词...')
      expect(textarea).toHaveValue(testValue)
    })

    it('应显示字符数统计', () => {
      render(<PromptPanel value="测试内容" onChange={mockOnChange} />)

      expect(screen.getByText(/4 chars/)).toBeInTheDocument()
    })

    it('空内容时不显示清空按钮', () => {
      render(<PromptPanel value="" onChange={mockOnChange} />)

      expect(screen.queryByText('清空')).not.toBeInTheDocument()
    })

    it('有内容时显示清空按钮', () => {
      render(<PromptPanel value="内容" onChange={mockOnChange} />)

      expect(screen.getByText('清空')).toBeInTheDocument()
    })
  })

  describe('文本编辑', () => {
    it('应触发 onChange 回调', async () => {
      const user = userEvent.setup()
      render(<PromptPanel value="" onChange={mockOnChange} />)

      const textarea = screen.getByPlaceholderText('在此输入自定义的系统提示词...')
      await user.type(textarea, '新内容')

      expect(mockOnChange).toHaveBeenCalled()
      expect(mockOnChange.mock.calls[0][0]).toContain('新')
    })

    it('清空按钮应清空内容', async () => {
      const user = userEvent.setup()
      render(<PromptPanel value="要清空的内容" onChange={mockOnChange} />)

      const clearBtn = screen.getByText('清空')
      await user.click(clearBtn)

      expect(mockOnChange).toHaveBeenCalledWith('')
    })
  })

  describe('下拉菜单', () => {
    it('点击按钮应打开下拉菜单', async () => {
      const user = userEvent.setup()
      render(<PromptPanel value="" onChange={mockOnChange} />)

      const dropdownBtn = screen.getByText('自定义（未保存）')
      await user.click(dropdownBtn)

      expect(screen.getByText('预设模版')).toBeInTheDocument()
    })

    it('应显示预设模版列表', async () => {
      const user = userEvent.setup()
      render(<PromptPanel value="" onChange={mockOnChange} />)

      const dropdownBtn = screen.getByText('自定义（未保存）')
      await user.click(dropdownBtn)

      expect(screen.getByText('预设模版')).toBeInTheDocument()
      // 预设模版从 PROMPT_PRESETS 加载，这里只验证标题存在
    })

    it('再次点击应关闭下拉菜单', async () => {
      const user = userEvent.setup()
      render(<PromptPanel value="" onChange={mockOnChange} />)

      const dropdownBtn = screen.getByText('自定义（未保存）')
      await user.click(dropdownBtn)
      expect(screen.getByText('预设模版')).toBeInTheDocument()

      await user.click(dropdownBtn)
      await waitFor(() => {
        expect(screen.queryByText('预设模版')).not.toBeInTheDocument()
      })
    })
  })

  describe('保存为新模版', () => {
    it('空内容时应显示错误', async () => {
      const user = userEvent.setup()
      render(<PromptPanel value="" onChange={mockOnChange} />)

      const saveBtn = screen.getByText('保存为新模版')
      await user.click(saveBtn)

      await waitFor(() => {
        expect(screen.getByText('当前内容为空，无法保存为模版')).toBeInTheDocument()
      })
    })

    it('应打开命名弹窗', async () => {
      const user = userEvent.setup()
      render(<PromptPanel value="有内容" onChange={mockOnChange} />)

      const saveBtn = screen.getByText('保存为新模版')
      await user.click(saveBtn)

      expect(screen.getAllByText('保存为新模版').length).toBeGreaterThan(1)
      expect(screen.getByPlaceholderText('例如：法律问答')).toBeInTheDocument()
    })

    it('空名称时应显示错误', async () => {
      const user = userEvent.setup()
      render(<PromptPanel value="测试内容" onChange={mockOnChange} />)

      const saveBtn = screen.getByText('保存为新模版')
      await user.click(saveBtn)

      const confirmBtn = screen.getByRole('button', { name: '保存' })
      await user.click(confirmBtn)

      expect(screen.getByText('模版名称不能为空')).toBeInTheDocument()
    })

    it('应成功保存新模版', async () => {
      const user = userEvent.setup()
      render(<PromptPanel value="测试提示词" onChange={mockOnChange} />)

      // 打开弹窗
      const saveBtn = screen.getByText('保存为新模版')
      await user.click(saveBtn)

      // 输入名称
      const nameInput = screen.getByPlaceholderText('例如：法律问答')
      await user.type(nameInput, '我的模版')

      // 确认保存
      const confirmBtn = screen.getByRole('button', { name: '保存' })
      await user.click(confirmBtn)

      // 弹窗应关闭
      await waitFor(() => {
        expect(screen.queryByPlaceholderText('例如：法律问答')).not.toBeInTheDocument()
      })
    })

    it('重名应显示错误', async () => {
      const user = userEvent.setup()

      // 先保存一个模版
      const { rerender } = render(<PromptPanel value="第一个内容" onChange={mockOnChange} />)

      let saveBtn = screen.getByText('保存为新模版')
      await user.click(saveBtn)

      let nameInput = screen.getByPlaceholderText('例如：法律问答')
      await user.type(nameInput, '重复名称')

      let confirmBtn = screen.getByRole('button', { name: '保存' })
      await user.click(confirmBtn)

      // 等待保存完成
      await waitFor(() => {
        expect(screen.queryByPlaceholderText('例如：法律问答')).not.toBeInTheDocument()
      })

      // 尝试保存重名模版
      rerender(<PromptPanel value="第二个内容" onChange={mockOnChange} />)

      saveBtn = screen.getByText('保存为新模版')
      await user.click(saveBtn)

      nameInput = screen.getByPlaceholderText('例如：法律问答')
      await user.type(nameInput, '重复名称')

      confirmBtn = screen.getByRole('button', { name: '保存' })
      await user.click(confirmBtn)

      expect(screen.getByText('已存在同名模版，请换一个名字')).toBeInTheDocument()
    })

    it('点击取消应关闭弹窗', async () => {
      const user = userEvent.setup()
      render(<PromptPanel value="内容" onChange={mockOnChange} />)

      const saveBtn = screen.getByText('保存为新模版')
      await user.click(saveBtn)

      const cancelBtn = screen.getByRole('button', { name: '取消' })
      await user.click(cancelBtn)

      await waitFor(() => {
        expect(screen.queryByPlaceholderText('例如：法律问答')).not.toBeInTheDocument()
      })
    })
  })

  describe('自定义模版管理', () => {
    it('应显示自定义模版在下拉菜单', async () => {
      const user = userEvent.setup()

      // 先保存一个模版
      render(<PromptPanel value="我的内容" onChange={mockOnChange} />)

      const saveBtn = screen.getByText('保存为新模版')
      await user.click(saveBtn)

      const nameInput = screen.getByPlaceholderText('例如：法律问答')
      await user.type(nameInput, '自定义模版1')

      const confirmBtn = screen.getByRole('button', { name: '保存' })
      await user.click(confirmBtn)

      await waitFor(() => {
        expect(screen.queryByPlaceholderText('例如：法律问答')).not.toBeInTheDocument()
      })

      // 打开下拉菜单（'自定义模版1'会出现在按钮和下拉列表中）
      const dropdownButtons = screen.getAllByText('自定义模版1')
      await user.click(dropdownButtons[0])

      expect(screen.getByText('自定义模版')).toBeInTheDocument()
      expect(screen.getAllByText('自定义模版1').length).toBeGreaterThan(1)
    })

    it('选中自定义模版应显示编辑按钮', async () => {
      const user = userEvent.setup()

      // 保存模版
      render(<PromptPanel value="测试" onChange={mockOnChange} />)
      const saveBtn = screen.getByText('保存为新模版')
      await user.click(saveBtn)

      const nameInput = screen.getByPlaceholderText('例如：法律问答')
      await user.type(nameInput, '可编辑模版')

      const confirmBtn = screen.getByRole('button', { name: '保存' })
      await user.click(confirmBtn)

      await waitFor(() => {
        expect(screen.queryByPlaceholderText('例如：法律问答')).not.toBeInTheDocument()
      })

      // 应显示保存按钮（通过 Save 图标的 className）
      const buttons = screen.getAllByRole('button')
      const saveButton = buttons.find((btn) => btn.querySelector('.lucide-save'))
      expect(saveButton).toBeInTheDocument()
    })

    it('修改内容应显示"已修改"标记', async () => {
      const user = userEvent.setup()

      // 使用受控组件模式
      let currentValue = '原始内容'
      const { rerender } = render(
        <PromptPanel
          value={currentValue}
          onChange={(newValue) => {
            currentValue = newValue
          }}
        />
      )

      // 保存模版
      const saveBtn = screen.getByText('保存为新模版')
      await user.click(saveBtn)

      const nameInput = screen.getByPlaceholderText('例如：法律问答')
      await user.type(nameInput, '测试模版')

      const confirmBtn = screen.getByRole('button', { name: '保存' })
      await user.click(confirmBtn)

      await waitFor(() => {
        expect(screen.queryByPlaceholderText('例如：法律问答')).not.toBeInTheDocument()
      })

      // 保存后未修改，不应显示"已修改"标记
      expect(screen.queryByText('已修改')).not.toBeInTheDocument()

      // 修改内容
      const textarea = screen.getByPlaceholderText('在此输入自定义的系统提示词...')
      await user.clear(textarea)
      await user.type(textarea, '修改后的内容')

      // 重新渲染以反映状态变化
      rerender(
        <PromptPanel
          value={currentValue}
          onChange={(newValue) => {
            currentValue = newValue
          }}
        />
      )

      // 应显示"已修改"标记
      await waitFor(() => {
        expect(screen.getByText('已修改')).toBeInTheDocument()
      })
    })

    it('应能删除自定义模版', async () => {
      const user = userEvent.setup()

      // 保存模版
      render(<PromptPanel value="待删除内容" onChange={mockOnChange} />)
      const saveBtn = screen.getByText('保存为新模版')
      await user.click(saveBtn)

      const nameInput = screen.getByPlaceholderText('例如：法律问答')
      await user.type(nameInput, '待删除模版')

      const confirmBtn = screen.getByRole('button', { name: '保存' })
      await user.click(confirmBtn)

      await waitFor(() => {
        expect(screen.queryByPlaceholderText('例如：法律问答')).not.toBeInTheDocument()
      })

      // 找到删除按钮（通过 Trash2 图标的父按钮）
      const deleteButtons = screen.getAllByRole('button')
      const deleteBtn = deleteButtons.find((btn) => btn.className.includes('red'))
      expect(deleteBtn).toBeInTheDocument()

      if (deleteBtn) {
        await user.click(deleteBtn)
        expect(confirmMock).toHaveBeenCalled()
        expect(mockOnChange).toHaveBeenCalledWith('')
      }
    })

    it('取消删除应保留模版', async () => {
      const user = userEvent.setup()
      confirmMock.mockReturnValue(false)

      // 保存模版
      render(<PromptPanel value="保留内容" onChange={mockOnChange} />)
      const saveBtn = screen.getByText('保存为新模版')
      await user.click(saveBtn)

      const nameInput = screen.getByPlaceholderText('例如：法律问答')
      await user.type(nameInput, '保留模版')

      const confirmBtn = screen.getByRole('button', { name: '保存' })
      await user.click(confirmBtn)

      await waitFor(() => {
        expect(screen.queryByPlaceholderText('例如：法律问答')).not.toBeInTheDocument()
      })

      // 尝试删除
      const deleteButtons = screen.getAllByRole('button')
      const deleteBtn = deleteButtons.find((btn) => btn.className.includes('red'))

      if (deleteBtn) {
        await user.click(deleteBtn)
        expect(confirmMock).toHaveBeenCalled()

        // onChange 不应被调用（因为取消了）
        expect(mockOnChange).not.toHaveBeenCalledWith('')
      }
    })
  })

  describe('本地存储', () => {
    it('应保存自定义模版到 localStorage', async () => {
      const user = userEvent.setup()
      render(<PromptPanel value="存储测试" onChange={mockOnChange} />)

      const saveBtn = screen.getByText('保存为新模版')
      await user.click(saveBtn)

      const nameInput = screen.getByPlaceholderText('例如：法律问答')
      await user.type(nameInput, '存储模版')

      const confirmBtn = screen.getByRole('button', { name: '保存' })
      await user.click(confirmBtn)

      await waitFor(() => {
        const stored = localStorageMock.getItem('rag_custom_prompts_v1')
        expect(stored).toBeTruthy()

        if (stored) {
          const parsed = JSON.parse(stored)
          expect(parsed).toBeInstanceOf(Array)
          expect(parsed.length).toBeGreaterThan(0)
          expect(parsed[0].label).toBe('存储模版')
        }
      })
    })

    it('应从 localStorage 加载自定义模版', () => {
      const mockTemplates = [
        {
          id: 'custom_123',
          label: '加载的模版',
          desc: '描述',
          content: '模版内容'
        }
      ]

      localStorageMock.setItem('rag_custom_prompts_v1', JSON.stringify(mockTemplates))

      render(<PromptPanel value="模版内容" onChange={mockOnChange} />)

      expect(screen.getByText('加载的模版')).toBeInTheDocument()
    })
  })

  describe('边界情况', () => {
    it('应处理 localStorage 解析错误', () => {
      localStorageMock.setItem('rag_custom_prompts_v1', 'invalid json')

      // 不应崩溃
      expect(() => {
        render(<PromptPanel value="" onChange={mockOnChange} />)
      }).not.toThrow()
    })

    it('应处理空的 localStorage', () => {
      localStorageMock.clear()

      const { container } = render(<PromptPanel value="" onChange={mockOnChange} />)
      expect(container).toBeInTheDocument()
    })

    it('输入名称时应清除错误', async () => {
      const user = userEvent.setup()
      render(<PromptPanel value="内容" onChange={mockOnChange} />)

      const saveBtn = screen.getByText('保存为新模版')
      await user.click(saveBtn)

      // 先触发错误
      const confirmBtn = screen.getByRole('button', { name: '保存' })
      await user.click(confirmBtn)
      expect(screen.getByText('模版名称不能为空')).toBeInTheDocument()

      // 输入内容应清除错误
      const nameInput = screen.getByPlaceholderText('例如：法律问答')
      await user.type(nameInput, 'A')

      await waitFor(() => {
        expect(screen.queryByText('模版名称不能为空')).not.toBeInTheDocument()
      })
    })
  })
})

