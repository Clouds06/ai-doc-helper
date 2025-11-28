import { useState, useEffect, useRef } from 'react';
import { X, Plus, MoreVertical, Download, Trash2, Bot, Sparkles, ThumbsUp, ThumbsDown, Paperclip, Globe, Loader2, ArrowRight, BookOpen, FileText, Zap, Quote, CircleStop } from 'lucide-react';
import { ChatMessage, Citation } from '../types';
import { MOCK_SESSIONS, MOCK_CITATIONS } from '../data/mock';
import { sendChatMessage, submitFeedback } from '../api';

export const ChatView = ({ initialQuery }: { initialQuery?: string }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState(initialQuery || '');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeCitations, setActiveCitations] = useState<Citation[] | null>(null);
    const [showRefPanel, setShowRefPanel] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [streamController, setStreamController] = useState<{ abort: () => void } | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (messages.length === 0 && !initialQuery) {
            setMessages([{ id: '0', role: 'assistant', content: '你好！我是你的知识库助手。你可以问我关于已上传文档的任何问题，或者让我帮你总结分析。', timestamp: new Date() }]);
        } else if (messages.length === 0 && initialQuery) {
            handleSend();
        }
    }, []);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages, isTyping]);


    const handleSend = () => {
        if (!input.trim() || isTyping) return;

        const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: input, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        const aiMsgId = (Date.now() + 1).toString();
        let currentContent = '';
        let citations: Citation[] = [];

        // 初始化AI消息
        setMessages(prev => [...prev, { id: aiMsgId, role: 'assistant', content: '', timestamp: new Date(), isStreaming: true }]);

        // 准备消息历史
        const messageHistory = messages.map(msg => ({ role: msg.role, content: msg.content }));
        messageHistory.push({ role: 'user', content: input });

        // 发送消息并处理流式响应
        const abortController = { abort: () => { } };
        setStreamController(abortController);

        sendChatMessage(
            messageHistory,
            0.7,
            0.9,
            [],
            (delta, done, receivedCitations) => {
                if (done) {
                    setIsTyping(false);
                    setStreamController(null);
                    citations = receivedCitations || [];

                    // 找出高亮文本（第一个引用中的内容）
                    let highlightText = '';
                    if (citations.length > 0) {
                        // 尝试从AI回复中找出与引用内容匹配的部分
                        const firstCitationContent = citations[0].content;
                        // 简单的高亮策略：匹配引用中的关键部分
                        const words = firstCitationContent.split(/[，。]/).filter(w => w.length > 5);
                        if (words.length > 0) {
                            highlightText = words[0];
                        }
                    }

                    // 更新消息，添加引用和高亮信息
                    setMessages(prev => prev.map(msg => {
                        if (msg.id === aiMsgId) {
                            return {
                                ...msg,
                                isStreaming: false,
                                highlightInfo: citations.length > 0 ? {
                                    text: highlightText,
                                    citations: citations
                                } : undefined
                            };
                        }
                        return msg;
                    }));
                } else {
                    currentContent += delta;
                    setMessages(prev => prev.map(msg => {
                        if (msg.id === aiMsgId) {
                            return { ...msg, content: currentContent };
                        }
                        return msg;
                    }));
                }
            }
        ).catch(error => {
            console.error('聊天错误:', error);
            setIsTyping(false);
            setStreamController(null);
            // 更新消息为错误状态
            setMessages(prev => prev.map(msg => {
                if (msg.id === aiMsgId) {
                    return {
                        ...msg,
                        isStreaming: false,
                        content: '抱歉，生成回答时出现错误。请稍后重试。'
                    };
                }
                return msg;
            }));
        });
    };

    const handleCancelGeneration = () => {
        if (streamController) {
            streamController.abort();
            setIsTyping(false);
            setStreamController(null);
            // 更新最后一条消息为取消状态
            setMessages(prev => {
                const lastMsg = prev[prev.length - 1];
                if (lastMsg && lastMsg.isStreaming) {
                    return [...prev.slice(0, -1), { ...lastMsg, isStreaming: false, content: lastMsg.content + ' [已取消]' }];
                }
                return prev;
            });
        }
    };

    // 添加新对话处理函数
    const handleNewConversation = () => {
        // 重置聊天状态，清空消息列表和输入框
        setMessages([{
            id: '0',
            role: 'assistant',
            content: '你好！我是你的知识库助手。你可以问我关于已上传文档的任何问题，或者让我帮你总结分析。',
            timestamp: new Date()
        }]);
        setInput('');
        setActiveCitations(null);
        setShowRefPanel(false);
        setIsTyping(false);
        // 如果有正在进行的流式响应，取消它
        if (streamController) {
            streamController.abort();
            setStreamController(null);
        }
    };

    const toggleFeedback = async (msgId: string, type: 'like' | 'dislike') => {
        // 先更新UI
        setMessages(prev => prev.map(msg => {
            if (msg.id !== msgId) return msg;
            return { ...msg, feedback: msg.feedback === type ? null : type };
        }));

        // 找到对应的消息
        const targetMsg = messages.find(msg => msg.id === msgId);
        if (targetMsg) {
            // 找到对应的用户消息
            const userMsg = messages.find(msg =>
                msg.role === 'user' &&
                new Date(msg.timestamp).getTime() < new Date(targetMsg.timestamp).getTime()
            );

            // 提交反馈到后端
            if (userMsg) {
                try {
                    await submitFeedback(
                        userMsg.content,
                        targetMsg.content,
                        targetMsg.feedback === type ? null : type
                    );
                } catch (error) {
                    console.error('提交反馈失败:', error);
                    // 反馈失败不影响UI状态
                }
            }
        }
    };

    const handleHighlightClick = (citations: Citation[]) => {
        setActiveCitations(citations);
        setShowRefPanel(true);
    };

    const renderMessageContent = (msg: ChatMessage) => {
        if (msg.role === 'user' || !msg.highlightInfo || msg.isStreaming) return msg.content;

        const fullText = msg.content;
        const highlightText = msg.highlightInfo.text;

        // 如果没有找到高亮文本，或者高亮文本不存在于内容中，直接返回完整内容
        if (!highlightText || !fullText.includes(highlightText)) return fullText;

        const parts = fullText.split(highlightText);
        return (
            <>
                {parts[0]}
                <span
                    onClick={() => handleHighlightClick(msg.highlightInfo!.citations)}
                    className="bg-blue-50 text-blue-700 border-b-2 border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors px-0.5 rounded-sm"
                    title="点击查看引用来源"
                >
                    {highlightText}
                </span>
                {parts[1]}
            </>
        );
    };

    return (
        <div className="flex h-full bg-white relative overflow-hidden">
            {/* Left Sidebar: History */}
            <div className={`
            absolute md:relative z-20 h-full bg-slate-50 border-r border-gray-200 transition-all duration-300 flex flex-col flex-shrink-0
            ${sidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full md:w-0 md:translate-x-0 overflow-hidden'}
        `}>
                <div className="p-4 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-700 text-sm">历史对话</h3>
                    <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 text-gray-400"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-3">
                    <button
                        onClick={handleNewConversation}
                        className="w-full flex items-center gap-2 px-3 py-2 bg-white border border-blue-100 text-blue-600 rounded-lg text-sm shadow-sm hover:shadow hover:bg-blue-50 transition-all mb-4">
                        <Plus className="w-4 h-4" /><span>新对话</span>
                    </button>
                    <div className="space-y-4">
                        <div>
                            <div className="text-[10px] text-gray-400 font-medium px-2 mb-2 uppercase tracking-wider">今天</div>
                            {MOCK_SESSIONS.slice(0, 1).map(s => (
                                <div key={s.id} className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer group mb-1 bg-white border border-transparent hover:border-gray-200">
                                    <div className="text-sm text-gray-700 font-medium truncate group-hover:text-blue-600 transition-colors">{s.title}</div>
                                    <div className="text-[10px] text-gray-400 truncate">{s.preview}</div>
                                </div>
                            ))}
                        </div>
                        <div>
                            <div className="text-[10px] text-gray-400 font-medium px-2 mb-2 uppercase tracking-wider">过去 7 天</div>
                            {MOCK_SESSIONS.slice(1).map(s => (
                                <div key={s.id} className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer group mb-1">
                                    <div className="text-sm text-gray-700 font-medium truncate group-hover:text-blue-600 transition-colors">{s.title}</div>
                                    <div className="text-[10px] text-gray-400 truncate">{s.preview}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {!sidebarOpen && (
                <button onClick={() => setSidebarOpen(true)} className="absolute left-4 top-4 z-10 p-2 bg-white border border-gray-200 rounded-lg shadow-sm text-gray-500 hover:text-blue-600"><MoreVertical className="w-4 h-4" /></button>
            )}

            {/* Middle: Main Chat Area */}
            <div className="flex-1 flex flex-col h-full relative bg-slate-50/30 min-w-0">
                <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4b5563 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

                {/* Header */}
                <div className="h-14 border-b border-gray-100 flex items-center justify-between px-6 bg-white/80 backdrop-blur-sm z-10">
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div><span className="text-sm font-medium text-gray-700">知识库助手</span><span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded-full border border-gray-200">GPT-4 Turbo</span></div>
                    <div className="flex items-center gap-2">
                        {isTyping && (
                            <button
                                onClick={handleCancelGeneration}
                                className="p-2 text-gray-400 hover:bg-gray-100 hover:text-red-500 rounded-full"
                                title="取消生成"
                            >
                                <CircleStop className="w-4 h-4" />
                            </button>
                        )}
                        <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-full"><Download className="w-4 h-4" /></button>
                        <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-full"><Trash2 className="w-4 h-4" /></button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 z-10 scroll-smooth" ref={scrollRef}>
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100"><Bot className="w-8 h-8 text-blue-500" /></div>
                            <p className="text-sm">开始一个新的对话...</p>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.role === 'assistant' && <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md flex-shrink-0 mt-1"><Sparkles className="w-4 h-4" /></div>}
                                <div className="flex flex-col gap-2 max-w-[85%] md:max-w-[70%]">
                                    <div className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-700 border border-gray-100 rounded-tl-none'}`}>
                                        {renderMessageContent(msg)}
                                        {msg.role === 'assistant' && msg.isStreaming && <span className="inline-block w-1.5 h-3 ml-1 bg-blue-500 align-middle animate-pulse"></span>}
                                    </div>
                                    {msg.role === 'assistant' && !msg.isStreaming && (
                                        <div className="flex items-center gap-2 px-1">
                                            <button onClick={() => toggleFeedback(msg.id, 'like')} className={`p-1 rounded hover:bg-gray-100 transition-colors ${msg.feedback === 'like' ? 'text-green-500' : 'text-gray-400'}`}><ThumbsUp className="w-3.5 h-3.5" /></button>
                                            <button onClick={() => toggleFeedback(msg.id, 'dislike')} className={`p-1 rounded hover:bg-gray-100 transition-colors ${msg.feedback === 'dislike' ? 'text-red-500' : 'text-gray-400'}`}><ThumbsDown className="w-3.5 h-3.5" /></button>
                                            {msg.highlightInfo && <span className="text-[10px] text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 ml-auto cursor-pointer hover:bg-blue-100 transition-colors" onClick={() => handleHighlightClick(msg.highlightInfo.citations)}>{msg.highlightInfo.citations.length} 处引用</span>}
                                        </div>
                                    )}
                                </div>
                                {msg.role === 'user' && <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold shadow-sm flex-shrink-0 mt-1">JD</div>}
                            </div>
                        )))
                    }
                </div>

                {/* Input */}
                <div className="p-4 bg-white border-t border-gray-100 z-10">
                    <div className="max-w-4xl mx-auto relative">
                        <div className="absolute left-3 top-3 flex gap-2">
                            <button className="p-1.5 text-gray-400 hover:bg-gray-100 hover:text-blue-600 rounded-lg transition-colors"><Paperclip className="w-4 h-4" /></button>
                            <button className="p-1.5 text-gray-400 hover:bg-gray-100 hover:text-blue-600 rounded-lg transition-colors"><Globe className="w-4 h-4" /></button>
                        </div>
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                            placeholder={isTyping ? "AI 正在思考中..." : "问点什么..."}
                            disabled={isTyping}
                            className="w-full pl-24 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50/50 transition-all resize-none h-[50px] max-h-[120px] disabled:bg-gray-100 disabled:text-gray-400"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || isTyping}
                            className={`absolute right-2 top-2 p-2 rounded-lg transition-all ${input.trim() && !isTyping ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700' : 'bg-gray-200 text-gray-400'}`}
                        >
                            {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                        </button>
                    </div>
                    <div className="text-center mt-2"><span className="text-[10px] text-gray-400">AI 可能会产生错误，请核对重要信息</span></div>
                </div>
            </div>

            {/* Right: Reference Panel */}
            <div className={`bg-white border-l border-gray-200 transition-all duration-300 flex flex-col flex-shrink-0 ${showRefPanel ? 'w-80 translate-x-0' : 'w-0 translate-x-full overflow-hidden'}`}>
                <div className="h-14 border-b border-gray-100 flex items-center justify-between px-4">
                    <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm"><BookOpen className="w-4 h-4 text-blue-600" />相关引用<span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full text-[10px]">{activeCitations?.length || 0}</span></div>
                    <button onClick={() => setShowRefPanel(false)} className="p-1 text-gray-400 hover:bg-gray-100 rounded-full"><X className="w-4 h-4" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                    {activeCitations?.map((cite) => (
                        <div key={cite.id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm hover:border-blue-300 hover:shadow-md transition-all group">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2"><div className="w-6 h-6 rounded bg-red-50 text-red-500 flex items-center justify-center"><FileText className="w-3.5 h-3.5" /></div><span className="text-xs font-medium text-gray-700 line-clamp-1 max-w-[140px]" title={cite.docName}>{cite.docName}</span></div>
                                <div className="flex items-center gap-1 bg-green-50 text-green-700 px-1.5 py-0.5 rounded text-[10px] font-medium border border-green-100"><Zap className="w-3 h-3" />{Math.round(cite.score * 100)}%</div>
                            </div>
                            <div className="relative"><Quote className="absolute -top-1 -left-1 w-3 h-3 text-gray-300 transform -scale-x-100" /><p className="text-xs text-gray-600 leading-relaxed pl-3 border-l-2 border-gray-100">{cite.content}</p></div>
                            {cite.page && <div className="mt-2 flex justify-end"><span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">第 {cite.page} 页</span></div>}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};