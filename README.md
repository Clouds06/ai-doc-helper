# AI 文档助手 (RAG) - [开发小队]

## 1. 项目简介

本项目是前端训练营课题——**AI 文档助手**的实现。它是一个基于 RAG (Retrieval-Augmented Generation) 的知识库问答应用，允许用户上传文档并通过对话界面进行智能问答，答案附带精确的引用来源。我们基于开源框架 [LightRAG](https://github.com/HKUDS/LightRAG) 进行二次开发，在前端体验与后端功能上做了多项增强，比如检索精准度、用户反馈机制和评测体系。

- **线上 Demo:** [[ Demo 链接 ](http://8.148.187.233:9621)]
- **答辩录屏:** [[ Demo 全流程录屏链接](https://ai.feishu.cn/wiki/AqkewqIjeiDvj9kOUN2cIkYvnfh?from=from_copylink)]

### 目标与范围
- **目标:** 验证并展示在真实工程约束下，前端端到端交付 AI 应用的能力。
- **核心范围:** 文档上传解析、流式对话问答、可解释性引用、参数调整、自动化评测。

## 2. 时间线与里程碑
- **W1 (11/17–11/23):** Kickoff & 范围冻结。
- **W2 (11/24–11/30):** MVP1 (上传， Chat 基础， 流式 & 引用)。
- **W3 (12/01–12/07):** MVP2 (参数/评测面板， E2E, CI)。
- **W4-5 (12/08–12/14):** 性能、可访问性、稳定性打磨。
- **答辩:** 12 月中旬。

## 3. 技术栈与依赖
- **框架:** React + Vite
- **语言:** TypeScript
- **UI 库:** Lucide React
- **样式:** Tailwind CSS
- **状态管理:** Zustand
- **路由:** React Router
- **测试:** Vitest + Playwright
- **CI/CD:** GitHub Actions
- **部署:** Vercel / 阿里云服务器
- **后端框架:** Python FastAPI
- **RAG 核心:** LightRAG (扩展开发)

## 4. 快速开始

### 后端配置
#### 1. 克隆代码并进入项目目录
```bash
git clone https://github.com/Clouds06/ai-doc-helper.git
cd ai-doc-helper
```

#### 2. 配置 Python 环境
推荐使用 `uv` 管理虚拟环境（更高效），也可选择 `pip` 作为备选方案：
```bash
# 方案1：使用 uv（推荐）
uv sync --extra api
source .venv/bin/activate

# 方案2：使用 pip（备选）
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[api]"
```

#### 3. 配置模型参数（.env 文件）
项目依赖环境变量配置模型参数，需复制示例配置并修改为实际的密钥和地址：
```bash
# 复制示例配置文件为 .env
cp env.example .env

# 编辑 .env 文件，配置 LLM 和 Embedding 模型参数
vim .env
```

在 `.env` 文件中添加以下配置（以阿里云百炼大模型（兼容 OpenAI 接口）为例，可替换为其他兼容 OpenAI 接口的模型）：
```ini
# ===================== 基础 LLM 配置 =====================
LLM_BINDING=openai
LLM_MODEL=gpt-4o
LLM_BINDING_HOST=https://api.openai.com/v1
LLM_BINDING_API_KEY=your_api_key

# ===================== OpenAI 兼容嵌入模型配置 =====================
EMBEDDING_BINDING=openai
EMBEDDING_MODEL=text-embedding-3-large
EMBEDDING_DIM=3072
EMBEDDING_SEND_DIM=false
EMBEDDING_TOKEN_LIMIT=8192
EMBEDDING_BINDING_HOST=https://api.openai.com/v1
EMBEDDING_BINDING_API_KEY=your_api_key

# ===================== 评估用 LLM 配置 =====================
EVAL_LLM_MODEL=gpt-4o-mini
# LLM 评估密钥（未设置时会 fallback 到 OPENAI_API_KEY）
EVAL_LLM_BINDING_API_KEY=your_api_key
# LLM 评估自定义端点（可选）
EVAL_LLM_BINDING_HOST=https://api.openai.com/v1

# ===================== 评估用嵌入模型配置 =====================
EVAL_EMBEDDING_MODEL=text-embedding-3-large
# 嵌入模型密钥（未设置时依次 fallback 到 EVAL_LLM_BINDING_API_KEY -> OPENAI_API_KEY）
EVAL_EMBEDDING_BINDING_API_KEY=your_embedding_api_key
# 嵌入模型自定义端点（未设置时 fallback 到 EVAL_LLM_BINDING_HOST）
EVAL_EMBEDDING_BINDING_HOST=https://api.openai.com/v1
```

### 前端配置
#### 1. 安装 Bun
若未安装 Bun，需按照官方文档完成安装：[Bun 官方安装文档](https://bun.sh/docs/installation)

#### 2. 安装项目依赖
进入 `lightrag_webui` 目录，执行以下命令安装依赖（锁定依赖版本，保证环境一致性）：
```bash
cd lightrag_webui
bun install --frozen-lockfile
```

#### 3. 启动开发服务器
若需在开发模式下运行 WebUI，执行以下命令启动开发服务器：
```bash
bun run dev
```

#### 4. 构建生产项目
执行以下命令打包项目，构建后的文件将输出到 `lightrag/api/webui` 目录，可用于生产部署：
```bash
bun run build
```

#### 5. 脚本命令
以下是 `package.json` 中定义的常用脚本命令，可在 `lightrag_webui` 目录下执行：

| 命令                | 功能说明                     |
|---------------------|------------------------------|
| `bun install`       | 安装项目依赖                 |
| `bun run dev`       | 启动前端开发服务器           |
| `bun run build`     | 构建生产环境的前端项目       |
| `bun run lint`      | 运行代码检查工具（Linter）|
| `bun run test`      | 执行项目测试              |


## 5. 前端目录结构
```
lightrag_webui/
├── public/                     # 静态资源目录
│   ├── favicon.png             # 网站图标
│   └── logo.svg                # 项目 Logo
├── src/                        # 源代码目录
│   ├── api/                    # API 请求模块
│   │   ├── __tests__/          # API 测试文件
│   │   ├── chat.ts             # 聊天相关 API
│   │   └── lightrag.ts         # LightRAG 核心业务 API
│   ├── components/             # React 组件目录
│   │   ├── common/             # 通用组件 (如 Button, Modal, Card 等)
│   │   ├── home/               # 首页相关组件 (如 SearchCard, Onboarding)
│   │   ├── icons/              # 图标组件
│   │   └── settings/           # 设置页相关组件 (如 SettingsModal, ParamsTab)
│   ├── data/                   # 静态数据/Mock 数据
│   │   └── mock.tsx
│   ├── hooks/                  # 自定义 React Hooks
│   │   ├── useRagStore.ts      # RAG 状态管理 Hook
│   │   ├── useTypewriter.ts    # 打字机效果 Hook
│   │   └── useUploadStore.ts   # 上传状态管理 Hook
│   ├── lib/                    # 工具函数和常量
│   │   ├── constants.ts        # 全局常量定义
│   │   ├── extensions.ts       # 扩展功能
│   │   └── utils.ts            # 通用工具函数
│   ├── services/               # 业务服务层
│   │   └── navigation.ts       # 导航服务
│   ├── stores/                 # 全局状态管理 (Zustand 等)
│   │   ├── settings.ts         # 设置状态
│   │   └── state.ts            # 应用主状态
│   ├── types/                  # TypeScript 类型定义
│   │   └── index.ts
│   ├── views/                  # 页面视图组件
│   │   ├── ChatView.tsx        # 问答/对话页面
│   │   ├── DocumentsView.tsx   # 文档管理页面
│   │   └── HomeView.tsx        # 首页
│   ├── App.tsx                 # 应用根组件
│   ├── AppRouter.tsx           # 路由配置
│   ├── i18n.ts                 # 国际化配置
│   ├── index.css               # 全局样式文件
│   ├── main.tsx                # 应用入口文件
│   ├── test-setup.ts           # 测试环境配置
│   └── vite-env.d.ts           # Vite 类型声明
├── .env.development            # 开发环境配置
├── .gitignore                  # Git 忽略配置
├── .prettierrc.json            # Prettier 代码格式化配置
├── EVAL.md                     # 评测相关说明文档
├── PROMPTS.md                  # Prompt 提示词说明文档
├── README.md                   # 前端项目说明文档
├── bun.lock                    # Bun 依赖锁定文件 (文本格式)
├── bun.lockb                   # Bun 依赖锁定文件 (二进制格式)
├── bunfig.toml                 # Bun 配置文件
├── components.json             # 组件库配置文件 (shadcn/ui)
├── env.development.smaple      # 开发环境变量示例
├── env.local.sample            # 本地环境变量示例
├── eslint.config.js            # ESLint 配置文件
├── index.html                  # HTML 入口文件
├── package.json                # 项目依赖配置
├── tailwind.config.js          # Tailwind CSS 配置文件
├── tsconfig.json               # TypeScript 配置文件
├── vercel.json                 # Vercel 部署配置
└── vite.config.ts              # Vite 构建工具配置
```

## 6. 功能模块说明
本项目基于 React + Vite 构建现代化前端，并对 LightRAG 后端进行深度定制扩展，实现从文档管理到评测反馈的全链路闭环，核心功能模块如下：

### 6.1 文档接入与精细化管理
- **多格式支持**：前端支持 Markdown、PDF、DOCX 等多种格式文件的拖拽上传，实时追踪解析状态。
- **定制筛选增强**：后端扩展文件名关键词检索与文档类型筛选接口，前端配套实现过滤交互，支持海量文档中快速定位目标。

### 6.2 流式问答与深度溯源
- **沉浸式交互**：基于 SSE 实现打字机式流式响应，支持 Markdown 渲染与代码高亮。
- **精准溯源**：扩展检索结果返回字段，新增检索片段相关性得分（Score）计算；前端高亮展示引用来源，可查看片段具体得分与原文出处，提升回答可信度。

### 6.3 可解释性与用户反馈
- **白盒化展示**：提供“检索过程可视化”功能，直观呈现 RAG 系统召回的关系片段。
- **反馈闭环**：实现用户反馈（User Feedback）功能与接口，支持对单轮对话“点赞/点踩”及文本评价；后端持久化存储反馈数据，为模型微调与知识库优化提供支撑。

### 6.4 离线评测面板
- **一键评测**：内置基于 RAGAS 的评测工作流，前端可视化面板支持一键启动离线评测。
- **多维指标**：自动计算并展示 **忠实度（Faithfulness）、相关性（Answer Relevancy）、召回率（Context Recall）** 等核心指标，通过详情列表直观呈现系统性能。

### 6.5 前端工程化体系
- **技术栈**：采用 React + TypeScript + Tailwind CSS + Vite 现代技术栈，兼顾开发效率与运行性能。
- **质量保障**：配置 ESLint/Prettier 代码规范检查、Husky 提交钩子及完整 GitHub Actions CI/CD 流程，保障代码质量与自动化交付。

## 7. 接口契约
以下为项目核心接口契约说明，涵盖文档管理、对话交互、数据检索、图数据操作、认证反馈等全链路功能，包含前端调用路径、请求方式、核心功能及关键参数，方便前后端协作与集成。

### 7.1 对话交互接口（核心查询能力）
| 请求方法 | 接口路径         | 功能描述                     | 关键参数                                                                 | 备注                     |
|----------|------------------|------------------------------|--------------------------------------------------------------------------|--------------------------|
| POST     | `/query`         | 非流式文本查询（同步响应）   | `query`：查询语句；`mode`：查询模式（推荐 `hybrid`/`global`）；`include_references`：是否返回引用源（需设为 `true` 以获取得分）；`include_chunk_content`：是否返回片段内容（建议 `true`）；`response_type`：响应格式 | 同步返回完整回答、引用列表及 `query_id`（用于反馈关联） |
| POST     | `/query/stream`  | 流式文本查询（实时响应）     | `query`：查询语句；`mode`：查询模式（推荐 `hybrid`/`global`）；`stream`：设为 `true` 启用流式；`include_references`：是否返回引用源（需设为 `true` 以获取得分）；`include_chunk_content`：是否返回片段内容（建议 `true`） | 支持打字机式增量展示，第一条消息含 `references` 和 `query_id`，支持 Markdown 渲染、代码高亮 |

### 7.2 文档管理接口
| 请求方法 | 接口路径                | 功能描述                     | 关键参数                                                                 | 备注                     |
|----------|-------------------------|------------------------------|--------------------------------------------------------------------------|--------------------------|
| POST     | `/api/upload`           | 上传单个/批量文档            | `file`：文件对象（multipart/form-data）；支持格式：Markdown/PDF/DOCX/PPTX/XLSX | 前端支持拖拽上传，实时追踪解析状态 |
| GET      | `/api/documents`        | 获取所有文档状态信息         | -                                                                        | 返回文档路径、状态、创建时间、块数等 |
| POST     | `/api/documents/paginated` | 分页查询文档（支持筛选/搜索） | `page`：页码（默认1）；`page_size`：每页数量（默认50）；`file_type`：文件类型筛选（md/txt/docx等）；`keyword`：关键词搜索（匹配文件名/内容摘要） | 核心扩展接口，适用于海量文档精准定位 |
| POST     | `/api/documents/scan`   | 扫描新增/更新的文档          | -                                                                        | 返回新增、更新及错误文档数量 |
| DELETE   | `/api/documents/delete` | 删除指定文档                 | `doc_ids`：文档ID数组；`delete_file`：是否删除本地文件；`delete_llm_cache`：是否清除LLM缓存 | 需确认文档ID正确性，谨慎操作 |
| POST     | `/api/documents/text`   | 插入文本内容到知识库         | `text`：文本内容；`title`：文本标题（可选）                               | 无需上传文件，直接添加文本数据 |

### 7.3 检索与图数据接口
| 请求方法 | 接口路径                | 功能描述                     | 关键参数                                                                 | 备注                     |
|----------|-------------------------|------------------------------|--------------------------------------------------------------------------|--------------------------|
| GET      | `/api/retrieve`         | 检索相关文档片段             | `query`：检索关键词；`limit`：返回片段数量；`include_scores`：是否返回相似度得分 | 支持片段级相关性得分返回 |
| GET      | `/api/graphs`           | 查询图谱数据（实体/关系）    | `label`：图谱标签；`keyword`：实体/关系关键词                             | 用于检索过程可视化展示 |
| GET      | `/api/graph/label/list` | 获取所有图谱标签             | -                                                                        | 辅助图谱筛选与分类检索 |
| POST     | `/api/graph/entity/edit` | 更新图谱实体属性             | `entity_id`：实体ID；`properties`：更新的属性键值对                        | 支持图谱数据精细化管理 |

### 7.4 认证与反馈接口
| 请求方法 | 接口路径                | 功能描述                     | 关键参数                                                                 | 备注                     |
|----------|-------------------------|------------------------------|--------------------------------------------------------------------------|--------------------------|
| POST     | `/api/login`            | 登录认证（获取访问令牌）     | `username`：用户名；`password`：密码                                      | 返回 Bearer Token，用于后续认证请求 |
| GET      | `/api/auth-status`      | 获取当前认证状态             | -                                                                        | 验证令牌有效性及权限范围 |
| POST     | `/api/feedback`         | 提交对话反馈（点赞/点踩）    | `query_id`：查询唯一ID（从 `/query`/`/query/stream` 响应中获取）；`feedback_type`：反馈类型（`like`/`dislike`）；`comment`：反馈说明（点踩建议必填）；`original_query`：原始查询语句（建议填写） | 反馈将用于优化后续回答风格与逻辑 |

### 7.5 系统工具接口
| 请求方法 | 接口路径                | 功能描述                     | 关键参数                                                                 | 备注                     |
|----------|-------------------------|------------------------------|--------------------------------------------------------------------------|--------------------------|
| GET      | `/api/health`           | 检查后端服务健康状态         | -                                                                        | 返回服务运行状态及版本信息 |
| POST     | `/api/documents/clear_cache` | 清除文档处理缓存             | -                                                                        | 优化服务性能，解决缓存相关问题 |
| GET      | `/api/documents/status_counts` | 获取文档状态统计             | -                                                                        | 返回各类状态（成功/失败/处理中）文档数量 |

### 接口调用说明
1. 所有接口默认基础路径：`http://localhost:9621`（前端可通过环境变量配置）；
2. 需认证的接口（如 `/api/login` 后），需在请求头添加 `Authorization: Bearer {token}`；
3. 流式接口（`/query/stream`）返回数据为 SSE 协议增量推送，前端需解析该协议以实现实时展示；
4. 涉及文件上传的接口（`/api/upload`），请求格式需为 `multipart/form-data`；
5. 如需获取文档片段相似度得分（`scores`），查询接口需同时设置 `include_references: true` 和 `include_chunk_content: true`，推荐使用 `hybrid` 或 `global` 模式以获得最佳效果；
6. 提交反馈时，`query_id` 必须从查询接口响应中获取，否则无法关联具体对话上下文。

## 8. 评测使用指南
评测样例集位于 `eval_accuracy_citation/EVAL.jsonl`。要运行评测，请访问应用的 `设置 - 评测面板` 页面并点击 “开始评测”。
- **评测口径:** 详见 `ALL_API_use_example/EVAL评测接口使用.md`。

## 9. 性能指标与预算
- **LCP:** < 2.8s (目标) | [0.7] ([查看截图](docs/screenshots/Lighthouse-report.png))
- **Core Bundle Size:** < 400KB (目标) | [91.41KB] ([查看截图](docs/screenshots/Core-bundle-size.png))
- **Accessibility Score:** ≥ 90 (目标) | [94] ([查看截图](docs/screenshots/Lighthouse-report.png))

## 10. 测试说明
- **单元测试:** `bun run test`
- **关键路径覆盖:** 已覆盖上传、问答、引用、反馈等核心流程。

## 11. 架构与设计
- **架构图/数据流:** 详见 `ARCHITECTURE.md`。
- **Prompt 设计:** 详见 `PROMPTS.md`。

## 12. 失败案例与改进
我们记录了在开发过程中遇到的问题、失败案例以及相应的改进措施。

### 案例一: 流式响应中的 Markdown 渲染失效
- **问题描述**：对话功能初期，后端返回的流式数据（Streaming Data）被直接作为纯文本拼接到消息中。模型生成的 Markdown 语法（如 **加粗**、### 标题、表格和代码块）以原始符号形式显示，且无法正确高亮代码，严重影响阅读体验。
- **解决方案**：
  1. 引入 ReactMarkdown 组件配合 remark-gfm 插件接管消息展示，将流式文本实时解析为 HTML 结构，确保表格、排版等格式正确渲染。
  2. 优化流式更新逻辑，直接将 SSE 接收到的 chunk 实时累加到消息 State 中，避免因文本截断导致的 Markdown 标签解析崩坏，让解析器能处理不断增长的完整文本流。
  3. 定制 code 组件渲染逻辑，集成语法高亮库，保障代码块在流式生成过程中样式稳定。

### 案例二: 缺失检索置信度 (Confidence Score)
- **问题描述**：原生 LightRAG 的 /query 接口仅返回检索到的上下文内容（Context），缺乏具体的“相关性得分”。无法量化评估检索质量，也无法在前端为用户提供“为什么检索到这段话”的可解释性依据，难以过滤低质量的幻觉检索。
- **解决方案**：
  1. 后端扩展独立的得分计算逻辑，利用向量数据库（或 Embedding 模型）计算 User Query 与 Retrieved Chunks 之间的余弦相似度 (Cosine Similarity)，作为置信度得分。
  2. 改造检索接口返回结构，将 score 字段注入到每个检索片段中。
  3. 前端在“引用溯源”区域增加置信度徽章（Badge），高分片段标记为绿色，低分标记为黄色，帮助用户快速判断回答的可信度。

## 13. Roadmap
### (1) 核心功能扩展
- [ ] 多模态文档解析：增加对文档中图片、图表、公式的深度解析能力（OCR/Vision），支持基于视觉信息的问答。
- [ ] 知识图谱交互编辑：升级可视化图谱功能，支持在前端手动添加、修改或删除实体与关系，人工修正图谱质量。
- [ ] 反馈驱动优化 (RLHF)：利用已收集的用户“点赞/点踩”与文本反馈数据，构建自动优化闭环，动态微调检索参数或提示词模板。
- [ ] Agent 工具集成：引入 Web Search（联网搜索）或 Code Interpreter（代码执行）等外部工具，提升处理复杂推理任务的能力。

### (2) 前端体验优化
- [ ] 移动端适配与 PWA：优化移动端响应式布局，支持 PWA (Progressive Web App) 安装，实现桌面端与移动端的无缝跨平台访问体验。
- [ ] 智能工件 (Artifacts) 预览：借鉴 Claude Artifacts 设计，将模型生成的长代码、HTML 页面、Mermaid 流程图或 SVG 图表在独立侧边栏进行渲染与交互，避免打断对话流。
- [ ] 语音交互 (ASR/TTS)：集成 Web Speech API 或第三方服务，支持语音输入 Prompt 及答案的流式朗读（TTS），提供无障碍与免提交互模式。
- [ ] 会话高级管理：引入“会话文件夹”、“自定义标签”及“本地历史全文检索”功能，解决随着使用时间增长，历史记录难以查找和归档的问题。

## 14. 贡献与提交规范
- 请遵循 Conventional Commits 规范。
- 所有合并请求需通过 CI 检查。

## 15. 许可证
本项目基于 MIT 许可证开源 —— 详情请参阅 [LICENSE](LICENSE) 文件。

## 16. 致谢
本项目在开源框架 [LightRAG](https://github.com/HKUDS/LightRAG) 的基础上进行前端优化迭代，感谢所有开发者的开源贡献。
