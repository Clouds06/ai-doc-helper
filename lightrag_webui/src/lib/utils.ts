import { RagasMetricKey, RagasMetrics } from '@/types'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { StoreApi, UseBoundStore } from 'zustand'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function randomColor() {
  const digits = '0123456789abcdef'
  let code = '#'
  for (let i = 0; i < 6; i++) {
    code += digits.charAt(Math.floor(Math.random() * 16))
  }
  return code
}

export function errorMessage(error: any) {
  return error instanceof Error ? error.message : `${error}`
}

/**
 * Creates a throttled function that limits how often the original function can be called
 * @param fn The function to throttle
 * @param delay The delay in milliseconds
 * @returns A throttled version of the function
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now()
    const remaining = delay - (now - lastCall)

    if (remaining <= 0) {
      // If enough time has passed, execute the function immediately
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      lastCall = now
      fn.apply(this, args)
    } else if (!timeoutId) {
      // If not enough time has passed, set a timeout to execute after the remaining time
      timeoutId = setTimeout(() => {
        lastCall = Date.now()
        timeoutId = null
        fn.apply(this, args)
      }, remaining)
    }
  }
}

type WithSelectors<S> = S extends { getState: () => infer T }
  ? S & { use: { [K in keyof T]: () => T[K] } }
  : never

export const createSelectors = <S extends UseBoundStore<StoreApi<object>>>(_store: S) => {
  const store = _store as WithSelectors<typeof _store>
  store.use = {}
  for (const k of Object.keys(store.getState())) {
    ;(store.use as any)[k] = () => store((s) => s[k as keyof typeof s])
  }

  return store
}

// prompt
export const sanitizeQuery = (raw: string) => {
  if (!raw) return ''

  // 基础规范化
  let s = String(raw)
  s = s.replace(/\r\n?/g, '\n') // 统一换行
  // eslint-disable-next-line no-control-regex
  s = s.replace(/[\x00-\x1F\x7F-\x9F]/g, '') // 移除不可见控制字符

  // 移除代码块和行内代码
  s = s.replace(/```[\s\S]*?```/g, '') // 多行代码块
  s = s.replace(/`[^`]*`/g, '') // 行内代码

  // 常见 prompt 注入短语（中英）及其后续内容，尽量在发现时删除该短语
  const injectionPatterns = [
    /ignore (all )?(previous )?instructions[\s\S]*/gi,
    /disregard (all )?(previous )?instructions[\s\S]*/gi,
    /forget (all )?(previous )?instructions[\s\S]*/gi,
    /do not follow (previous )?instructions[\s\S]*/gi,
    /don't follow (previous )?instructions[\s\S]*/gi,
    /forget everything before this[\s\S]*/gi,
    /ignore (this )?and (all )?previous instructions[\s\S]*/gi,
    /from now on,? ignore (all )?previous instructions[\s\S]*/gi,
    /忽略.*之前.*指示[\s\S]*/gi,
    /忘记.*之前.*指示[\s\S]*/gi,
    /忽略.*之前.*指令[\s\S]*/gi,
    /从现在起.*不要.*遵循.*之前/gi,
    /不要遵循之前的指示[\s\S]*/gi,
    /只回答.*$/gim, // "只回答..." 这类限定性指令移除
    /按照下面.*要求.*回答[\s\S]*/gi
  ]

  for (const p of injectionPatterns) {
    s = s.replace(p, '')
  }

  // 在常见分隔符或角色标注处截断，防止后续隐藏指令影响
  const separators = [
    '###',
    '---',
    '***',
    '===',
    'System:',
    'Assistant:',
    'User:',
    'USER:',
    'SYSTEM:',
    'ASSISTANT:',
    'INSTRUCTIONS:',
    'OUTPUT:',
    '指示：',
    '系统：',
    '助手：',
    '用户：'
  ]
  let cutIndex = -1
  for (const sep of separators) {
    const idx = s.indexOf(sep)
    if (idx !== -1) {
      if (cutIndex === -1 || idx < cutIndex) cutIndex = idx
    }
  }
  if (cutIndex !== -1) {
    s = s.slice(0, cutIndex)
  }

  // 移除多余的空行/空白，限制长度
  s = s
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()

  const MAX_LEN = 500
  if (s.length > MAX_LEN) s = s.slice(0, MAX_LEN).trim()

  return s
}

// 将 0-1 小数转为百分比，保留一位小数
export const toPercent = (v?: number) => (typeof v === 'number' ? Math.round(v * 1000) / 10 : null)

// TODO 修改通过的样例标准
// 目前未faithfulness >= 0.7 && answer_relevance >= 0.8
export const getSampleStatus = (metrics: RagasMetrics): 'pass' | 'fail' => {
  const aa = metrics.faithfulness ?? 0
  const rg = metrics.answer_relevancy ?? 0
  return aa >= 0.7 && rg >= 0.8 ? 'pass' : 'fail'
}

// 根据温度值和 chunkTopK 值，返回对应的标签文本和颜色样式
export const getTempLabel = (val: number) => {
  if (val <= 0.3) return { text: '严谨精确', color: 'bg-blue-100 text-blue-700' }
  if (val <= 0.7) return { text: '平衡标准', color: 'bg-green-100 text-green-700' }
  return { text: '发散创意', color: 'bg-purple-100 text-purple-700' }
}
export const getChunkLabel = (val: number) => {
  if (val < 10) return { text: '极速模式', color: 'bg-yellow-100 text-yellow-700' }
  if (val <= 30) return { text: '平衡模式', color: 'bg-blue-100 text-blue-700' }
  return { text: '高召回模式', color: 'bg-indigo-100 text-indigo-700' }
}

export function isNameExist(name: string, names: string[]) {
  return names.includes(name)
}

// 格式化文件大小为 B/KB/MB/GB
export const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

// 格式化评测指标为百分比数值
export const formatMetrics = (metrics?: Partial<Record<RagasMetricKey, number>>) => {
  return {
    faithfulness: metrics ? Math.round((metrics.faithfulness ?? 0) * 100) : 0,
    answer_relevancy: metrics ? Math.round((metrics.answer_relevancy ?? 0) * 100) : 0,
    context_recall: metrics ? Math.round((metrics.context_recall ?? 0) * 100) : 0,
    context_precision: metrics ? Math.round((metrics.context_precision ?? 0) * 100) : 0
  }
}

// 从文本中提取参考文献块
export function extractRefsFromText(raw: string) {
  if (!raw) return { main: raw, refs: {} as Record<string, string> }

  const headingRegex = /(^|\n)#{1,6}\s*(?:references?|参考文献|参考资料)\s*(?:\n|$)/i
  let refsStartIdx = raw.search(headingRegex)
  if (refsStartIdx === -1) {
    const alt = raw.search(/(^|\n)(?:references?|参考文献|参考资料):?\s*(?:\n|$)/i)
    if (alt !== -1) refsStartIdx = alt
  }

  const refs: Record<string, string> = {}
  if (refsStartIdx !== -1) {
    const refsText = raw.slice(refsStartIdx)
    const lines = refsText.split(/\r?\n/)
    for (const line of lines) {
      const m = line.match(/\[?\s*(\d+)\s*\]?\s*(?:[-:)\s]*)?(.+)$/)
      if (m) {
        refs[m[1]] = m[2].trim()
      }
    }
    const main = raw.slice(0, refsStartIdx).trimEnd()
    return { main, refs }
  }

  const lines = raw.split(/\r?\n/)
  let i = lines.length - 1
  const trailing: string[] = []
  while (i >= 0) {
    const l = lines[i].trim()
    if (l === '') {
      i--
      continue
    }
    if (/^[-*]?\s*\[?\d+\]?\s+/.test(l)) {
      trailing.unshift(lines[i])
      i--
      continue
    }
    break
  }
  if (trailing.length > 0) {
    for (const line of trailing) {
      const m = line.match(/\[?\s*(\d+)\s*\]?\s*(?:[-:)\s]*)?(.+)$/)
      if (m) refs[m[1]] = m[2].trim()
    }
    const main = lines
      .slice(0, i + 1)
      .join('\n')
      .trimEnd()
    return { main, refs }
  }

  return { main: raw, refs }
}

// 确保输入为字符串数组
export const ensureArray = (input: any): string[] => {
  if (Array.isArray(input)) return input.map(String)
  if (typeof input === 'string' && input.trim() !== '') return [input]
  return []
}
