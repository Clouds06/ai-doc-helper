import { RagasMetricKey } from '@/types'
import { Target, BookOpenCheck, SearchCheck, FilterIcon } from 'lucide-react'

export const backendBaseUrl = ''

export const healthCheckInterval = 15 // seconds

export const defaultQueryLabel = '*'

export const supportedFileTypes = {
  'text/plain': ['.txt', '.md'],
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
}

export const DEFAULT_SYSTEM_PROMPT =
  '你是一个专业的 AI 文档助手。请根据用户问题和提供的上下文片段，用简洁、准确的语言回答。'

// RAG评测指标元信息
export const METRIC_ORDER: RagasMetricKey[] = [
  'faithfulness',
  'answer_relevancy',
  'context_recall',
  'context_precision'
]

export const METRIC_META: Record<
  RagasMetricKey,
  {
    label: string
    desc: string
    icon: React.ComponentType<{ className?: string }>
    color: string
  }
> = {
  faithfulness: {
    label: '忠实度',
    desc: '衡量回答是否忠实于原文档，是否避免出现幻觉或错误信息。',
    icon: Target,
    color: 'blue'
  },
  answer_relevancy: {
    label: '相关性',
    desc: '衡量回答是否真正回应了用户问题，是否语义匹配、不跑题。',
    icon: BookOpenCheck,
    color: 'green'
  },
  context_recall: {
    label: '召回率',
    desc: '衡量系统是否找全了与问题相关的文档片段（是否缺少重要证据）。',
    icon: SearchCheck,
    color: 'purple'
  },
  context_precision: {
    label: '精度',
    desc: '衡量检索到的文档片段是否真正相关，是否包含无关噪声。',
    icon: FilterIcon,
    color: 'amber'
  }
}

export const PROMPT_PRESETS = [
  {
    id: 'default',
    label: '默认（推荐）',
    desc: '通用文档助手，适合大部分场景',
    content:
      '你是一个专业的 AI 文档助手。请根据用户问题和提供的上下文片段，用简洁、准确的语言回答。如果上下文没有相关信息，请明确指出，而不是编造答案。'
  },
  {
    id: 'precise',
    label: '精确问答',
    desc: '优先给出确定结论，少发散',
    content:
      '你是一个严谨、克制的专业助手。请优先给出准确、可验证的结论，不要发散。若上下文信息不足，请明确说明“不足以得到可靠结论”，而不是进行猜测。'
  },
  {
    id: 'summary',
    label: '总结归纳',
    desc: '输出更偏总结/提炼',
    content:
      '你擅长对长文本进行总结和提炼。回答时优先给出结构化的要点列表，突出结论和关键细节，避免逐句复述原文。'
  }
]

export const PLACEHOLDER_LOOP_WORDS = [
  '这份财报的重点是什么？',
  '帮我总结一下合同的风险条款。',
  '如何调用用户鉴权 API？请给出示例代码。',
  '查询最新的员工差旅报销合规政策。'
]

