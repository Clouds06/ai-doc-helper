## 一、样例集格式（JSONL）

样例集采用 **JSONL（每行一个 JSON 对象）** 格式，需严格遵循字段定义，每行对应一个评测用例。

### 字段说明

|   |   |   |
|---|---|---|
|字段|类型|说明|
|`q`|字符串|待评测的用户问题，需清晰、无歧义，贴合实际使用场景|
|`gold`|字符串数组|标准答案的核心关键点（至少 1 个），每个关键点简洁、可验证，无冗余信息|
|`doc_hint`|字符串数组|支撑答案的相关文档名称 / 路径（如 markdown 文件名），需精准指向有效文档|

### 完整样例（LightRAG 场景）

```jsonl
{"q": "LightRAG如何解决大型语言模型的幻觉问题？", "gold": ["通过将大型语言模型与外部知识检索相结合", "确保LLM输出基于实际文档", "提供上下文响应以显著减少幻觉"], "doc_hint": ["01_lightrag_overview.md"]}

{"q": "RAG系统需要哪三个主要组件？", "gold": ["检索系统（向量数据库或搜索引擎）", "嵌入模型（将文本转换为向量表示）", "大型语言模型（基于检索的上下文生成响应）"], "doc_hint": ["02_rag_architecture.md"]}

{"q": "LightRAG相比传统RAG方法有哪些改进？", "gold": ["更简单的API设计", "更快的检索性能", "更好的向量数据库集成", "优化的提示策略"], "doc_hint": ["03_lightrag_improvements.md"]}

{"q": "LightRAG支持哪些向量数据库？", "gold": ["ChromaDB", "Neo4j", "Milvus", "Qdrant", "MongoDB Atlas", "Redis", "内置的nano-vectordb"], "doc_hint": ["04_supported_databases.md"]}

{"q": "评估RAG系统质量的四个关键指标是什么？", "gold": ["忠实度（Faithfulness）", "答案相关性（Answer Relevance）", "上下文召回率（Context Recall）", "上下文精确率（Context Precision）"], "doc_hint": ["05_evaluation_and_deployment.md"]}

{"q": "LightRAG的核心优势是什么？", "gold": ["通过文档基础的响应提高准确性", "无需模型重训练即可获取最新信息", "通过专业文档集合实现领域专业知识", "通过避免昂贵的微调实现成本效益", "通过显示源文档确保透明度"], "doc_hint": ["01_lightrag_overview.md"]}

{"q": "LightRAG的部署选项有哪些？", "gold": ["Docker容器部署", "使用FastAPI的REST API服务器", "直接Python集成"], "doc_hint": ["05_evaluation_and_deployment.md"]}

{"q": "Neo4j数据库在LightRAG中有什么特点？", "gold": ["图数据库", "支持基于图的知识表示", "结合关系建模和向量功能"], "doc_hint": ["04_supported_databases.md"]}

{"q": "忠实度指标衡量什么？", "gold": ["答案是否基于检索的上下文中的事实", "检测LLM响应中的幻觉", "评估生成响应的事实准确性"], "doc_hint": ["05_evaluation_and_deployment.md"]}

{"q": "LightRAG的设计理念是什么？", "gold": ["优先考虑易用性而不牺牲质量", "在检索操作中结合速度和准确性", "在数据库和模型选择方面保持灵活性"], "doc_hint": ["03_lightrag_improvements.md"]}
```

## 二、评测口径

### 1. 准确率（Accuracy）

- **定义**：模型回答是否**至少覆盖****`gold`****数组中的一个核心关键点**（覆盖指明确提及关键点的核心信息，非隐含或模糊表述）。

- **判定规则**：

    - 符合：回答中明确出现任意一个`gold`关键点（如问题 1 回答 “LightRAG 的 RAGAS 包含忠实度指标”，覆盖`gold`中第一个关键点，判定为准确）；

    - 不符合：回答未提及任何`gold`关键点（如问题 1 回答 “LightRAG 支持自定义数据集”，无匹配关键点，判定为不准确）。


### 2. 引用率（Citation Rate）

- **定义**：模型回答是否**明确引用****`doc_hint`****中至少一个正确文档**（引用需标注文档名称 / 路径，如 “参考 lightrag\[_evaluation.md](_evaluation.md)”“来自 lightrag\[_faq.md](_faq.md)”）。

- **判定规则**：

    - 符合：回答中明确提及`doc_hint`中的任意一个文档名称（如问题 2 回答 “参考 lightrag\[_optimization.md](_optimization.md)，可通过分块优化降低幻觉”，判定为引用成功）；

    - 不符合：未引用任何文档，或引用`doc_hint`外的错误文档（如问题 2 引用 “ragas\[_install.md](_install.md)”，判定为引用失败）。


## 三、运行与结果记录

### 1. 前置准备

确保：

- 样例集 JSONL 文件已上传至系统指定目录（`/ai-doc-helper/lightrag/evaluation/sample_documents`）；

- LightRAG 服务正常运行，模型端点可访问；



### 2. 运行步骤

1. 访问评测页面：在浏览器中输入服务地址（如`http://localhost:8000/eval`），进入`/eval`页面；

2. 加载样例集：确认页面已加载目标 JSONL 样例集（若未自动加载，可手动选择文件上传）；

3. 启动评测：点击页面中的 “开始评测” 按钮，系统将自动遍历样例集所有问题，调用模型生成回答并完成指标计算。


### 3. 结果记录

#### （1）页面展示内容

页面将输出以下信息：

- 整体指标：准确率（所有用例的准确数 / 总用例数）、引用率（所有用例的引用成功数 / 总用例数）；

- 单例结果：每个问题的`q`、模型回答、准确率（√/×）、引用率（√/×）；

- 错误汇总：所有判定为 “不符合” 的用例编号及原因。


#### （2）控制台输出示例

```Plain
[EVAL] 评测开始，总用例数：3
[EVAL] Q1 - 准确率：√ | 引用率：√
[EVAL] Q2 - 准确率：√ | 引用率：×（引用了错误文档 'ragas_install.md'，预期是 'lightrag_optimization.md'）
[EVAL] Q3 - 准确率：×（未覆盖任何gold关键点，回答为'NaN结果可重启服务解决'） | 引用率：√
[EVAL] 评测完成 - 整体准确率：66.7% | 整体引用率：66.7%
```
## 一、样例集格式（JSONL）

样例集采用 **JSONL（每行一个 JSON 对象）** 格式，需严格遵循字段定义，每行对应一个评测用例。

### 字段说明

|   |   |   |
|---|---|---|
|字段|类型|说明|
|`q`|字符串|待评测的用户问题，需清晰、无歧义，贴合实际使用场景|
|`gold`|字符串数组|标准答案的核心关键点（至少 1 个），每个关键点简洁、可验证，无冗余信息|
|`doc_hint`|字符串数组|支撑答案的相关文档名称 / 路径（如 markdown 文件名），需精准指向有效文档|

### 完整样例（LightRAG 场景）

```jsonl
{"q": "LightRAG如何解决大型语言模型的幻觉问题？", "gold": ["通过将大型语言模型与外部知识检索相结合", "确保LLM输出基于实际文档", "提供上下文响应以显著减少幻觉"], "doc_hint": ["01_lightrag_overview.md"]}

{"q": "RAG系统需要哪三个主要组件？", "gold": ["检索系统（向量数据库或搜索引擎）", "嵌入模型（将文本转换为向量表示）", "大型语言模型（基于检索的上下文生成响应）"], "doc_hint": ["02_rag_architecture.md"]}

{"q": "LightRAG相比传统RAG方法有哪些改进？", "gold": ["更简单的API设计", "更快的检索性能", "更好的向量数据库集成", "优化的提示策略"], "doc_hint": ["03_lightrag_improvements.md"]}

{"q": "LightRAG支持哪些向量数据库？", "gold": ["ChromaDB", "Neo4j", "Milvus", "Qdrant", "MongoDB Atlas", "Redis", "内置的nano-vectordb"], "doc_hint": ["04_supported_databases.md"]}

{"q": "评估RAG系统质量的四个关键指标是什么？", "gold": ["忠实度（Faithfulness）", "答案相关性（Answer Relevance）", "上下文召回率（Context Recall）", "上下文精确率（Context Precision）"], "doc_hint": ["05_evaluation_and_deployment.md"]}

{"q": "LightRAG的核心优势是什么？", "gold": ["通过文档基础的响应提高准确性", "无需模型重训练即可获取最新信息", "通过专业文档集合实现领域专业知识", "通过避免昂贵的微调实现成本效益", "通过显示源文档确保透明度"], "doc_hint": ["01_lightrag_overview.md"]}

{"q": "LightRAG的部署选项有哪些？", "gold": ["Docker容器部署", "使用FastAPI的REST API服务器", "直接Python集成"], "doc_hint": ["05_evaluation_and_deployment.md"]}

{"q": "Neo4j数据库在LightRAG中有什么特点？", "gold": ["图数据库", "支持基于图的知识表示", "结合关系建模和向量功能"], "doc_hint": ["04_supported_databases.md"]}

{"q": "忠实度指标衡量什么？", "gold": ["答案是否基于检索的上下文中的事实", "检测LLM响应中的幻觉", "评估生成响应的事实准确性"], "doc_hint": ["05_evaluation_and_deployment.md"]}

{"q": "LightRAG的设计理念是什么？", "gold": ["优先考虑易用性而不牺牲质量", "在检索操作中结合速度和准确性", "在数据库和模型选择方面保持灵活性"], "doc_hint": ["03_lightrag_improvements.md"]}
```

## 二、评测口径

### 1. 准确率（Accuracy）

- **定义**：模型回答是否**至少覆盖****`gold`****数组中的一个核心关键点**（覆盖指明确提及关键点的核心信息，非隐含或模糊表述）。

- **判定规则**：

    - 符合：回答中明确出现任意一个`gold`关键点（如问题 1 回答 “LightRAG 的 RAGAS 包含忠实度指标”，覆盖`gold`中第一个关键点，判定为准确）；

    - 不符合：回答未提及任何`gold`关键点（如问题 1 回答 “LightRAG 支持自定义数据集”，无匹配关键点，判定为不准确）。


### 2. 引用率（Citation Rate）

- **定义**：模型回答是否**明确引用****`doc_hint`****中至少一个正确文档**（引用需标注文档名称 / 路径，如 “参考 lightrag\[_evaluation.md](_evaluation.md)”“来自 lightrag\[_faq.md](_faq.md)”）。

- **判定规则**：

    - 符合：回答中明确提及`doc_hint`中的任意一个文档名称（如问题 2 回答 “参考 lightrag\[_optimization.md](_optimization.md)，可通过分块优化降低幻觉”，判定为引用成功）；

    - 不符合：未引用任何文档，或引用`doc_hint`外的错误文档（如问题 2 引用 “ragas\[_install.md](_install.md)”，判定为引用失败）。


## 三、运行与结果记录

### 1. 前置准备

确保：

- 样例集 JSONL 文件已上传至系统指定目录（如`/eval/dataset/`）；

- LightRAG 服务正常运行，模型端点可访问；

- `/eval`页面依赖的前端 / 后端组件已加载完成。


### 2. 运行步骤

1. 访问评测页面：在浏览器中输入服务地址（如`http://localhost:8000/eval`），进入`/eval`页面；

2. 加载样例集：确认页面已加载目标 JSONL 样例集（若未自动加载，可手动选择文件上传）；

3. 启动评测：点击页面中的 “开始评测” 按钮，系统将自动遍历样例集所有问题，调用模型生成回答并完成指标计算。


### 3. 结果记录

#### （1）页面展示内容

页面将输出以下信息：

- 整体指标：准确率（所有用例的准确数 / 总用例数）、引用率（所有用例的引用成功数 / 总用例数）；

- 单例结果：每个问题的`q`、模型回答、准确率（√/×）、引用率（√/×）；

- 错误汇总：所有判定为 “不符合” 的用例编号及原因。


#### （2）控制台输出示例

```Plain
[EVAL] 评测开始，总用例数：3
[EVAL] Q1 - 准确率：√ | 引用率：√
[EVAL] Q2 - 准确率：√ | 引用率：×（引用了错误文档 'ragas_install.md'，预期是 'lightrag_optimization.md'）
[EVAL] Q3 - 准确率：×（未覆盖任何gold关键点，回答为'NaN结果可重启服务解决'） | 引用率：√
[EVAL] 评测完成 - 整体准确率：66.7% | 整体引用率：66.7%
```
![[截屏2025-11-28 17.09.48.png]]
#### （3）Notes 记录示例

Notes 用于详细标注单例问题，需清晰描述问题类型和具体错误，示例：

```Plain
Notes:
1. Q2: 引用了错误的文档 'ragas_install.md'，预期是 'lightrag_optimization.md'。
2. Q3: 未覆盖gold中的任何关键点（预期提及'API密钥配置错误'或'模型端点错误'），仅回答了无关的重启建议。
3. Q1: 准确率和引用率均符合预期，回答完整覆盖gold关键点且引用了正确文档 'lightrag_evaluation.md'。
```

#### （3）Notes 记录示例

Notes 用于详细标注单例问题，需清晰描述问题类型和具体错误，示例：

```Plain
Notes:
1. Q2: 引用了错误的文档 'ragas_install.md'，预期是 'lightrag_optimization.md'。
2. Q3: 未覆盖gold中的任何关键点（预期提及'API密钥配置错误'或'模型端点错误'），仅回答了无关的重启建议。
3. Q1: 准确率和引用率均符合预期，回答完整覆盖gold关键点且引用了正确文档 'lightrag_evaluation.md'。
```
