import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import { render } from '@testing-library/react'
import { GlobalRegistrator } from '@happy-dom/global-registrator'
import { CollapsedScoreSummary } from '../CollapesScoreSummary'
import type { RagasMetrics } from '@/types'

describe('CollapsedScoreSummary', () => {
  beforeEach(() => {
    GlobalRegistrator.register()
  })

  afterEach(() => {
    GlobalRegistrator.unregister()
  })

  describe('基本渲染', () => {
    test('应正确渲染所有指标', () => {
      const metrics: RagasMetrics = {
        faithfulness: 0.85,
        answer_relevancy: 0.92,
        context_recall: 0.78,
        context_precision: 0.88
      }

      const { container } = render(<CollapsedScoreSummary metrics={metrics} />)

      expect(container.textContent).toContain('85')
      expect(container.textContent).toContain('92')
      expect(container.textContent).toContain('78')
      expect(container.textContent).toContain('88')
    })

    test('应显示分隔符', () => {
      const metrics: RagasMetrics = {
        faithfulness: 0.85,
        answer_relevancy: 0.92,
        context_recall: 0.78,
        context_precision: 0.88
      }

      const { container } = render(<CollapsedScoreSummary metrics={metrics} />)

      const separators = container.querySelectorAll('.text-gray-300')
      expect(separators.length).toBe(3)
    })
  })

  describe('颜色指示', () => {
    test('低分应显示红色 (< 60)', () => {
      const metrics: RagasMetrics = {
        faithfulness: 0.5,
        answer_relevancy: 0.92,
        context_recall: 0.78,
        context_precision: 0.88
      }

      const { container } = render(<CollapsedScoreSummary metrics={metrics} />)

      const redText = container.querySelector('.text-red-600')
      expect(redText).not.toBeNull()
      expect(redText?.textContent).toBe('50')
    })

    test('中等分数应显示琥珀色 (60-79)', () => {
      const metrics: RagasMetrics = {
        faithfulness: 0.75,
        answer_relevancy: 0.65,
        context_recall: 0.92,
        context_precision: 0.88
      }

      const { container } = render(<CollapsedScoreSummary metrics={metrics} />)

      const amberTexts = container.querySelectorAll('.text-amber-600')
      expect(amberTexts.length).toBe(2)
    })

    test('高分应显示绿色 (≥ 80)', () => {
      const metrics: RagasMetrics = {
        faithfulness: 0.85,
        answer_relevancy: 0.92,
        context_recall: 0.88,
        context_precision: 0.95
      }

      const { container } = render(<CollapsedScoreSummary metrics={metrics} />)

      const greenTexts = container.querySelectorAll('.text-emerald-600')
      expect(greenTexts.length).toBe(4)
    })
  })

  describe('边界值处理', () => {
    test('应处理 0 值', () => {
      const metrics: RagasMetrics = {
        faithfulness: 0,
        answer_relevancy: 0,
        context_recall: 0,
        context_precision: 0
      }

      const { container } = render(<CollapsedScoreSummary metrics={metrics} />)

      expect(container.textContent).toContain('0')
      const redTexts = container.querySelectorAll('.text-red-600')
      expect(redTexts.length).toBe(4)
    })

    test('应处理 1 值', () => {
      const metrics: RagasMetrics = {
        faithfulness: 1,
        answer_relevancy: 1,
        context_recall: 1,
        context_precision: 1
      }

      const { container } = render(<CollapsedScoreSummary metrics={metrics} />)

      expect(container.textContent).toContain('100')
      const greenTexts = container.querySelectorAll('.text-emerald-600')
      expect(greenTexts.length).toBe(4)
    })

    test('应处理临界值 0.6', () => {
      const metrics: RagasMetrics = {
        faithfulness: 0.6,
        answer_relevancy: 0.6,
        context_recall: 0.6,
        context_precision: 0.6
      }

      const { container } = render(<CollapsedScoreSummary metrics={metrics} />)

      expect(container.textContent).toContain('60')
      const amberTexts = container.querySelectorAll('.text-amber-600')
      expect(amberTexts.length).toBe(4)
    })

    test('应处理临界值 0.8', () => {
      const metrics: RagasMetrics = {
        faithfulness: 0.8,
        answer_relevancy: 0.8,
        context_recall: 0.8,
        context_precision: 0.8
      }

      const { container } = render(<CollapsedScoreSummary metrics={metrics} />)

      expect(container.textContent).toContain('80')
      const greenTexts = container.querySelectorAll('.text-emerald-600')
      expect(greenTexts.length).toBe(4)
    })
  })

  describe('缺失值处理', () => {
    test('应显示 - 当指标为 undefined', () => {
      const metrics: RagasMetrics = {
        faithfulness: undefined,
        answer_relevancy: 0.85,
        context_recall: undefined,
        context_precision: 0.75
      }

      const { container } = render(<CollapsedScoreSummary metrics={metrics} />)

      const dashElements = Array.from(container.querySelectorAll('.text-gray-600')).filter(
        (el) => el.textContent === '-'
      )
      expect(dashElements.length).toBe(2)
    })

    test('应显示 - 当指标为 null', () => {
      const metrics: RagasMetrics = {
        faithfulness: null as any,
        answer_relevancy: null as any,
        context_recall: null as any,
        context_precision: null as any
      }

      const { container } = render(<CollapsedScoreSummary metrics={metrics} />)

      const dashElements = Array.from(container.querySelectorAll('.text-gray-600')).filter(
        (el) => el.textContent === '-'
      )
      expect(dashElements.length).toBe(4)
    })

    test('应混合显示数值和缺失标记', () => {
      const metrics: RagasMetrics = {
        faithfulness: 0.85,
        answer_relevancy: undefined,
        context_recall: 0.65,
        context_precision: undefined
      }

      const { container } = render(<CollapsedScoreSummary metrics={metrics} />)

      expect(container.textContent).toContain('85')
      expect(container.textContent).toContain('65')
      const dashElements = Array.from(container.querySelectorAll('.text-gray-600')).filter(
        (el) => el.textContent === '-'
      )
      expect(dashElements.length).toBe(2)
    })
  })

  describe('样式', () => {
    test('应有正确的容器样式', () => {
      const metrics: RagasMetrics = {
        faithfulness: 0.85,
        answer_relevancy: 0.92,
        context_recall: 0.78,
        context_precision: 0.88
      }

      const { container } = render(<CollapsedScoreSummary metrics={metrics} />)

      const wrapper = container.querySelector('.bg-gray-50\\/80')
      expect(wrapper).not.toBeNull()
      expect(wrapper?.classList.contains('rounded')).toBe(true)
      expect(wrapper?.classList.contains('border')).toBe(true)
    })

    test('应使用等宽字体', () => {
      const metrics: RagasMetrics = {
        faithfulness: 0.85,
        answer_relevancy: 0.92,
        context_recall: 0.78,
        context_precision: 0.88
      }

      const { container } = render(<CollapsedScoreSummary metrics={metrics} />)

      const wrapper = container.querySelector('.font-mono')
      expect(wrapper).not.toBeNull()
    })

    test('数值应固定宽度居中', () => {
      const metrics: RagasMetrics = {
        faithfulness: 0.85,
        answer_relevancy: 0.92,
        context_recall: 0.78,
        context_precision: 0.88
      }

      const { container } = render(<CollapsedScoreSummary metrics={metrics} />)

      const values = container.querySelectorAll('.w-7.text-center')
      expect(values.length).toBe(4)
    })
  })

  describe('指标顺序', () => {
    test('应按 METRIC_ORDER 顺序显示', () => {
      const metrics: RagasMetrics = {
        faithfulness: 0.1,
        answer_relevancy: 0.2,
        context_recall: 0.3,
        context_precision: 0.4
      }

      const { container } = render(<CollapsedScoreSummary metrics={metrics} />)

      const values = Array.from(container.querySelectorAll('.w-7'))
      const texts = values.map((el) => el.textContent)

      expect(texts[0]).toBe('10') // faithfulness
      expect(texts[1]).toBe('20') // answer_relevancy
      expect(texts[2]).toBe('30') // context_recall
      expect(texts[3]).toBe('40') // context_precision
    })
  })
})

