import { useState, useEffect, useRef } from 'react';
import { Search, Upload, Database, Files, Zap, Filter, Loader2, CheckCircle2, FileText, Plus, MoreVertical, Trash2, Edit2, Download, Share2 } from 'lucide-react';
import { MOCK_DOCS } from '../data/mock';

interface DocumentsViewProps {
  onUpload: () => void;
}

export const DocumentsView = ({ onUpload }: DocumentsViewProps) => {
  const [filter, setFilter] = useState<'all' | 'pdf' | 'doc' | 'sheet'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  // 新增：控制当前激活的菜单 ID
  const [activeMenuDocId, setActiveMenuDocId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // 新增：点击外部关闭菜单的逻辑
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuDocId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredDocs = MOCK_DOCS.filter(d => {
    const typeMatch = filter === 'all' || d.type === filter;
    const searchMatch = !activeSearch.trim() ||
      d.name.toLowerCase().includes(activeSearch.toLowerCase()) ||
      d.tags.some(t => t.toLowerCase().includes(activeSearch.toLowerCase()));
    return typeMatch && searchMatch;
  });

  const getIcon = (type: string) => {
    switch(type) {
      case 'pdf': return <FileText className="w-6 h-6 text-red-500" />;
      case 'doc': return <FileText className="w-6 h-6 text-blue-500" />;
      case 'sheet': return <Database className="w-6 h-6 text-green-500" />;
      default: return <FileText className="w-6 h-6 text-gray-400" />;
    }
  };

  const handleSearchCommit = () => {
    setActiveSearch(searchTerm);
  };

  const handleMenuAction = (e: React.MouseEvent, action: string, docId: string) => {
    e.stopPropagation(); // 防止触发卡片点击
    console.log(`Action: ${action} on doc: ${docId}`);
    setActiveMenuDocId(null);
    // 这里可以添加实际的业务逻辑，比如弹出删除确认框等
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 px-4 md:px-8 py-6 overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div><h2 className="text-xl font-bold text-slate-800">我的知识库</h2><p className="text-sm text-slate-500 mt-1">管理并构建您的私有数据索引</p></div>
        <div className="flex gap-2">
            <div className="relative group">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  placeholder="搜索文件..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchCommit()}
                  onBlur={handleSearchCommit}
                  className="pl-9 pr-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 shadow-sm w-48 transition-all focus:w-64 placeholder:text-gray-400"
                />
            </div>
            <button onClick={onUpload} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors shadow-md shadow-blue-200"><Upload className="w-4 h-4" />上传文件</button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
         <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><Database className="w-5 h-5" /></div><div><div className="text-xs text-gray-500 mb-1">已用存储</div><div className="text-lg font-bold text-gray-800">45.2 MB <span className="text-xs font-normal text-gray-400">/ 500 MB</span></div></div></div>
         <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600"><Files className="w-5 h-5" /></div><div><div className="text-xs text-gray-500 mb-1">文档总数</div><div className="text-lg font-bold text-gray-800">12 <span className="text-xs font-normal text-gray-400">个文件</span></div></div></div>
         <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600"><Zap className="w-5 h-5" /></div><div><div className="text-xs text-gray-500 mb-1">本月消耗</div><div className="text-lg font-bold text-gray-800">1,240 <span className="text-xs font-normal text-gray-400">Tokens</span></div></div></div>
      </div>
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">{(['all', 'pdf', 'doc', 'sheet'] as const).map((t) => (<button key={t} onClick={() => setFilter(t)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${filter === t ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-100 border border-transparent'}`}>{t === 'all' ? '全部文件' : t.toUpperCase()}</button>))}<div className="ml-auto flex items-center gap-2 text-gray-400"><button className="p-1.5 hover:bg-gray-100 rounded-md"><Filter className="w-4 h-4" /></button></div></div>
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocs.length > 0 ? (
                filteredDocs.map(doc => (
                    <div key={doc.id} className="group bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer relative">
                        {/* 更多操作菜单区域 */}
                        <div className={`absolute top-3 right-3 z-10 ${activeMenuDocId === doc.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity duration-200`}>
                            <div className="relative" ref={activeMenuDocId === doc.id ? menuRef : null}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuDocId(activeMenuDocId === doc.id ? null : doc.id);
                                  }}
                                  className={`p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors ${activeMenuDocId === doc.id ? 'bg-gray-100 text-gray-600' : ''}`}
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>

                                {activeMenuDocId === doc.id && (
                                  <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-20 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                    <button onClick={(e) => handleMenuAction(e, 'rename', doc.id)} className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                      <Edit2 className="w-3.5 h-3.5" /> 重命名
                                    </button>
                                    <button onClick={(e) => handleMenuAction(e, 'download', doc.id)} className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                      <Download className="w-3.5 h-3.5" /> 下载
                                    </button>
                                    <button onClick={(e) => handleMenuAction(e, 'share', doc.id)} className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                      <Share2 className="w-3.5 h-3.5" /> 分享
                                    </button>
                                    <div className="h-px bg-gray-100 my-1"></div>
                                    <button onClick={(e) => handleMenuAction(e, 'delete', doc.id)} className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2">
                                      <Trash2 className="w-3.5 h-3.5" /> 删除
                                    </button>
                                  </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-start justify-between mb-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">{getIcon(doc.type)}</div>
                            <div className="flex flex-col items-end gap-1 mr-6"> {/* mr-6 为菜单按钮留出空间 */}
                                {doc.status === 'indexing' ? <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] border border-blue-100"><Loader2 className="w-3 h-3 animate-spin" /><span>索引中</span></div> : <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-600 text-[10px] border border-green-100"><CheckCircle2 className="w-3 h-3" /><span>就绪</span></div>}
                            </div>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-800 mb-1 line-clamp-1 pr-4" title={doc.name}>{doc.name}</h3>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 mb-3"><span>{doc.size}</span><span>•</span><span>{doc.date}</span></div>
                        <div className="flex flex-wrap gap-1">{doc.tags.map(tag => (<span key={tag} className="px-1.5 py-0.5 bg-gray-50 text-gray-500 rounded text-[10px]">{tag}</span>))}</div>
                    </div>
                ))
            ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
                    <Search className="w-12 h-12 mb-3 opacity-20" />
                    <p>未找到匹配的文件</p>
                </div>
            )}
            <button onClick={onUpload} className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-blue-500 hover:border-blue-300 hover:bg-blue-50/50 transition-all h-[154px]"><div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-white transition-colors"><Plus className="w-5 h-5" /></div><span className="text-xs font-medium">上传新文档</span></button>
        </div>
      </div>
    </div>
  );
};
