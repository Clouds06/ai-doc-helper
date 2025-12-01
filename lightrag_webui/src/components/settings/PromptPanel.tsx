import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Save, Trash2, FilePlus2, AlignLeft, Eraser } from 'lucide-react';
import { createPortal } from 'react-dom';
import { PROMPT_PRESETS } from '../../lib/constants';
import { Tooltip } from '../common/Tooltip';
import { isNameExist } from '@/lib/utils';

const CUSTOM_STORAGE_KEY = 'rag_custom_prompts_v1';

type PromptTemplate = {
  id: string;
  label: string;
  desc?: string;
  content: string;
  kind: 'preset' | 'custom';
};

interface PromptPanelProps {
  value: string;
  onChange: (v: string) => void;
}

function DropdownPortal({
  anchorRef,
  children,
}: {
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  children: React.ReactNode;
}) {
  const [style, setStyle] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (!anchorRef.current) return;

    const rect = anchorRef.current.getBoundingClientRect();
    setStyle({
      top: rect.bottom + window.scrollY + 6,
      left: rect.left + window.scrollX,
      width: rect.width,
    });
  }, [anchorRef]);

  return createPortal(
    <div
      style={{
        position: 'absolute',
        top: style.top,
        left: style.left,
        width: style.width,
        zIndex: 999999,
      }}
    >
      {children}
    </div>,
    document.body,
  );
}

const PromptPanel: React.FC<PromptPanelProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownBtnRef = useRef<HTMLButtonElement | null>(null);

  // 保存为新模版弹窗
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [nameError, setNameError] = useState('');

  const presetTemplates: PromptTemplate[] = PROMPT_PRESETS.map((p) => ({
    ...p,
    kind: 'preset' as const,
  }));

  // 自定义模板
  const [customTemplates, setCustomTemplates] = useState<PromptTemplate[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(CUSTOM_STORAGE_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return arr.map((p: any) => ({
        id: p.id,
        label: p.label,
        desc: p.desc ?? '',
        content: p.content ?? '',
        kind: 'custom' as const,
      }));
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(
      CUSTOM_STORAGE_KEY,
      JSON.stringify(
        customTemplates.map((c) => ({
          id: c.id,
          label: c.label,
          desc: c.desc,
          content: c.content,
        })),
      ),
    );
  }, [customTemplates]);

  const allTemplates = [...customTemplates, ...presetTemplates];

  // 当前选中模板：通过 content 匹配（custom 优先，因为排在前面）
  const selectedTemplate =
    allTemplates.find((tpl) => tpl.content === value) ?? null;

  const isCurrentCustom = selectedTemplate?.kind === 'custom';
  const hasUnsavedChanges =
    isCurrentCustom &&
    selectedTemplate &&
    selectedTemplate.content !== value;

  // 选择模板
  const handleSelect = (tpl: PromptTemplate) => {
    onChange(tpl.content);
    setIsOpen(false);
  };

  // 打开“保存为新模版”弹窗
  const handleSaveAsNew = () => {
    const trimmedContent = value.trim();
    if (!trimmedContent) {
      setNameError('当前内容为空，无法保存为模版');
      setIsNameModalOpen(true);
      return;
    }
    setIsOpen(false);
    setNameInput('');
    setNameError('');
    setIsNameModalOpen(true);
  };

  // 确认保存为新模版
  const handleConfirmSaveNew = () => {
    const trimmedName = nameInput.trim();
    const trimmedContent = value.trim();

    if (!trimmedContent) {
      setNameError('当前内容为空，无法保存为模版');
      return;
    }
    if (!trimmedName) {
      setNameError('模版名称不能为空');
      return;
    }

    // 重名校验
    const allNames = [...customTemplates, ...presetTemplates].map((tpl) =>
      tpl.label.trim(),
    );
    if(isNameExist(trimmedName, allNames)) {
      setNameError('已存在同名模版，请换一个名字');
      return;
    }

    const newTpl: PromptTemplate = {
      id: `custom_${Date.now()}`,
      label: trimmedName,
      desc: '',
      content: trimmedContent,
      kind: 'custom',
    };

    setCustomTemplates((prev) => [newTpl, ...prev]);
    setIsNameModalOpen(false);
  };

  const handleSaveChanges = () => {
    if (!isCurrentCustom || !selectedTemplate) return;
    setCustomTemplates((prev) =>
      prev.map((tpl) =>
        tpl.id === selectedTemplate.id ? { ...tpl, content: value } : tpl,
      ),
    );
  };

  const handleDeleteCurrent = () => {
    if (!isCurrentCustom || !selectedTemplate) return;
    if (!window.confirm('确定删除当前自定义模版吗？')) return;

    setCustomTemplates((prev) =>
      prev.filter((t) => t.id !== selectedTemplate.id),
    );
    onChange('');
  };

  return (
    <div className="relative flex flex-col gap-3">
      {/* 顶部栏 */}
      <div className="flex items-center justify-between mt-1 mb-1">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>选择 / 管理提示词模版</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Dropdown 按钮 */}
          <button
            ref={dropdownBtnRef}
            type="button"
            onClick={() => setIsOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:border-indigo-300 hover:text-indigo-600 min-w-[180px] justify-between"
          >
            <span className="truncate">
              {selectedTemplate
                ? selectedTemplate.kind === 'preset'
                  ? `预设 · ${selectedTemplate.label}`
                  : selectedTemplate.label
                : '自定义（未保存）'}
            </span>

            <div className="flex items-center gap-1">
              {hasUnsavedChanges && (
                <span className="text-[10px] text-amber-500">已修改</span>
              )}
              <ChevronDown
                className={`w-3 h-3 transition-transform ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </div>
          </button>

          {/* 保存新模版 */}
          <button
            type="button"
            onClick={handleSaveAsNew}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:border-indigo-300 hover:text-indigo-600"
          >
            <FilePlus2 className="w-3.5 h-3.5" />
            保存为新模版
          </button>

          {/* 编辑/删除 */}
          {isCurrentCustom && (
            <>
              <button
                disabled={!hasUnsavedChanges}
                onClick={handleSaveChanges}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 ${
                  hasUnsavedChanges
                    ? 'border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                    : 'border border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Save className="w-3.5 h-3.5" />
                <span className="hidden sm:inline" />
              </button>

              <button
                onClick={handleDeleteCurrent}
                className="px-2 py-1.5 rounded-lg border border-red-100 bg-red-50 text-[11px] text-red-600 flex items-center gap-1 hover:bg-red-100"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline" />
              </button>
            </>
          )}
        </div>
      </div>

      {isOpen && dropdownBtnRef.current && (
        <DropdownPortal anchorRef={dropdownBtnRef}>
          <div className="bg-white rounded-xl border border-gray-100 shadow-xl p-1.5 max-h-72 overflow-y-auto">
            {customTemplates.length > 0 && (
              <div className="mb-2">
                <div className="px-2 py-1 text-[10px] font-bold text-gray-400">
                  自定义模版
                </div>
                {customTemplates.map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => handleSelect(tpl)}
                    className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between ${
                      tpl.content === value
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-xs font-medium truncate">
                      {tpl.label}
                    </span>
                    {tpl.desc && (
                      <Tooltip text={tpl.desc} />
                    )}
                  </button>
                ))}
                <div className="h-px bg-gray-100 my-1" />
              </div>
            )}

            {/* 预设 */}
            <div>
              <div className="px-2 py-1 text-[10px] font-bold text-gray-400">
                预设模版
              </div>
              {presetTemplates.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => handleSelect(tpl)}
                  className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between ${
                    tpl.content === value
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <span className="text-xs font-medium text-gray-800 truncate">
                    {tpl.label}
                  </span>
                  {tpl.desc && <Tooltip text={tpl.desc} />}
                </button>
              ))}
            </div>
          </div>
        </DropdownPortal>
      )}

      {/* 文本编辑框 */}
      <div className="relative border rounded-xl border-gray-200">
        <textarea
          className="w-full min-h-[140px] p-4 text-sm leading-relaxed text-gray-700 bg-transparent resize-none focus:outline-none"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="在此输入自定义的 System Prompt..."
        />

        {/* 底部工具栏 */}
        <div className="absolute bottom-2 right-3 flex items-center gap-2">
          {value && (
            <button
              onClick={() => onChange('')}
              className="px-2 py-1 rounded-full text-[10px] text-gray-400 hover:text-red-500 flex items-center gap-1 bg-white/80"
            >
              <Eraser className="w-3 h-3" />
              清空
            </button>
          )}

          <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-[10px] text-gray-500">
            <AlignLeft className="w-3 h-3" />
            {value.length} chars
          </div>
        </div>
      </div>

      {isNameModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-5">
            <h3 className="text-sm font-semibold text-gray-900">
              保存为新模版
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              给当前提示词模板起一个名称，方便复用。
            </p>

            <input
              className="mt-4 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
              placeholder="例如：法律问答（严谨版）"
              value={nameInput}
              onChange={(e) => {
                setNameInput(e.target.value);
                setNameError('');
              }}
            />

            {nameError && (
              <p className="mt-2 text-xs text-red-500">{nameError}</p>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsNameModalOpen(false)}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmSaveNew}
                className="px-4 py-1.5 text-xs rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptPanel;
