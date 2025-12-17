# LightRAG WebUI

LightRAG WebUI 是一个基于 React 的 Web 界面，用于与 LightRAG 系统进行交互。它提供了一个用户友好的界面，用于查询、管理和探索 LightRAG 的功能。

## 前端配置

### 1. 安装 Bun
若未安装 Bun，需按照官方文档完成安装：[Bun 官方安装文档](https://bun.sh/docs/installation)

### 2. 安装项目依赖
进入 `lightrag_webui` 目录，执行以下命令安装依赖（锁定依赖版本，保证环境一致性）：
```bash
cd lightrag_webui
bun install --frozen-lockfile
```

### 3. 启动开发服务器
若需在开发模式下运行 WebUI，执行以下命令启动开发服务器：
```bash
bun run dev
```

### 4. 构建生产项目
执行以下命令打包项目，构建后的文件将输出到 `lightrag/api/webui` 目录，可用于生产部署：
```bash
bun run build
```

### 5. 脚本命令
以下是 `package.json` 中定义的常用脚本命令，可在 `lightrag_webui` 目录下执行：

| 命令                | 功能说明                     |
|---------------------|------------------------------|
| `bun install`       | 安装项目依赖                 |
| `bun run dev`       | 启动前端开发服务器           |
| `bun run build`     | 构建生产环境的前端项目       |
| `bun run lint`      | 运行代码检查工具（Linter）|
| `bun run test`      | 执行项目测试（待补充配置）|


## 前端目录结构
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
