import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EvalTab } from '../../src/components/settings/EvalTab'
import type { EvalStatus } from '../../src/types/index'

vi.mock('@/components/common/EvalButton', () => ({
  EvalButton: ({ onStartEvaluation }: { onStartEvaluation: () => void }) => (
    <button onClick={onStartEvaluation}>开始评测</button>
  )
}))

vi.mock('@/components/common/LoadingDisplay', () => ({
  LoadingDisplay: ({ content }: { content: string }) => <div>{content}</div>
}))

vi.mock('@/components/common/EvalResultDisplay', () => ({
  EvalResultDisplay: ({ onStartEvaluation }: { onStartEvaluation: () => void }) => (
    <div>
      <div>评测结果</div>
      <button onClick={onStartEvaluation}>重新评测</button>
    </div>
  )
}))

describe('EvalTab', () => {
  let mockOnStartEvaluation: () => void

  beforeEach(() => {
    mockOnStartEvaluation = vi.fn()
  })

  describe('初始状态（未评测）', () => {
    it('应显示评测按钮当状态为 idle 且未评测过', () => {
      render(
        <EvalTab evalState="idle" onStartEvaluation={mockOnStartEvaluation} hasEvaluated={false} />
      )

      expect(screen.getByText('开始评测')).toBeInTheDocument()
    })

    it('应能点击开始评测按钮', async () => {
      const user = userEvent.setup()
      render(
        <EvalTab evalState="idle" onStartEvaluation={mockOnStartEvaluation} hasEvaluated={false} />
      )

      const button = screen.getByText('开始评测')
      await user.click(button)

      expect(mockOnStartEvaluation).toHaveBeenCalledTimes(1)
    })
  })

  describe('加载状态', () => {
    it('应显示加载提示当状态为 loading', () => {
      render(
        <EvalTab
          evalState="loading"
          onStartEvaluation={mockOnStartEvaluation}
          hasEvaluated={false}
        />
      )

      expect(screen.getByText('正在进行评测，请耐心等待...')).toBeInTheDocument()
    })

    it('应在已评测后仍显示加载状态', () => {
      render(
        <EvalTab
          evalState="loading"
          onStartEvaluation={mockOnStartEvaluation}
          hasEvaluated={true}
        />
      )

      expect(screen.getByText('正在进行评测，请耐心等待...')).toBeInTheDocument()
    })

    it('不应显示评测按钮在加载状态', () => {
      render(
        <EvalTab
          evalState="loading"
          onStartEvaluation={mockOnStartEvaluation}
          hasEvaluated={false}
        />
      )

      expect(screen.queryByText('开始评测')).not.toBeInTheDocument()
    })
  })

  describe('评测完成状态', () => {
    it('应显示结果当状态为 success', () => {
      render(
        <EvalTab
          evalState="success"
          onStartEvaluation={mockOnStartEvaluation}
          hasEvaluated={true}
        />
      )

      expect(screen.getByText('评测结果')).toBeInTheDocument()
    })

    it('应显示结果当状态为 error', () => {
      render(
        <EvalTab evalState="error" onStartEvaluation={mockOnStartEvaluation} hasEvaluated={true} />
      )

      expect(screen.getByText('评测结果')).toBeInTheDocument()
    })

    it('应显示重新评测按钮', () => {
      render(
        <EvalTab
          evalState="success"
          onStartEvaluation={mockOnStartEvaluation}
          hasEvaluated={true}
        />
      )

      expect(screen.getByText('重新评测')).toBeInTheDocument()
    })

    it('应能点击重新评测按钮', async () => {
      const user = userEvent.setup()
      render(
        <EvalTab
          evalState="success"
          onStartEvaluation={mockOnStartEvaluation}
          hasEvaluated={true}
        />
      )

      const button = screen.getByText('重新评测')
      await user.click(button)

      expect(mockOnStartEvaluation).toHaveBeenCalledTimes(1)
    })
  })

  describe('状态转换', () => {
    it('应从 idle 转换到结果显示当 hasEvaluated 为 true', () => {
      const { rerender } = render(
        <EvalTab evalState="idle" onStartEvaluation={mockOnStartEvaluation} hasEvaluated={false} />
      )

      expect(screen.getByText('开始评测')).toBeInTheDocument()

      rerender(
        <EvalTab evalState="idle" onStartEvaluation={mockOnStartEvaluation} hasEvaluated={true} />
      )

      expect(screen.getByText('评测结果')).toBeInTheDocument()
      expect(screen.queryByText('开始评测')).not.toBeInTheDocument()
    })

    it('应从 loading 转换到 success', () => {
      const { rerender } = render(
        <EvalTab
          evalState="loading"
          onStartEvaluation={mockOnStartEvaluation}
          hasEvaluated={false}
        />
      )

      expect(screen.getByText('正在进行评测，请耐心等待...')).toBeInTheDocument()

      rerender(
        <EvalTab
          evalState="success"
          onStartEvaluation={mockOnStartEvaluation}
          hasEvaluated={true}
        />
      )

      expect(screen.getByText('评测结果')).toBeInTheDocument()
      expect(screen.queryByText('正在进行评测，请耐心等待...')).not.toBeInTheDocument()
    })

    it('应从 loading 转换到 error', () => {
      const { rerender } = render(
        <EvalTab
          evalState="loading"
          onStartEvaluation={mockOnStartEvaluation}
          hasEvaluated={false}
        />
      )

      expect(screen.getByText('正在进行评测，请耐心等待...')).toBeInTheDocument()

      rerender(
        <EvalTab evalState="error" onStartEvaluation={mockOnStartEvaluation} hasEvaluated={true} />
      )

      expect(screen.getByText('评测结果')).toBeInTheDocument()
      expect(screen.queryByText('正在进行评测，请耐心等待...')).not.toBeInTheDocument()
    })
  })

  describe('边界情况', () => {
    it('应处理 idle 状态但 hasEvaluated 为 true 的情况', () => {
      render(
        <EvalTab evalState="idle" onStartEvaluation={mockOnStartEvaluation} hasEvaluated={true} />
      )

      expect(screen.getByText('评测结果')).toBeInTheDocument()
      expect(screen.queryByText('开始评测')).not.toBeInTheDocument()
    })

    it('应处理多次状态切换', () => {
      const { rerender } = render(
        <EvalTab evalState="idle" onStartEvaluation={mockOnStartEvaluation} hasEvaluated={false} />
      )

      // idle -> loading
      rerender(
        <EvalTab
          evalState="loading"
          onStartEvaluation={mockOnStartEvaluation}
          hasEvaluated={false}
        />
      )
      expect(screen.getByText('正在进行评测，请耐心等待...')).toBeInTheDocument()

      // loading -> success
      rerender(
        <EvalTab
          evalState="success"
          onStartEvaluation={mockOnStartEvaluation}
          hasEvaluated={true}
        />
      )
      expect(screen.getByText('评测结果')).toBeInTheDocument()

      // success -> loading
      rerender(
        <EvalTab
          evalState="loading"
          onStartEvaluation={mockOnStartEvaluation}
          hasEvaluated={true}
        />
      )
      expect(screen.getByText('正在进行评测，请耐心等待...')).toBeInTheDocument()

      // loading -> error
      rerender(
        <EvalTab evalState="error" onStartEvaluation={mockOnStartEvaluation} hasEvaluated={true} />
      )
      expect(screen.getByText('评测结果')).toBeInTheDocument()
    })
  })

  describe('所有评测状态覆盖', () => {
    const allStates: EvalStatus[] = ['idle', 'loading', 'done']

    allStates.forEach((state) => {
      it(`应正确处理状态 ${state}`, () => {
        const hasEvaluated = state !== 'idle'
        render(
          <EvalTab
            evalState={state}
            onStartEvaluation={mockOnStartEvaluation}
            hasEvaluated={hasEvaluated}
          />
        )

        expect(document.body).toBeInTheDocument()
      })
    })
  })

  describe('回调函数', () => {
    it('应在不同状态下正确传递 onStartEvaluation', async () => {
      const user = userEvent.setup()

      const { rerender } = render(
        <EvalTab evalState="idle" onStartEvaluation={mockOnStartEvaluation} hasEvaluated={false} />
      )

      await user.click(screen.getByText('开始评测'))
      expect(mockOnStartEvaluation).toHaveBeenCalledTimes(1)

      rerender(
        <EvalTab
          evalState="success"
          onStartEvaluation={mockOnStartEvaluation}
          hasEvaluated={true}
        />
      )

      await user.click(screen.getByText('重新评测'))
      expect(mockOnStartEvaluation).toHaveBeenCalledTimes(2)
    })

    it('应能处理不同的 onStartEvaluation 函数', async () => {
      const user = userEvent.setup()
      const firstCallback = vi.fn()
      const secondCallback = vi.fn()

      const { rerender } = render(
        <EvalTab evalState="idle" onStartEvaluation={firstCallback} hasEvaluated={false} />
      )

      await user.click(screen.getByText('开始评测'))
      expect(firstCallback).toHaveBeenCalledTimes(1)
      expect(secondCallback).not.toHaveBeenCalled()

      rerender(<EvalTab evalState="idle" onStartEvaluation={secondCallback} hasEvaluated={false} />)

      await user.click(screen.getByText('开始评测'))
      expect(firstCallback).toHaveBeenCalledTimes(1)
      expect(secondCallback).toHaveBeenCalledTimes(1)
    })
  })
})

