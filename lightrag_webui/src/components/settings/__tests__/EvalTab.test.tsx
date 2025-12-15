import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test'
import { GlobalRegistrator } from '@happy-dom/global-registrator'
import { render } from '@testing-library/react'
import { EvalTab } from '../EvalTab'
import type { EvalStatus } from '../../../types/index'

mock.module('@/components/common/EvalButton', () => ({
  EvalButton: ({ onStartEvaluation }: { onStartEvaluation: () => void }) => (
    <button onClick={onStartEvaluation}>开始评测</button>
  )
}))

mock.module('@/components/common/LoadingDisplay', () => ({
  LoadingDisplay: ({ content }: { content: string }) => <div>{content}</div>
}))

mock.module('@/components/common/EvalResultDisplay', () => ({
  EvalResultDisplay: ({ onStartEvaluation }: { onStartEvaluation: () => void }) => (
    <div>
      <div>评测结果</div>
      <button onClick={onStartEvaluation}>重新评测</button>
    </div>
  )
}))

describe('EvalTab', () => {
  let mockOnStartEvaluation: ReturnType<typeof mock>

  beforeEach(() => {
    GlobalRegistrator.register()
    mockOnStartEvaluation = mock()
  })

  afterEach(() => {
    GlobalRegistrator.unregister()
  })

  describe('初始状态（未评测）', () => {
    test('应显示评测按钮', () => {
      const { container } = render(
        <EvalTab evalState="idle" onStartEvaluation={mockOnStartEvaluation} hasEvaluated={false} />
      )
      const button = container.querySelector('button')
      expect(button).not.toBeNull()
      expect(button?.textContent).toBe('开始评测')
    })

    test('点击开始评测会触发回调', async () => {
      const { container } = render(
        <EvalTab evalState="idle" onStartEvaluation={mockOnStartEvaluation} hasEvaluated={false} />
      )

      const button = container.querySelector('button')
      button?.click()
      expect(mockOnStartEvaluation.mock.calls.length).toBe(1)
    })
  })

  describe('加载状态', () => {
    test('显示加载文案', () => {
      const { container } = render(
        <EvalTab
          evalState="loading"
          onStartEvaluation={mockOnStartEvaluation}
          hasEvaluated={false}
        />
      )

      expect(container.textContent).toContain('正在进行评测，请耐心等待...')
    })

    test('加载状态下不显示评测按钮', () => {
      const { container } = render(
        <EvalTab
          evalState="loading"
          onStartEvaluation={mockOnStartEvaluation}
          hasEvaluated={false}
        />
      )

      const button = container.querySelector('button')
      expect(button).toBeNull()
    })
  })

  describe('评测完成状态', () => {
    test('done 状态显示结果', () => {
      const { container } = render(
        <EvalTab evalState="done" onStartEvaluation={mockOnStartEvaluation} hasEvaluated={true} />
      )

      expect(container.textContent).toContain('评测结果')
    })

    test('idle 状态也显示结果', () => {
      const { container } = render(
        <EvalTab evalState="idle" onStartEvaluation={mockOnStartEvaluation} hasEvaluated={true} />
      )

      expect(container.textContent).toContain('评测结果')
    })

    test('可以重新评测', () => {
      const { container } = render(
        <EvalTab evalState="done" onStartEvaluation={mockOnStartEvaluation} hasEvaluated={true} />
      )

      const button = Array.from(container.querySelectorAll('button')).find(
        (b) => b.textContent === '重新评测'
      )
      button?.click()
      expect(mockOnStartEvaluation.mock.calls.length).toBe(1)
    })
  })

  describe('状态转换', () => {
    test('idle -> done', () => {
      const { rerender, container } = render(
        <EvalTab evalState="idle" onStartEvaluation={mockOnStartEvaluation} hasEvaluated={false} />
      )

      rerender(
        <EvalTab evalState="done" onStartEvaluation={mockOnStartEvaluation} hasEvaluated={true} />
      )

      expect(container.textContent).toContain('评测结果')
    })
  })

  describe('所有评测状态覆盖', () => {
    const allStates: EvalStatus[] = ['idle', 'loading', 'done']

    allStates.forEach((state) => {
      test(`状态 ${state} 能正常渲染`, () => {
        render(
          <EvalTab
            evalState={state}
            onStartEvaluation={mockOnStartEvaluation}
            hasEvaluated={state !== 'idle'}
          />
        )

        expect(document.body).not.toBeNull()
      })
    })
  })

  describe('回调函数替换', () => {
    test('切换 onStartEvaluation 后生效', () => {
      const first = mock()
      const second = mock()

      const { rerender, container } = render(
        <EvalTab evalState="idle" onStartEvaluation={first} hasEvaluated={false} />
      )

      let button = container.querySelector('button')
      button?.click()
      expect(first.mock.calls.length).toBe(1)

      rerender(<EvalTab evalState="idle" onStartEvaluation={second} hasEvaluated={false} />)

      button = container.querySelector('button')
      button?.click()
      expect(second.mock.calls.length).toBe(1)
    })
  })
})

