import React, { useState, useRef, useEffect, useMemo } from 'react'
import { ChevronDown, Save, Trash2, FilePlus2, AlignLeft, Eraser } from 'lucide-react'
import { createPortal } from 'react-dom'
import { PROMPT_PRESETS } from '../../lib/constants'
import { Tooltip } from '../common/Tooltip'
import { isNameExist } from '@/lib/utils'

const CUSTOM_STORAGE_KEY = 'rag_custom_prompts_v1'

type PromptTemplate = {
  id: string
  label: string
  desc?: string
  content: string
  kind: 'preset' | 'custom'
}

interface PromptPanelProps {
  value: string
  onChange: (v: string) => void
}

function DropdownPortal({
  anchorRef,
  children
}: {
  anchorRef: React.RefObject<HTMLButtonElement | null>
  children: React.ReactNode
}) {
  const [style, setStyle] = useState({ top: 0, left: 0, width: 0 })

  useEffect(() => {
    if (!anchorRef.current) return

    const rect = anchorRef.current.getBoundingClientRect()
    setStyle({
      top: rect.bottom + window.scrollY + 6,
      left: rect.left + window.scrollX,
      width: rect.width
    })
  }, [anchorRef])

  return createPortal(
    <div
      style={{
        position: 'absolute',
        top: style.top,
        left: style.left,
        width: style.width,
        zIndex: 999999
      }}
    >
      {children}
    </div>,
    document.body
  )
}

const PromptPanel: React.FC<PromptPanelProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownBtnRef = useRef<HTMLButtonElement | null>(null)
  const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(null)

  // 保存为新模版弹窗
  const [isNameModalOpen, setIsNameModalOpen] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [nameError, setNameError] = useState('')

  const presetTemplates: PromptTemplate[] = PROMPT_PRESETS.map((p) => ({
    ...p,
    kind: 'preset' as const
  }))

  // 自定义模板
  const [customTemplates, setCustomTemplates] = useState<PromptTemplate[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const raw = localStorage.getItem(CUSTOM_STORAGE_KEY)
      if (!raw) return []
      const arr = JSON.parse(raw)
      return arr.map((p: any) => ({
        id: p.id,
        label: p.label,
        desc: p.desc ?? '',
        content: p.content ?? '',
        kind: 'custom' as const
      }))
    } catch {
      return []
    }
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem(
      CUSTOM_STORAGE_KEY,
      JSON.stringify(
        customTemplates.map((c) => ({
          id: c.id,
          label: c.label,
          desc: c.desc,
          content: c.content
        }))
      )
    )
  }, [customTemplates])

  const allTemplates = useMemo(
    () => [...customTemplates, ...presetTemplates],
    [customTemplates, presetTemplates]
  )

  // 自动匹配模版
  useEffect(() => {
    const matched = allTemplates.find((tpl) => tpl.content === value)
    if (matched) {
      setCurrentTemplateId(matched.id)
    }
  }, [value, allTemplates])

  const selectedTemplate = useMemo(
    () => allTemplates.find((tpl) => tpl.id === currentTemplateId) ?? null,
    [allTemplates, currentTemplateId]
  )
  const isCurrentCustom = selectedTemplate?.kind === 'custom'
  const hasUnsavedChanges =
    isCurrentCustom && selectedTemplate && selectedTemplate.content !== value

  // 选择模板
  const handleSelect = (tpl: PromptTemplate) => {
    onChange(tpl.content)
    setCurrentTemplateId(tpl.id)
    setIsOpen(false)
  }

  // 打开“保存为新模版”弹窗
  const handleSaveAsNew = () => {
    const trimmedContent = value.trim()
    if (!trimmedContent) {
      setNameError('当前内容为空，无法保存为模版')
      setIsNameModalOpen(true)
      return
    }
    setIsOpen(false)
    setNameInput('')
    setNameError('')
    setIsNameModalOpen(true)
  }

  // 确认保存为新模版
  const handleConfirmSaveNew = () => {
    const trimmedName = nameInput.trim()
    const trimmedContent = value.trim()

    if (!trimmedContent) {
      setNameError('当前内容为空，无法保存为模版')
      return
    }
    if (!trimmedName) {
      setNameError('模版名称不能为空')
      return
    }

    // 重名校验
    const allNames = [...customTemplates, ...presetTemplates].map((tpl) => tpl.label.trim())
    if (isNameExist(trimmedName, allNames)) {
      setNameError('已存在同名模版，请换一个名字')
      return
    }

    const newTpl: PromptTemplate = {
      id: `custom_${Date.now()}`,
      label: trimmedName,
      desc: '',
      content: trimmedContent,
      kind: 'custom'
    }

    setCustomTemplates((prev) => [newTpl, ...prev])
    setCurrentTemplateId(newTpl.id)
    setIsNameModalOpen(false)
  }

  const handleSaveChanges = () => {
    if (!isCurrentCustom || !selectedTemplate) return
    setCustomTemplates((prev) =>
      prev.map((tpl) => (tpl.id === selectedTemplate.id ? { ...tpl, content: value } : tpl))
    )
  }

  const handleDeleteCurrent = () => {
    if (!isCurrentCustom || !selectedTemplate) return
    if (!window.confirm('确定删除当前自定义模版吗？')) return

    setCustomTemplates((prev) => prev.filter((t) => t.id !== selectedTemplate.id))
    onChange('')
  }

  return (
    <div className="relative flex flex-col gap-3">
      {/* 顶部栏 */}
      <div className="mt-1 mb-1 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>选择 / 管理提示词模版</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Dropdown 按钮 */}
          <button
            ref={dropdownBtnRef}
            type="button"
            onClick={() => setIsOpen((v) => !v)}
            className="inline-flex min-w-[180px] items-center justify-between gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-indigo-300 hover:text-indigo-600"
          >
            <span className="truncate">
              {selectedTemplate
                ? selectedTemplate.kind === 'preset'
                  ? `预设 · ${selectedTemplate.label}`
                  : selectedTemplate.label
                : '自定义（未保存）'}
            </span>

            <div className="flex items-center gap-1">
              {hasUnsavedChanges && <span className="text-[10px] text-amber-500">已修改</span>}
              <ChevronDown
                className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              />
            </div>
          </button>

          {/* 保存新模版 */}
          <button
            type="button"
            onClick={handleSaveAsNew}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-indigo-300 hover:text-indigo-600"
          >
            <FilePlus2 className="h-3.5 w-3.5" />
            保存为新模版
          </button>

          {/* 编辑/删除 */}
          {isCurrentCustom && (
            <>
              <button
                disabled={!hasUnsavedChanges}
                onClick={handleSaveChanges}
                className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium ${
                  hasUnsavedChanges
                    ? 'border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                    : 'cursor-not-allowed border border-gray-200 bg-gray-50 text-gray-400'
                }`}
              >
                <Save className="h-3.5 w-3.5" />
                <span className="hidden sm:inline" />
              </button>

              <button
                onClick={handleDeleteCurrent}
                className="flex items-center gap-1 rounded-lg border border-red-100 bg-red-50 px-2 py-1.5 text-[11px] text-red-600 hover:bg-red-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline" />
              </button>
            </>
          )}
        </div>
      </div>

      {isOpen && dropdownBtnRef.current && (
        <DropdownPortal anchorRef={dropdownBtnRef}>
          <div className="max-h-72 overflow-y-auto rounded-xl border border-gray-100 bg-white p-1.5 shadow-xl">
            {customTemplates.length > 0 && (
              <div className="mb-2">
                <div className="px-2 py-1 text-[10px] font-bold text-gray-400">自定义模版</div>
                {customTemplates.map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => handleSelect(tpl)}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left ${
                      tpl.content === value ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="truncate text-xs font-medium">{tpl.label}</span>
                    {tpl.desc && <Tooltip text={tpl.desc} />}
                  </button>
                ))}
                <div className="my-1 h-px bg-gray-100" />
              </div>
            )}

            {/* 预设 */}
            <div>
              <div className="px-2 py-1 text-[10px] font-bold text-gray-400">预设模版</div>
              {presetTemplates.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => handleSelect(tpl)}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left ${
                    tpl.content === value ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50'
                  }`}
                >
                  <span className="truncate text-xs font-medium text-gray-800">{tpl.label}</span>
                  {tpl.desc && <Tooltip text={tpl.desc} />}
                </button>
              ))}
            </div>
          </div>
        </DropdownPortal>
      )}

      {/* 文本编辑框 */}
      <div className="relative rounded-xl border border-gray-200">
        <textarea
          className="min-h-[140px] w-full resize-none bg-transparent p-4 text-sm leading-relaxed text-gray-700 focus:outline-none"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="在此输入自定义的系统提示词..."
        />

        {/* 底部工具栏 */}
        <div className="absolute right-3 bottom-2 flex items-center gap-2">
          {value && (
            <button
              onClick={() => {
                onChange('')
                setCurrentTemplateId(null)
              }}
              className="flex items-center gap-1 rounded-full bg-white/80 px-2 py-1 text-[10px] text-gray-400 hover:text-red-500"
            >
              <Eraser className="h-3 w-3" />
              清空
            </button>
          )}

          <div className="hidden items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-[10px] text-gray-500 sm:flex">
            <AlignLeft className="h-3 w-3" />
            {value.length} chars
          </div>
        </div>
      </div>

      {isNameModalOpen && (
        <div className="fixed inset-0 z-120 flex items-center justify-center bg-slate-900/40">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl">
            <h3 className="text-sm font-semibold text-gray-900">保存为新模版</h3>
            <p className="mt-1 text-xs text-gray-500">为当前模板命名（请勿重名）</p>

            <input
              className="mt-4 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
              placeholder="例如：法律问答"
              value={nameInput}
              onChange={(e) => {
                setNameInput(e.target.value)
                setNameError('')
              }}
            />

            {nameError && <p className="mt-2 text-xs text-red-500">{nameError}</p>}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsNameModalOpen(false)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmSaveNew}
                className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs text-white shadow-sm hover:bg-indigo-700"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PromptPanel

