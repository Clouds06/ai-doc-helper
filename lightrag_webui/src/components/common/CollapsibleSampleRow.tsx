import { getSampleStatus } from '@/lib/utils';
import { EvalSample } from '@/types';
import { ChevronDown, Quote, SearchCheck } from 'lucide-react';
import { useState } from 'react';
import { CollapsedScoreSummary } from './CollapesScoreSummary';
import { DetailScoreBadges } from './DetailedScoreBadges';
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'

interface CollapsibleSampleRowProps {
  sample: EvalSample;
  index: number;
};

export const CollapsibleSampleRow = ({
  sample
} : CollapsibleSampleRowProps)=> {
  const status = sample.metrics ? getSampleStatus(sample.metrics) : undefined;
  const isPass = status === 'pass';

  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={`group bg-white rounded-lg border transition-all duration-200 overflow-hidden ${
        isExpanded
          ? 'border-indigo-200 shadow-md ring-1 ring-indigo-50 my-3'
          : 'border-gray-200 hover:border-gray-300 my-1'
      }`}
    >
      {/* 头部 */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-4 py-3 cursor-pointer select-none flex items-center gap-3 transition-colors hover:bg-gray-50/30"
      >
        {/* 状态点 */}
        <div className="flex-shrink-0" title={isPass ? '通过' : '需优化'}>
          {isPass ? (
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm ring-2 ring-emerald-50" />
          ) : (
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm ring-2 ring-red-50" />
          )}
        </div>

        {/* 问题文本 */}
        <div className="flex-1 min-w-0">
          <h3
            className={`text-sm text-gray-700 truncate pr-4 ${
              isExpanded ? 'font-bold text-gray-900' : 'font-medium'
            }`}
          >
            {sample.question}
          </h3>
        </div>

        {/* 右侧：折叠态得分概览 */}
        <div className="flex items-center gap-4">
          {!isExpanded && (
            <div className="hidden sm:flex items-center gap-2 animate-in fade-in duration-300">
              <span className="text-[12px] text-gray-400">得分</span>
              <CollapsedScoreSummary metrics={sample.metrics} />
            </div>
          )}

          <div
            className={`text-gray-400 transition-transform duration-200 ${
              isExpanded ? 'rotate-180 text-indigo-500' : 'group-hover:text-gray-600'
            }`}
          >
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 展开后详情 */}
      {isExpanded && (
        <div className="border-t border-gray-100 bg-white animate-in slide-in-from-top-1 duration-200">
          {/* 详细得分 */}
          <div className="px-4 py-3 bg-gray-50/30 border-b border-gray-50">
            <DetailScoreBadges metrics={sample.metrics} />
          </div>

          {/* 双栏内容 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
            {/* 左侧: 生成对比区 */}
            <div className="lg:col-span-7 p-5 space-y-5">
              {/* AI 回答（Markdown 渲染） */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  模型回答
                </div>
                <div className="bg-blue-50/20 p-3.5 rounded-lg border border-blue-100/50 text-sm text-gray-700 leading-relaxed">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeSanitize]}
                    components={{
                      // code block 样式
                      code({inline, className, children, ...props}: any) {
                        return inline ? (
                          <code className="rounded px-1 py-0.5 bg-gray-100 text-xs" {...props}>{children}</code>
                        ) : (
                          <pre className="rounded-lg overflow-auto bg-gray-900 text-white text-xs p-3" {...props}>
                            <code>{children}</code>
                          </pre>
                        )
                      },
                      a({href, children, ...props}) {
                        return <a href={String(href)} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline" {...props}>{children}</a>
                      },
                      img({src, alt, ...props}) {
                        return <img src={String(src)} alt={String(alt)} className="max-w-full rounded" {...props}/>
                      }
                    }}
                  >
                    {sample.answer ?? ''}
                  </ReactMarkdown>
                </div>
              </div>

              {/* 标注答案（Markdown 渲染） */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                  标注答案
                </div>
                <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200/60 text-sm text-gray-600 leading-relaxed">
                  {sample.reference ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                      {sample.reference}
                    </ReactMarkdown>
                  ) : (
                    <span className="italic text-gray-400">未提供参考答案</span>
                  )}
                </div>
              </div>
            </div>

            {/* 右侧: 检索证据区 */}
            <div className="lg:col-span-5 flex flex-col bg-gray-50/10">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                  <Quote className="w-3.5 h-3.5 text-purple-500 opacity-70" />
                  检索上下文
                </div>
                <span className="text-[12px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded font-mono font-medium">
                  {sample.contexts.length}个文本块
                </span>
              </div>

              <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                {sample.contexts.length > 0 ? (
                  sample.contexts.map((ctx, idx) => (
                    <div
                      key={idx}
                      className="group relative pl-3 py-1 transition-all"
                    >
                      <div className="absolute left-0 top-2 w-0.5 h-full bg-gray-200 group-hover:bg-purple-300 transition-colors rounded-full" />
                      <div className="text-[9px] text-gray-400 mb-0.5 font-mono">
                        文本块 #{idx + 1}
                      </div>
                      <div className="text-sm text-gray-600 leading-relaxed break-words opacity-90 group-hover:text-gray-900">
                        {ctx}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                    <SearchCheck className="w-8 h-8 mb-2 opacity-10" />
                    <span className="text-[12px]">无相关片段</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
