# LightRAG WebUI

LightRAG WebUI 是一个基于 React 的 Web 界面，用于与 LightRAG 系统进行交互。它提供了一个用户友好的界面，用于查询、管理和探索 LightRAG 的功能。

## 安装

1.  **安装 Bun：**

    如果你尚未安装 Bun，请按照官方文档进行安装：[https://bun.sh/docs/installation](https://bun.sh/docs/installation)

2.  **安装依赖：**

    在 `lightrag_webui` 目录中，运行以下命令安装项目依赖：

    ```bash
    bun install --frozen-lockfile
    ```

3.  **构建项目：**

    运行以下命令构建项目：

    ```bash
    bun run build
    ```

    此命令将打包项目，并将构建后的文件输出到 `lightrag/api/webui` 目录。

## 开发

-   **启动开发服务器：**

    如果你想在开发模式下运行 WebUI，请使用以下命令：

    ```bash
    bun run dev
    ```

## 脚本命令

以下是 `package.json` 中定义的一些常用脚本命令：

-   `bun install`: 安装项目依赖。
-   `bun run dev`: 启动开发服务器。
-   `bun run build`: 构建项目。
-   `bun run lint`: 运行代码检查工具 (linter)。

## 4. 项目结构

```
lightrag_webui/
├── src/
│   ├── types/              # 类型定义
│   │   └── index.ts
│   ├── data/               # 模拟数据
│   │   └── mock.ts
│   ├── hooks/              # 自定义 Hooks
│   │   └── useTypewriter.ts
│   ├── components/         # 组件库
│   │   ├── common/         # 公共组件 (Navbar, Toast, Modal)
│   │   │   ├── TopNavbar.tsx
│   │   │   ├── UploadModal.tsx
│   │   │   └── Toast.tsx
│   │   ├── home/           # 首页专用组件
│   │   │   ├── HeroSearchCard.tsx
│   │   │   ├── DetailedOnboarding.tsx
│   │   │   └── ScenarioSection.tsx
│   │   └── settings/       # 设置相关组件
│   │       └── SettingsModal.tsx
│   ├── views/              # 页面级视图
│   │   ├── HomeView.tsx
│   │   ├── ChatView.tsx
│   │   └── DocumentsView.tsx
│   ├── App.tsx             # 主入口
│   └── main.tsx            # 应用入口
```
