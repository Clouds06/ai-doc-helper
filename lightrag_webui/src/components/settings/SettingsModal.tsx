import React, { useState } from 'react';
import { Settings, X, Zap, Target, Bot, CheckCircle2, Quote, Loader2, Play, AlertCircle, XCircle, Save } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const [activeTab, setActiveTab] = useState<'params' | 'eval'>('params');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<any>(null);
  const [temperature, setTemperature] = useState(0.7);
  const [topP, setTopP] = useState(0.9);
  const [systemPrompt, setSystemPrompt] = useState('你是一个专业的知识库助手，请基于提供的文档内容回答用户问题。如果文档中没有相关信息，请明确告知。');

  const evalCases = [
    { id: 1, q: 'Q3 净利润增长原因？', expect: '云服务业务增长', status: 'pending' },
    { id: 2, q: 'RAG 系统向量库选型？', expect: 'Milvus/Pinecone', status: 'pending' },
    { id: 3, q: '合同违约金比例上限？', expect: '30%', status: 'pending' },
    { id: 4, q: 'CEO 关于 AI 的战略？', expect: '云优先', status: 'pending' },
  ];
  const [currentEvalCases, setCurrentEvalCases] = useState<any[]>(evalCases);

  // 处理预设模板切换
  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'professional') {
      setSystemPrompt('你是一个专业的知识库助手，请基于提供的文档内容回答用户问题。如果文档中没有相关信息，请明确告知。请保持回答的严谨性和专业性，并引用具体数据。');
    } else if (val === 'friendly') {
      setSystemPrompt('你是一个友好热情的助手。请用通俗易懂的语言解释文档中的内容，适合非专业人士阅读。可以使用表情符号让语气更轻松。');
    } else if (val === 'concise') {
      setSystemPrompt('你是一个追求高效的助手。请直接回答问题的核心结论，不要废话，列出要点即可。');
    }
  };

  const startEvaluation = () => {
    setIsEvaluating(true);
    setEvalResult(null);
    setCurrentEvalCases(evalCases.map(c => ({ ...c, status: 'pending' })));
    setTimeout(() => {
      setIsEvaluating(false);
      setEvalResult({ accuracy: 87.5, citationRate: 92.3 });
      setCurrentEvalCases(prev => prev.map((c, i) => {
        if (i === 2) return { ...c, status: 'error', errorMsg: "引用了错误的文档 'employee_handbook.pdf'，预期是 'service_contract.docx'。" };
        return { ...c, status: 'success' };
      }));
    }, 2000);
  };

  const handleSave = () => {
    // 这里添加实际的保存逻辑，例如调用 API 更新后端配置
    console.log('Saving settings:', { temperature, topP, systemPrompt });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Settings className="w-5 h-5 text-gray-500" />模型设置</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 border-b border-gray-100">
          <button onClick={() => setActiveTab('params')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'params' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>参数设置</button>
          <button onClick={() => setActiveTab('eval')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'eval' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>一键评测</button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
          {activeTab === 'params' ? (
            <div className="space-y-6">
              {/* Temperature Slider */}
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2"><Zap className="w-4 h-4 text-orange-500" />Temperature (随机性)</label>
                  <span className="text-sm font-mono text-gray-500 bg-gray-100 px-2 rounded">{temperature}</span>
                </div>
                <input type="range" min="0" max="1" step="0.1" value={temperature} onChange={(e) => setTemperature(parseFloat(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"/>
                <p className="text-xs text-gray-400 mt-2">值越大回答越发散，值越小回答越确定。</p>
              </div>

              {/* Top P Slider */}
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2"><Target className="w-4 h-4 text-purple-500" />Top P (核采样)</label>
                  <span className="text-sm font-mono text-gray-500 bg-gray-100 px-2 rounded">{topP}</span>
                </div>
                <input type="range" min="0" max="1" step="0.1" value={topP} onChange={(e) => setTopP(parseFloat(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"/>
              </div>

              {/* System Prompt with Preset Select */}
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Bot className="w-4 h-4 text-blue-500" />
                    系统提示词
                  </label>
                  <select
                    className="text-xs border border-gray-200 rounded-md px-2 py-1.5 outline-none focus:border-blue-400 bg-white text-gray-600 cursor-pointer hover:border-gray-300 transition-colors"
                    onChange={handlePresetChange}
                    defaultValue=""
                  >
                    <option value="" disabled>✨ 选择预设模板...</option>
                    <option value="professional">🎓 严谨专业风格</option>
                    <option value="friendly">👋 通俗易懂风格</option>
                    <option value="concise">⚡ 简洁直白风格</option>
                  </select>
                </div>
                <textarea
                  className="w-full h-32 p-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 resize-none bg-gray-50 transition-colors"
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="在此输入自定义的 System Prompt..."
                />
              </div>

              {/* Save & Cancel Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-sm flex items-center gap-2 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  保存设置
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Evaluation Results */}
              {evalResult && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex items-center gap-4">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600"><CheckCircle2 className="w-5 h-5" /></div>
                      <div><div className="text-xs text-gray-500 uppercase font-semibold">准确率</div><div className="text-2xl font-bold text-gray-800">{evalResult.accuracy}%</div></div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600"><Quote className="w-5 h-5" /></div>
                      <div><div className="text-xs text-gray-500 uppercase font-semibold">引用率</div><div className="text-2xl font-bold text-gray-800">{evalResult.citationRate}%</div></div>
                  </div>
                </div>
              )}

              {/* Action Bar */}
              <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                <div className="text-sm text-gray-600">共 <span className="font-bold">{evalCases.length}</span> 条评测用例</div>
                <button onClick={startEvaluation} disabled={isEvaluating} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all ${isEvaluating ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-md'}`}>
                  {isEvaluating ? <><Loader2 className="w-4 h-4 animate-spin" />评测中...</> : <><Play className="w-4 h-4" />执行评测</>}
                </button>
              </div>

              {/* Test Cases List */}
              <div className="space-y-2">
                {currentEvalCases.map((item, idx) => (
                  <div key={item.id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-start gap-3">
                    <div className="mt-0.5">
                      {item.status === 'pending' && <div className="w-4 h-4 rounded-full border-2 border-gray-200" />}
                      {item.status === 'success' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                      {item.status === 'error' && <XCircle className="w-4 h-4 text-red-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between"><p className="text-sm font-medium text-gray-800 truncate">Q{idx + 1}: {item.q}</p><span className="text-xs text-gray-400 whitespace-nowrap">预期: {item.expect}</span></div>
                        {item.status === 'error' && <div className="mt-2 bg-red-50 text-red-700 text-xs p-2 rounded border border-red-100 flex items-start gap-1.5"><AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />{item.errorMsg}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 增加默认导出以提高兼容性
export default SettingsModal;
