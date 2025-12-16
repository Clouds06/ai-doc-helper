import { describe, test, expect, beforeEach } from 'bun:test'
import { render } from '@testing-library/react'
import { CollapsibleSampleRow } from '../CollapsibleSampleRow'
import type { EvalSample } from '@/types'

describe('CollapsibleSampleRow', () => {
  let mockSample: EvalSample

  beforeEach(() => {
    mockSample = {
      question: '测试问题',
      answer: '测试答案',
      reference: '参考答案',
      metrics: {
        faithfulness: 0.85,
        answer_relevancy: 0.92,
        context_recall: 0.78,
        context_precision: 0.88
      },
      reasoning: {
        faithfulness: '理由1',
        answer_relevancy: '理由2',
        context_recall: '理由3',
        context_precision: '理由4'
      }
    }
  })

  describe('折叠状态', () => {
    test('应默认显示折叠的行', () => {
      const { container } = render(<CollapsibleSampleRow sample={mockSample} index={0} />)

      expect(container.textContent).toContain('测试问题')
      expect(container.querySelector('.group.rounded-xl')).not.toBeNull()
    })

    test('应显示通过状态指示器', () => {
      const { container } = render(<CollapsibleSampleRow sample={mockSample} index={0} />)

      const indicator = container.querySelector('.bg-emerald-500')
      expect(indicator).not.toBeNull()
    })

    test('应显示失败状态指示器', () => {
      const failSample = {
        ...mockSample,
        metrics: {
          faithfulness: 0.5,
          answer_relevancy: 0.6,
          context_recall: 0.7,
          context_precision: 0.8
        }
      }

      const { container } = render(<CollapsibleSampleRow sample={failSample} index={0} />)

      const indicator = container.querySelector('.bg-red-500')
      expect(indicator).not.toBeNull()
    })

    test('应显示问题文本', () => {
      const { container } = render(<CollapsibleSampleRow sample={mockSample} index={0} />)

      const questionElement = container.querySelector('h3')
      expect(questionElement?.textContent).toBe('测试问题')
    })

    test('应显示展开箭头', () => {
      const { container } = render(<CollapsibleSampleRow sample={mockSample} index={0} />)

      // 检查箭头图标容器
      const chevronContainer = container.querySelector('.shrink-0.text-gray-300')
      expect(chevronContainer).not.toBeNull()

      // 或检查是否有 svg 元素（图标会渲染为 svg）
      const icon = container.querySelector('svg')
      expect(icon).not.toBeNull()
    })
  })

  describe('行交互', () => {
    test('应该是可点击的', () => {
      const { container } = render(<CollapsibleSampleRow sample={mockSample} index={0} />)

      const row = container.querySelector('.cursor-pointer')
      expect(row).not.toBeNull()
    })

    test('应有点击区域样式', () => {
      const { container } = render(<CollapsibleSampleRow sample={mockSample} index={0} />)

      const clickArea = container.querySelector('.cursor-pointer')
      expect(clickArea?.classList.contains('select-none')).toBe(true)
    })
  })

  describe('数据显示', () => {
    test('应接收并使用样本数据', () => {
      const { container } = render(<CollapsibleSampleRow sample={mockSample} index={0} />)

      // 验证问题在折叠视图中显示
      expect(container.textContent).toContain('测试问题')
    })

    test('应处理空参考答案', () => {
      const emptySample = {
        ...mockSample,
        reference: ''
      }

      const { container } = render(<CollapsibleSampleRow sample={emptySample} index={0} />)

      expect(container).not.toBeNull()
    })
  })

  describe('上下文处理', () => {
    test('应接收上下文数据', () => {
      const { container } = render(<CollapsibleSampleRow sample={mockSample} index={0} />)

      // 组件应成功渲染包含上下文数据的样本
      expect(container.querySelector('.group.rounded-xl')).not.toBeNull()
    })

    test('应处理空上下文数组', () => {
      const emptySample = {
        ...mockSample,
        retrieved_context: [],
        contexts: []
      }

      const { container } = render(<CollapsibleSampleRow sample={emptySample} index={0} />)

      expect(container.querySelector('.group.rounded-xl')).not.toBeNull()
    })
  })

  describe('样式和布局', () => {
    test('应有正确的容器样式', () => {
      const { container } = render(<CollapsibleSampleRow sample={mockSample} index={0} />)

      const row = container.querySelector('.group.rounded-xl')
      expect(row?.classList.contains('border')).toBe(true)
      expect(row?.classList.contains('bg-white')).toBe(true)
    })

    test('应有过渡动画类', () => {
      const { container } = render(<CollapsibleSampleRow sample={mockSample} index={0} />)

      const row = container.querySelector('.group.rounded-xl')
      expect(row?.classList.contains('transition-all')).toBe(true)
    })

    test('应有圆角样式', () => {
      const { container } = render(<CollapsibleSampleRow sample={mockSample} index={0} />)

      const row = container.querySelector('.rounded-xl')
      expect(row).not.toBeNull()
    })
  })

  describe('无指标情况', () => {
    test('应处理无指标的样本', () => {
      const noMetricsSample = {
        ...mockSample,
        metrics: undefined
      } as any

      const { container } = render(<CollapsibleSampleRow sample={noMetricsSample} index={0} />)

      expect(container.querySelector('.group.rounded-xl')).not.toBeNull()
    })

    test('无指标时应有默认状态', () => {
      const noMetricsSample = {
        ...mockSample,
        metrics: undefined
      } as any

      const { container } = render(<CollapsibleSampleRow sample={noMetricsSample} index={0} />)

      expect(container).not.toBeNull()
    })
  })

  describe('边界情况', () => {
    test('应处理长问题文本', () => {
      const longSample = {
        ...mockSample,
        question: '这是一个非常长的问题文本'.repeat(10)
      }

      const { container } = render(<CollapsibleSampleRow sample={longSample} index={0} />)

      const questionElement = container.querySelector('h3')
      expect(questionElement?.classList.contains('truncate')).toBe(true)
    })

    test('应处理空问题', () => {
      const emptySample = {
        ...mockSample,
        question: ''
      }

      const { container } = render(<CollapsibleSampleRow sample={emptySample} index={0} />)

      expect(container.querySelector('.group.rounded-xl')).not.toBeNull()
    })

    test('应处理特殊字符', () => {
      const specialSample = {
        ...mockSample,
        question: '<script>alert("xss")</script>',
        answer: '答案 & 符号'
      }

      const { container } = render(<CollapsibleSampleRow sample={specialSample} index={0} />)

      expect(container.textContent).toContain('alert')
    })
  })
})

