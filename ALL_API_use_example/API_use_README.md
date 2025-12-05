# LightRAG API 调用示例项目

本项目包含了与 LightRAG（检索增强生成系统）进行交互的 API 调用示例，涵盖文档管理、查询、数据操作和反馈等核心功能。

## 项目结构

```
PyCharmMiscProject/
├── documents_api.py              # 文档管理 API 调用示例（获取、分页查询、扫描）
├── documents_delete.py           # 文档删除 API 调用示例
├── documents_upload.py           # 文档上传 API 调用示例
├── document_type_filter.py       # 文档按类型筛选示例（分页查询扩展）
├── document_keyword_search.py    # 文档关键词搜索示例（分页查询扩展）
├── query_test.py                 # 查询 API 调用示例（非流式和流式）
├── query_score_calculation.py    # 检索得分计算验证示例（流式/非流式）
├── query_get_chunk_test.py       # 获取文档块相关功能
├── user_feedback.py              # 用户反馈 API 调用示例（点赞/点踩及效果验证）
└── API_use_README.md             # 项目说明文档
```

## 功能概述

### 1. 认证管理
- 支持通过用户名和密码获取认证令牌
- Bearer Token 认证方式集成

### 2. 文档管理
- **获取文档列表**：获取系统中所有文档的状态信息
- **分页获取文档**：支持分页查询大量文档，新增「文件类型筛选」「关键词搜索」扩展能力
- **扫描新文档**：扫描并处理新增或更新的文档
- **上传文档**：支持上传 Markdown 格式文档
- **删除文档**：根据文档 ID 删除指定文档
- **文档筛选/搜索**：按文件类型（如 md/txt/docx）筛选文档、按关键词检索文档内容/文件名

### 3. 查询功能
- **非流式查询**：同步获取完整查询结果
- **流式查询**：实时获取查询响应，支持增量展示
- **引用源追踪**：支持显示查询结果的来源文档
- **检索得分展示**：返回每个相关文档片段与查询语句的余弦相似度得分

### 4. 反馈机制
- **点赞/点踩**：支持用户对查询结果进行评价（Like/Dislike）。
- **自适应优化**：系统会自动记录“点踩”的负面反馈（如“回答太啰嗦”、“格式错误”），并将其作为“历史教训”动态注入到后续查询的 System Prompt 中，从而在不重新训练模型的情况下优化回答风格和逻辑。

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

### 1. 基础文档管理操作

运行文档管理 API 调用示例：

```bash
python documents_api.py
```

功能包括：
- 获取所有文档状态
- 分页获取文档列表（基础版，无筛选/搜索）
- 扫描新文档

### 2. 文档类型筛选（分页查询扩展）

按指定文件类型筛选文档（如 md/txt/docx）：

```bash
python document_type_filter.py
```

脚本默认测试「所有文档」「md 类型」「txt 类型」「docx 类型」的筛选效果，可修改脚本内 `test_filter` 入参调整筛选类型。

### 3. 文档关键词搜索（分页查询扩展）

按关键词检索文档（匹配文件名/内容）：

```bash
python document_keyword_search.py
```

脚本支持手动输入搜索关键词，输出匹配文档的 ID、文件路径和内容摘要，可直观验证搜索效果。

### 4. 文档上传

```bash
python documents_upload.py <文件路径>
```

如果不指定文件路径，将使用默认路径。

### 5. 文档删除

```bash
python documents_delete.py <文档ID>
```

### 6. 查询操作

运行查询 API 调用示例：

```bash
python query_test.py
```

功能包括：
- 非流式查询（完整响应）
- 流式查询（实时响应）

### 7. 检索得分验证

运行检索得分计算验证示例，验证流式与非流式接口的得分返回情况：

```bash
python query_score_calculation.py
```

**配置要求**：

为了直观验证片段内容与得分的一一对应关系，以及测试图谱召回的补位打分逻辑，脚本中默认配置如下：

- `mode`: 建议设置为 `hybrid` 或 `global`。

- `include_references`: 必须为 `True`（否则不返回引用对象）。

- `include_chunk_content`: 必须为 `True`（否则只返回分数列表，无法验证分数对应哪段文字）。

**功能包括**：
- 同时测试流式 (/query/stream) 和非流式 (/query) 接口
- 展示每个文档引用的详细信息
- 片段级得分展示：一一对应展示文档片段内容 (content) 和其对应的相似度得分 (scores)，直观验证检索相关性


### 8. 用户反馈与优化验证

运行反馈功能测试脚本，验证 “提问 -> 反馈 -> 优化” 的完整闭环：

```bash
python user_feedback.py
```

**功能包括**：
- 提交反馈：对查询返回的 query_id 提交 "like" 或 "dislike" 评价。
- 效果验证：脚本会自动演示“针对回答提出批评（如要求改用幼儿园老师语气） -> 再次提问 -> 验证回答风格是否改变”的流程。


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

#### 分页获取文档（核心扩展）
- **端点**：`POST /documents/paginated`
- **请求方式**：POST
- **请求体参数**：
  | 参数名          | 类型   | 必选 | 说明                                   | 示例值       |
  |-----------------|--------|------|----------------------------------------|--------------|
  | page            | int    | 否   | 页码（从 1 开始，默认 1）              | 1            |
  | page_size       | int    | 否   | 每页展示文档数量（默认 50）             | 10           |
  | sort_field      | string | 否   | 排序字段（默认 updated_at）            | updated_at   |
  | sort_direction  | string | 否   | 排序方向（desc/asc，默认 desc）        | desc         |
  | file_type       | string | 否   | 新增：文件类型筛选（匹配文件后缀）     | md、txt、docx|
  | keyword         | string | 否   | 新增：关键词搜索（匹配文件名、ID 或内容摘要）| 报告、2024   |
- **功能**：分页获取文档，支持按类型筛选、关键词搜索，适用于大量文档的精准检索场景
- **响应格式**：
  ```json
  {
    "documents": [...],  // 文档列表（包含 ID、file_path、content_summary 等）
    "pagination": {
      "total_count": 0,  // 匹配条件的文档总数
      "page": 1,
      "page_size": 10,
      "has_next": false, // 代码中包含此字段
      "has_prev": false  // 代码中包含此字段
    }
  }
  ```

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
  - `mode`：查询模式（**推荐使用 `"hybrid"` 或 `"global"`** 以获得最佳的检索覆盖率）
  - `include_references`：是否包含引用源（**必须设为 `true`** 才能获取 `scores`（检索得分）和引用列表）
  - `include_chunk_content`：是否包含具体内容（**建议设为 `true`**。设为 `true` 时，`references` 中将包含 `content` 列表，与 `scores` 列表一一对应，用于前端展示具体命中的文档片段）
  - `response_type`：响应格式
- **响应示例**（包含得分）：
  ```json
  {
    "query_id": "aca62e1b-910a-429c-8dd1-a118fd64d494", // 唯一查询ID，用于提交反馈
    "response": "RAG 是检索增强生成...",
    "references": [
      {
        "reference_id": "doc_1",
        "file_path": "data/rag_intro.pdf",
        "scores": [0.92, 0.85],  // [新增] 对应 content 中每个片段的相似度得分
        "content": [             // 仅当 include_chunk_content=true 时返回
           "片段1内容...",
           "片段2内容..."
        ]
      }
    ]
  }

#### 流式查询
- **端点**：`POST /query/stream`
- **参数**：
  - `query`：查询语句（如 "global"、"hybrid"）
  - `mode`：查询模式（**推荐使用 `"hybrid"` 或 `"global"`** 以获得最佳的检索覆盖率）
  - `stream`：设为 true 启用流式响应
  - `include_references`：是否包含引用源（**必须设为 `true`** 才能获取 `scores`（检索得分）和引用列表）
  - `include_chunk_content`：是否包含具体内容（**建议设为 `true`**。设为 `true` 时，`references` 中将包含 `content` 列表，与 `scores` 列表一一对应，用于前端展示具体命中的文档片段）
- **响应说明**：
  - 第一条消息通常包含 references 对象。
  - 第一条消息（或包含引用的消息）中会返回 `query_id` 字段，需前端保存该 ID 以便用户后续进行点赞/点踩操作。
  - references 对象中新增 scores 字段 (List[float])，代表每个文档片段与 Query 的余弦相似度（范围 0.0 ~ 1.0）。

### 反馈 API

#### 提交反馈
- **端点**：`POST /feedback`
- **功能**：提交用户对特定查询结果的评价。系统会将 Dislike 的评论作为负面约束，Like 的评论作为正面风格维持，注入到未来的 System Prompt 中。
- **请求体参数**：
  | 参数名            | 类型   | 必选 | 说明                                                         |
  | ----------------- | ------ | ---- | ------------------------------------------------------------ |
  | query_id          | string | 是   | 查询接口返回的唯一标识 (UUID)                                |
  | feedback_type     | string | 是   | 反馈类型：`"like"` (点赞) 或 `"dislike"` (点踩)              |
  | comment           | string | 否   | 具体的评价内容或改进建议（例如："太啰嗦了，请简练一点"）。**点踩时强烈建议填写此字段**，以便 LLM 学习。 |
  | original_query    | string | 否   | 原始查询问题（**建议填写**，以便将反馈与具体问题关联）                                 |
  | original_response | string | 否   | 原始回答内容                                 |

- **响应示例**：
  ```json
  {
    "status": "success",
    "message": "Feedback received"
  }
  ```

- **注意事项**：
  - 必须使用从 `/query` (非流式) 或 `/query/stream` (流式) **响应数据**中获取的 `query_id`。
  - 如果未提供正确的 `query_id`，反馈将无法关联到具体的检索上下文，导致优化效果失效。

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
3. 上传文档时，请确保文档格式为 Markdown 格式（其他格式可通过 `file_type` 筛选验证）
4. 执行删除操作前，请确认文档 ID 的正确性
5. 关键词搜索支持模糊匹配，搜索范围包括文档 ID、文件名和前 100 字摘要
6. `file_type` 参数值为文件后缀（建议不带点号），如 md/txt/docx，不区分大小写
7. **获取检索得分**：若需返回文档片段的相似度得分 (`scores`)，查询参数必须设置 `include_references: true`；若需核对得分对应的具体文本内容，需同时设置 `include_chunk_content: true`。建议使用 `hybrid` 或 `global` 模式以获得最佳的评分效果。

## 扩展与定制

本项目提供的示例脚本可根据实际需求进行扩展和定制，例如：
- 添加更多的请求参数
- 实现更复杂的错误处理逻辑
- 集成到其他应用程序中
- 添加用户界面进行交互操作
- 集成到自动化测试流程中
