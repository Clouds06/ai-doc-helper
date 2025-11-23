# AI 文档助手 (RAG) - [你的团队名称]

<!-- CI/CD Status Badges -->
<!-- ![CI](https://github.com/.../badge.svg) -->
<!-- ![Coverage](...) -->
<!-- ![Vercel](...) -->

## 1. 项目简介

本项目是前端训练营课题——**AI 文档助手**的实现。它是一个基于 RAG (Retrieval-Augmented Generation) 的知识库问答应用，允许用户上传文档并通过对话界面进行智能问答，答案附带精确的引用来源。

- **线上 Demo:** [在此处插入可访问的 Demo 链接]
- **答辩录屏:** [在此处插入 E2E 关键路径演示视频链接]

### 目标与范围
- **目标:** 验证并展示在真实工程约束下，前端端到端交付 AI 应用的能力。
- **核心范围:** 文档上传解析、流式对话问答、可解释性引用、参数调整、自动化评测。

## 2. 时间线与里程碑
- **W1 (11/06–11/09):** Kickoff & 范围冻结。
- **W2 (11/10–11/16):** MVP1 (上传， Chat 基础， 流式 & 引用)。
- **W3 (11/17–11/23):** MVP2 (参数/评测面板， E2E, CI)。
- **W4-5 (11/24–12/07):** 性能、可访问性、稳定性打磨。
- **答辩:** 12 月中旬。

## 3. 技术栈与依赖
- **框架:** [React / Vue 3] + Vite
- **语言:** TypeScript
- **UI 库:** [Headless UI / 自研组件]
- **样式:** [Tailwind CSS / CSS Modules]
- **状态管理:** [Zustand / Redux / Vuex]
- **路由:** [React Router / Vue Router]
- **测试:** [Vitest / Jest] + [Playwright]
- **CI/CD:** [GitHub Actions / GitLab CI]
- **部署:** [Vercel / Netlify]

## 4. 快速开始

### 环境变量
在项目根目录创建 `.env.local` 文件，并填入必要的环境变量：
```.env
# 示例：API 端点或密钥
VITE_API_BASE_URL="http://localhost:8000"
```
**安全注意：** 确保 `.env.local` 已被添加到 `.gitignore` 中，严禁将任何密钥提交到仓库。

### 安装
```bash
npm install
```

### 本地运行
```bash
npm run dev
```

### 构建
```bash
npm run build
```

## 5. 目录结构
```
.
├── public/
├── src/
│   ├── assets/
│   ├── components/ # UI 组件
│   ├── hooks/      # 自定义 Hooks
│   ├── pages/      # 页面级组件
│   ├── services/   # API 请求
│   ├── store/      # 状态管理
│   ├── styles/     # 全局样式
│   ├── types/      # 类型定义
│   └── utils/      # 工具函数
├── tests/
│   ├── e2e/
│   └── unit/
├── .github/workflows/ # CI 配置
├── ARCHITECTURE.md
├── PROMPTS.md
├── EVAL.md
└── README.md
```

## 6. 功能模块说明
- **文档接入:** 支持 Markdown 上传，前端解析并存储。
- **对话问答:** 实现流式响应和引用高亮。
- **可解释性与反馈:** 可视化检索片段，支持用户反馈。
- **评测面板:** 一键运行离线评测，展示核心指标。
- **工程化:** 全套 lint/test/CI 流程。

## 7. 接口契约
- `POST /api/chat`: 发起对话请求。
- `POST /api/upload`: 上传文档。
- `GET /api/retrieve`: 检索相关片段。
- ... (更多细节请参考飞书文档)

## 8. 评测使用指南
评测样例集位于 `eval/sample.jsonl`。要运行评测，请访问应用的 `/eval` 页面并点击 “开始评测”。
- **评测口径:** 详见 `EVAL.md`。

## 9. 性能指标与预算
- **LCP:** < 2.8s (目标) | [实际值] (截图链接)
- **Core Bundle Size:** < 400KB (目标) | [实际值] (截图链接)
- **Accessibility Score:** ≥ 90 (目标) | [实际值] (截图链接)

## 10. 测试说明
- **单元测试:** `npm run test:unit`
- **E2E 测试:** `npm run test:e2e`
- **关键路径覆盖:** 已覆盖上传、问答、引用、反馈等核心流程。

## 11. 架构与设计
- **架构图/数据流:** 详见 `ARCHITECTURE.md`。
- **Prompt 设计:** 详见 `PROMPTS.md`。

## 12. 失败案例与改进
我们记录了在开发过程中遇到的问题、失败案例以及相应的改进措施。
- **案例一:** [问题描述及解决方案]
- **案例二:** [问题描述及解决方案]
- ...

## 13. Roadmap
- [ ] [未来功能或优化点一]
- [ ] [未来功能或优化点二]

## 14. 贡献与提交规范
- 请遵循 Conventional Commits 规范。
- 所有合并请求需通过 CI 检查。

## 15. 许可证
本项目基于 MIT 许可证开源 —— 详情请参阅 [LICENSE](LICENSE) 文件。

## 16. 致谢
本项目在开源框架 [LightRAG](https://github.com/HKUDS/LightRAG) 的基础上进行前端优化迭代，感谢所有开发者的开源贡献。
