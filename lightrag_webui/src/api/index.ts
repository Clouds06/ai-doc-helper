// API服务封装，模拟后端交互
import { ChatMessage, Citation } from '../types';

// API基础URL
const API_BASE_URL = '/api';

// 模拟延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock数据生成函数
const generateMockCitations = (query: string): Citation[] => {
    return [
        {
            id: `cite-${Date.now()}-1`,
            docName: '2024年第三季度财务报告.pdf',
            docType: 'pdf',
            score: 0.92,
            content: '云服务业务板块在本季度实现了显著增长，营收同比增长 45%，主要得益于企业级客户的续费率提升至 120%。',
            page: 15
        },
        {
            id: `cite-${Date.now()}-2`,
            docName: '2024Q3业绩分析.pptx',
            docType: 'doc',
            score: 0.88,
            content: '续费率达到120%，显示客户满意度和产品粘性大幅提升。',
            page: 7
        },
        {
            id: `cite-${Date.now()}-3`,
            docName: '产品战略规划2024.docx',
            docType: 'doc',
            score: 0.75,
            content: 'AI基础设施投入将成为未来季度的重点投资方向，预计将带来长期竞争优势。',
            page: 23
        }
    ];
};

// 模拟流式响应
const simulateStreamResponse = async (
    messages: { role: string; content: string }[],
    callback: (delta: string, done: boolean, citations?: Citation[]) => void
) => {
    const lastMessage = messages[messages.length - 1].content;
    let responseText = '';
    let citations: Citation[] = [];

    // 根据问题生成不同的回答
    if (lastMessage.includes('财务') || lastMessage.includes('增长')) {
        responseText = '根据对2024年Q3财务数据的分析，我们发现几个关键增长点。首先，云服务业务板块在本季度实现了显著增长，营收同比增长 45%，主要得益于企业级客户的续费率提升至 120%。其次，虽然硬件销售略有下滑，但整体毛利率因高利润率软件服务的占比提升而优化了 2 个百分点。建议继续加大在 AI 基础设施上的投入。';
        citations = generateMockCitations(lastMessage);
    } else if (lastMessage.includes('产品') || lastMessage.includes('规划')) {
        responseText = '根据产品战略规划，我们计划在下个季度推出3款新产品，并对现有产品线进行全面升级。重点关注AI功能集成和用户体验优化，预计将提升市场份额5-8%。产品定价策略将采取分层定价模式，以满足不同客户群体的需求。';
        citations = generateMockCitations(lastMessage);
    } else {
        responseText = '感谢您的提问。基于您的查询，我们分析了相关文档内容，为您提供以下信息。这是一个通用回答示例，实际系统将基于您上传的文档内容生成更准确的回复。如有特定问题，请提供更多细节以便我们能够给出更精准的解答。';
        citations = generateMockCitations(lastMessage);
    }

    // 模拟流式输出
    let index = 0;
    while (index < responseText.length) {
        const chunkSize = Math.floor(Math.random() * 5) + 1;
        const chunk = responseText.slice(index, index + chunkSize);
        callback(chunk, false);
        index += chunkSize;
        await delay(20 + Math.random() * 30);
    }

    // 完成流式输出，返回引用
    callback('', true, citations);
};

// API函数
export const sendChatMessage = async (
    messages: { role: string; content: string }[],
    temperature = 0.7,
    top_p = 0.9,
    context_ids: string[] = [],
    onStream: (delta: string, done: boolean, citations?: Citation[]) => void
) => {
    try {
        await simulateStreamResponse(messages, onStream);
    } catch (error) {
        console.error('发送聊天消息失败:', error);
        throw new Error('发送消息失败，请稍后重试');
    }
};

export const uploadDocument = async (
    files: File[],
    onProgress?: (progress: number) => void
): Promise<{ docIds: string[]; report: string }> => {
    try {
        // 模拟文件上传
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            if (onProgress) onProgress(progress);
            if (progress >= 100) clearInterval(interval);
        }, 200);

        await delay(2000); // 模拟上传时间

        // 返回模拟结果
        return {
            docIds: files.map(() => `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`),
            report: `成功上传 ${files.length} 个文件，正在处理中`
        };
    } catch (error) {
        console.error('上传文档失败:', error);
        throw new Error('文档上传失败，请稍后重试');
    }
};

export const retrieveDocuments = async (
    query: string,
    topk = 5
): Promise<{ docId: string; score: number; snippet: string; anchor?: string }[]> => {
    try {
        // 模拟检索结果
        await delay(500);
        return [
            {
                docId: 'doc-001',
                score: 0.95,
                snippet: '这是与查询相关的第一个文档片段，包含重要信息...',
                anchor: 'section-1'
            },
            {
                docId: 'doc-002',
                score: 0.88,
                snippet: '这是另一个相关文档的片段，提供了补充信息...'
            },
            {
                docId: 'doc-003',
                score: 0.75,
                snippet: '这个文档片段也包含与查询相关的内容...'
            }
        ];
    } catch (error) {
        console.error('检索文档失败:', error);
        throw new Error('检索失败，请稍后重试');
    }
};

export const submitFeedback = async (
    question: string,
    answer: string,
    feedback: 'like' | 'dislike' | null,
    comment?: string
): Promise<boolean> => {
    try {
        // 模拟反馈提交
        await delay(300);
        console.log('反馈已提交:', { question, answer, feedback, comment });
        return true;
    } catch (error) {
        console.error('提交反馈失败:', error);
        throw new Error('反馈提交失败，请稍后重试');
    }
};

export const runEvaluation = async (): Promise<{
    accuracy: number;
    citation_rate: number;
    notes: string[];
}> => {
    try {
        // 模拟评测
        await delay(1000);
        return {
            accuracy: 0.85,
            citation_rate: 0.92,
            notes: [
                '模型回答准确率达到85%',
                '引用率良好，92%的回答包含引用',
                '建议进一步优化长文档的处理能力'
            ]
        };
    } catch (error) {
        console.error('运行评测失败:', error);
        throw new Error('评测失败，请稍后重试');
    }
};