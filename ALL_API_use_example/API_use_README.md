# LightRAG API 调用示例项目

本项目包含了与 LightRAG（检索增强生成系统）进行交互的 API 调用示例，涵盖文档管理、查询和数据操作等核心功能。

## 项目结构

```
PyCharmMiscProject/
├── documents_api.py      # 文档管理 API 调用示例（获取、分页查询、扫描）
├── documents_delete.py   # 文档删除 API 调用示例
├── documents_upload.py   # 文档上传 API 调用示例
├── query_test.py         # 查询 API 调用示例（非流式和流式）
├── query_get_chunk_test.py # 获取文档块相关功能
└── API_use_README.md             # 项目说明文档
```

## 功能概述

### 1. 认证管理
- 支持通过用户名和密码获取认证令牌
- Bearer Token 认证方式集成

### 2. 文档管理
- **获取文档列表**：获取系统中所有文档的状态信息
- **分页获取文档**：支持分页查询大量文档
- **扫描新文档**：扫描并处理新增或更新的文档
- **上传文档**：支持上传 Markdown 格式文档
- **删除文档**：根据文档 ID 删除指定文档

### 3. 查询功能
- **非流式查询**：同步获取完整查询结果
- **流式查询**：实时获取查询响应，支持增量展示
- **引用源追踪**：支持显示查询结果的来源文档

## 环境要求

- Python 3.7+
- 依赖库：`requests`

## 安装说明

1. 克隆或下载本项目
2. 安装依赖：

```bash
pip install requests
```

## 使用示例

### 1. 文档管理操作

运行文档管理 API 调用示例：

```bash
python documents_api.py
```

功能包括：
- 获取所有文档状态
- 分页获取文档列表
- 扫描新文档

### 2. 文档上传

```bash
python documents_upload.py <文件路径>
```

如果不指定文件路径，将使用默认路径。

### 3. 文档删除

```bash
python documents_delete.py <文档ID>
```

### 4. 查询操作

运行查询 API 调用示例：

```bash
python query_test.py
```

功能包括：
- 非流式查询（完整响应）
- 流式查询（实时响应）

## API 详细说明

### 认证机制

系统支持 JWT Bearer Token 认证方式，默认情况下可以不使用认证。如需认证，可在相应脚本中取消注释并填写用户名和密码：

```python
# token = get_token(base_url, "your_username", "your_password")
```

### 文档管理 API

#### 获取所有文档
- **端点**：`GET /documents`
- **功能**：获取系统中所有文档的详细信息
- **响应格式**：包含文档路径、状态、创建时间、更新时间和块数等信息

#### 分页获取文档
- **端点**：`POST /documents/paginated`
- **参数**：`page`（页码）、`page_size`（每页数量）
- **功能**：分页获取文档，适用于大量文档场景

#### 扫描新文档
- **端点**：`POST /documents/scan`
- **功能**：扫描并处理系统中新添加或更新的文档
- **响应**：包含新增、更新和错误的文档数量

#### 上传文档
- **端点**：`POST /documents/upload`
- **参数**：文件对象（multipart/form-data）
- **功能**：上传 Markdown 格式文档到系统

#### 删除文档
- **端点**：`DELETE /documents/delete_document`
- **参数**：
  - `doc_ids`：文档 ID 数组
  - `delete_file`：是否同时删除文件
  - `delete_llm_cache`：是否清除相关 LLM 缓存

### 查询 API

#### 非流式查询
- **端点**：`POST /query`
- **参数**：
  - `query`：查询语句
  - `mode`：查询模式（如 "mix"、"hybrid"）
  - `include_references`：是否包含引用源
  - `include_chunk_content`：是否包含具体内容
  - `response_type`：响应格式

#### 流式查询
- **端点**：`POST /query/stream`
- **参数**：
  - `query`：查询语句
  - `mode`：查询模式
  - `stream`：设为 true 启用流式响应
  - `include_references`：是否包含引用源

## 配置说明

所有脚本中的 API 服务器地址默认为：`http://localhost:9621`

如需修改服务器地址，请在相应脚本的 `base_url` 或 `api_url` 变量中进行更改。

## 错误处理

所有 API 调用都包含了完善的错误处理机制，包括：
- HTTP 状态码检查
- 异常捕获与提示
- 响应格式验证

错误信息会以友好的方式输出到控制台。

## 注意事项

1. 确保 LightRAG 服务正在运行，且可通过配置的地址访问
2. 对于认证需求，请联系系统管理员获取用户名和密码
3. 上传文档时，请确保文档格式为 Markdown 格式
4. 执行删除操作前，请确认文档 ID 的正确性

## 扩展与定制

本项目提供的示例脚本可根据实际需求进行扩展和定制，例如：
- 添加更多的请求参数
- 实现更复杂的错误处理逻辑
- 集成到其他应用程序中
- 添加用户界面进行交互操作
