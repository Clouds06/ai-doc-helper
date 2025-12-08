// src/data/mock.tsx
import {
  FileText,
  PieChart,
  ShieldCheck,
  Code} from 'lucide-react';
import {
  Scenario,
  DocFile,
  ChatSession,
  ChatMessage,
  Citation,
} from '../types'; // 假设你的类型定义在 types.ts 中

export interface ThemeStyle {
  bg: string;
  text: string;
  hoverBg: string;
  hoverText: string;
}

export const THEME_STYLES: Record<string, ThemeStyle> = {
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    hoverBg: 'group-hover:bg-blue-600',
    hoverText: 'group-hover:text-white',
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    hoverBg: 'group-hover:bg-purple-600',
    hoverText: 'group-hover:text-white',
  },
  green: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    hoverBg: 'group-hover:bg-emerald-600',
    hoverText: 'group-hover:text-white',
  },
  orange: {
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    hoverBg: 'group-hover:bg-orange-600',
    hoverText: 'group-hover:text-white',
  },
  red: {
    bg: 'bg-red-50',
    text: 'text-red-600',
    hoverBg: 'group-hover:bg-red-600',
    hoverText: 'group-hover:text-white',
  },
  indigo: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-600',
    hoverBg: 'group-hover:bg-indigo-600',
    hoverText: 'group-hover:text-white',
  },
  yellow: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-600',
    hoverBg: 'group-hover:bg-yellow-500', // yellow-600 有点暗，hover 用 500 更亮
    hoverText: 'group-hover:text-white',
  }
};

// 1. 场景/快捷指令数据 (Scenarios)
export const ALL_SCENARIOS: Scenario[] = [
  {
    id: 1,
    icon: <PieChart className="w-5 h-5" />,
    title: '财务分析',
    query: '帮我总结一下2024年Q3的财务报表关键数据',
    desc: '快速获取营收、净利润及同比增长率',
    theme: 'yellow',
  },
  {
    id: 2,
    icon: <ShieldCheck className="w-5 h-5" />,
    title: '合规审查',
    query: '查询最新的员工差旅报销合规政策',
    desc: '查找差旅标准、发票要求及违规细则',
    theme: 'blue',
  },
  {
    id: 3,
    icon: <Code className="w-5 h-5" />,
    title: '技术文档',
    query: '如何调用用户鉴权 API？请给出示例代码',
    desc: '查找 API 参数定义及 Python/JS 调用示例',
    theme: 'purple',
  },
  {
    id: 4,
    icon: <FileText className="w-5 h-5" />,
    title: '合同摘要',
    query: '提取这份服务合同中的风险条款',
    desc: '自动分析违约责任与免责声明',
    theme: 'green',
  },
];

// 2. 文档列表数据 (DocFiles)
export const MOCK_DOCS: DocFile[] = [
  {
    id: 'doc-1',
    name: '2024_Q3_Financial_Report.pdf',
    size: '4.2 MB',
    type: 'pdf',
    date: '2024-10-15',
    status: 'ready',
    tags: ['财务', '季报', '公开'],
  },
  {
    id: 'doc-2',
    name: 'Employee_Handbook_v2.docx',
    size: '1.8 MB',
    type: 'doc',
    date: '2024-09-01',
    status: 'ready',
    tags: ['HR', '内部', '制度'],
  },
  {
    id: 'doc-3',
    name: 'Q4_Marketing_Budget.xlsx',
    size: '850 KB',
    type: 'sheet',
    date: '2024-11-20',
    status: 'indexing', // 正在索引中
    tags: ['市场', '预算'],
  },
  {
    id: 'doc-4',
    name: 'API_Gateway_Guide.md',
    size: '45 KB',
    type: 'md',
    date: '2024-11-22',
    status: 'ready',
    tags: ['技术', '开发'],
  },
  {
    id: 'doc-5',
    name: 'Legacy_System_Specs.pdf',
    size: '12 MB',
    type: 'pdf',
    date: '2023-01-10',
    status: 'error', // 索引失败
    tags: ['归档'],
  },
];

// 3. 引用数据 (Citations) - 辅助 ChatMessage 使用
export const MOCK_CITATIONS: Citation[] = [
  {
    id: 'cit-1',
    docName: '2024_Q3_Financial_Report.pdf',
    docType: 'pdf',
    score: 0.95,
    content: '云服务部门本季度营收增长 45%，主要得益于企业级客户续费率提升至 120%。',
    page: 12,
  },
  {
    id: 'cit-2',
    docName: '2024_Q3_Financial_Report.pdf',
    docType: 'pdf',
    score: 0.88,
    content: '尽管硬件销售略有下滑，但高利润率的软件服务占比提升，带动整体毛利率优化了 2 个百分点。',
    page: 14,
  },
];

// 4. 聊天记录数据 (ChatMessages)
export const MOCK_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    role: 'assistant',
    content: '你好！我是你的智能知识库助手。你可以问我关于已上传文档的任何问题，或者让我帮你总结分析。',
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5分钟前
  },
  {
    id: 'msg-2',
    role: 'user',
    content: '帮我分析一下云服务板块的表现。',
    timestamp: new Date(Date.now() - 1000 * 60 * 2), // 2分钟前
  },
  {
    id: 'msg-3',
    role: 'assistant',
    content: '根据 2024 年 Q3 财报，云服务板块表现强劲。云服务部门本季度营收增长 45%，主要得益于企业级客户续费率提升至 120%。建议继续加大在该领域的研发投入。',
    timestamp: new Date(),
    feedback: 'like',
    highlightInfo: {
      // 这里的 text 必须完全包含在 content 中，前端才能正确切割渲染
      text: '云服务部门本季度营收增长 45%，主要得益于企业级客户续费率提升至 120%',
      citations: MOCK_CITATIONS,
    },
  },
];

// 5. 会话列表数据 (ChatSessions) - 侧边栏历史
export const MOCK_SESSIONS: ChatSession[] = [
  {
    id: 'sess-1',
    title: 'Q3 财报分析',
    preview: '云服务板块表现强劲，营收增长...',
    date: '今天',
  },
  {
    id: 'sess-2',
    title: '考勤制度查询',
    preview: '关于年假顺延的具体规定...',
    date: '昨天',
  },
  {
    id: 'sess-3',
    title: 'Vue vs React 技术选型',
    preview: '对比两者的生态和性能...',
    date: '3天前',
  },
];

// 6. 打字机效果的占位词
export const PLACEHOLDER_LOOP_WORDS = [
  '这份财报的重点是什么？',
  '帮我总结一下合同的风险条款。',
  '如何调用用户鉴权 API？请给出示例代码。',
  '查询最新的员工差旅报销合规政策。',
];
