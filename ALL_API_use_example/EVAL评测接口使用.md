# LightRAG 评测接口使用指南

## 1. 项目概述

### 1.1 什么是 LightRAG 评测接口

调用专门的 API 接口，对 RAG 系统生成的答案进行多维度的质量评估，包括：
- **忠实度（Faithfulness）**：评估答案是否基于检索到的上下文事实
- **答案相关性（Answer Relevancy）**：评估答案与问题的相关程度
- **上下文召回率（Context Recall）**：评估是否检索到了所有相关信息
- **上下文精确率（Context Precision）**：评估检索到的信息质量和相关性

### 1.2 系统组成

- **配置文件**：`settings.py` - 用于配置评测系统的各种参数
- **API 调用示例**：`do_eval_test.py` - 演示如何调用评测 API
- **评测结果**：`eval_results_*.json` - 存储评测结果的 JSON 文件

## 2. 快速开始

### 2.1 安装依赖

在使用前，确保安装了必要的依赖包：

```bash
pip install requests python-dotenv
```

### 基本使用流程

1. **配置系统**：确保`settings.py` 文件中的配置项没问题（路径最有可能出问题，若出现问题查看`settings.py`有具体说明）
2. **启动服务**：确保 LightRAG 服务正在运行（默认端口 9621）
3. **调用 API**：运行 `do_eval_test.py` 或自定义调用脚本返回 json 数据
4. **查看结果**：分析生成的 `eval_results_*.json` 文件（已经上传了一个结果供参考`eval_accuracy_citation/eval_results_20251209_131857.json`）

### 2.2 文档上传与环境配置

#### 2.2.1 上传评测文档到 lightRAG 后端

上传文档
- 直接将准备好的文档上传等待处理
- 默认的问题集需要上传在`lightrag/evaluation/sample_documents `目录下关于LightRAG框架的文档：`01_lightrag_overview.md`、`02_rag_architecture.md` 等

**重要提示**：

- 文档内容越全面，评测结果越准确
- 确保文档与您要测试的问题相关

#### 2.2.2 配置环境变量（.env文件）

**步骤1：找到.env文件**
- 首先找到项目根目录下的 `.env` 文件：
  


**步骤2：设置LLM评测模型配置**

- 找到文件中评测模型的位置（大约473-485行）：

**步骤3：理解并设置配置项**
| 配置项                           | 说明                | 操作                        |
| -------------------------------- | ------------------- | --------------------------- |
| `EVAL_LLM_MODEL`                 | 评测用的LLM模型名称 | 填对话模型名称              |
| `EVAL_LLM_BINDING_API_KEY`       | 评测模型的API密钥   | 确保这里填入了正确的API密钥 |
| `EVAL_LLM_BINDING_HOST`          | 评测模型的服务地址  | 填对话模型的网址            |
| `EVAL_EMBEDDING_MODEL`           | 嵌入模型名称        | 填嵌入模型名称              |
| `EVAL_EMBEDDING_BINDING_API_KEY` | 嵌入模型的API密钥   | 确保这里填入了正确的API密钥 |
| `EVAL_EMBEDDING_BINDING_HOST`    | 嵌入模型的服务地址  | 填嵌入模型的网址            |

**步骤4：保存配置文件**

- 修改完成后，记得保存 `.env` 文件
- 确保没有删除或修改其他重要配置项

#### 2.2.3 验证配置是否正确

**简单验证方法**：
1. 运行 `do_eval_test.py` 脚本
2. 如果没有出现 "API key错误" 或 "连接失败" 等错误提示，说明配置基本正确
3. 如果出现错误，请检查 `.env` 文件中的API密钥和服务地址是否正确

**常见错误排查**：
- `API key错误`：检查 `.env` 文件中的API密钥是否正确
- `连接失败`：检查服务地址是否正确，确保网络连接正常

通过以上步骤，您就完成了文档上传和环境配置，可以开始使用LightRAG评测系统了！

### 

## 3. API 调用教程

### 3.1 API 概述

评测系统提供了一个 `do_eval` API 接口，用于执行评测任务。

- **API 地址**：`http://localhost:9621/eval/do_eval`
- **请求方法**：`POST`

### 3.2 完整调用示例 (`do_eval_test.py`)

以下是 `do_eval_test.py` 文件的核心内容解析：

#### 3.2.1 主函数

```python
def main():
    # API 服务器地址
    base_url = "http://localhost:9621"

    # 可选：获取认证令牌
    # token = get_token(base_url, "your_username", "your_password")
    token = None  # 如果不需要认证，保持为 None

    # 根据是否有 token 设置 headers
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    # 测试完整评测流程
    try:
        response = requests.post(f"{base_url}/eval/do_eval", headers=headers)
        # 处理响应...
    except Exception as e:
        print(f"评测请求发生错误: {str(e)}")
```

**使用说明**：
1. 设置 `base_url` 为 API 服务器地址（默认：`http://localhost:9621`）
2. 根据需要获取并设置认证令牌
3. 构造请求头 `headers`
4. 发送 `POST` 请求到 `eval/do_eval` 接口

#### 3.2.2 单条评测

```python
# 测试单条评测（指定 line_number）
try:
    response = requests.post(
        f"{base_url}/eval/do_eval",
        params={"line_number": 1},  # 测试第 1 条数据
        headers=headers
    )
    # 处理响应...
except Exception as e:
    print(f"单条评测请求发生错误: {str(e)}")
```

**使用说明**：
- 通过 `params` 参数指定 `line_number`，可以只评测特定的数据行
- `line_number` 从 1 开始计数

### 3.3 运行示例脚本

直接运行 `do_eval_test.py` 文件：

```bash
python do_eval_test.py
```

## 4. 评测结果解析

### 4.1 结果文件格式

评测完成后，系统会生成一个名为 `eval_results_*.json` 的结果文件，包含详细的评测信息。

### 4.2 结果结构详解

以下是结果文件的核心结构：

#### 4.2.1 整体结构

```json
{
  "detailed_results": [
    {
      "question": "问题文本",
      "answer": "RAG 系统生成的答案",
      "contexts": ["检索到的上下文 1", "检索到的上下文 2", ...],
      "ground_truth": "黄金标准答案",
      "faithfulness": 0.0-1.0,  // 忠实度分数
      "answer_relevancy": 0.0-1.0,  // 答案相关性分数
      "context_recall": 0.0-1.0,  // 上下文召回率
      "context_precision": 0.0-1.0,  // 上下文精确率
      "reasoning": {
        "faithfulness": "忠实度评分理由",
        "answer_relevancy": "答案相关性评分理由",
        "context_recall": "上下文召回率评分理由",
        "context_precision": "上下文精确率评分理由"
      },
      "user_input": "原始用户输入",
      "retrieved_contexts": ["实际检索到的上下文 1", ...]
    },
    // 更多评测结果...
  ]
}
```

#### 4.2.2 字段说明

| 字段 | 类型 | 描述 |
|------|------|------|
| `question` | 字符串 | 用于评测的问题文本 |
| `answer` | 字符串 | RAG 系统生成的答案 |
| `contexts` | 数组 | 用于生成答案的参考上下文 |
| `ground_truth` | 字符串 | 黄金标准答案，用于对比评估 |
| `faithfulness` | 浮点数 | 忠实度评分（0.0-1.0），越接近 1 表示越忠实于上下文 |
| `answer_relevancy` | 浮点数 | 答案相关性评分（0.0-1.0），越接近 1 表示与问题越相关 |
| `context_recall` | 浮点数 | 上下文召回率（0.0-1.0），越接近 1 表示检索越完整 |
| `context_precision` | 浮点数 | 上下文精确率（0.0-1.0），越接近 1 表示检索质量越高 |
| `reasoning` | 对象 | 包含各个指标的评分理由 |
| `user_input` | 字符串 | 原始的用户查询输入 |
| `retrieved_contexts` | 数组 | RAG 系统实际检索到的上下文 |

### 4.3 示例结果解析

可以查看eval_accuracy_citation 文件夹下的 `eval_results_20251209_131857.json` 中的一个示例结果：

```json
{
  "question": "LightRAG如何解决大型语言模型的幻觉问题？",
  "answer": "LightRAG 通过将大型语言模型与外部知识检索相结合，并确保其响应基于实际文档，从而有效解决大型语言模型的幻觉问题。...",
  "faithfulness": 1.0,
  "answer_relevancy": 1.0,
  "context_recall": 1.0,
  "context_precision": 0.8,
  "reasoning": {
    "faithfulness": "答案完全基于黄金标准答案的核心要点，没有编造或偏离。...",
    "answer_relevancy": "答案紧密聚焦于问题核心，直接回答LightRAG如何解决幻觉问题，没有无关冗余内容。...",
    "context_recall": "黄金答案的所有核心要点都被覆盖，没有遗漏。...",
    "context_precision": "引用的文档与问题直接相关，但存在引用优先级问题。..."
  }
}
```

**解读**：
- 该答案在忠实度、相关性和召回率方面表现完美（均为 1.0）
- 上下文精确率为 0.8，略低的原因是引用文档存在优先级问题
- 每个评分都有详细的理由说明，便于理解评分依据

## 5. 常见问题与解决方案

### 5.1 FileNotFoundError: [Errno 2] No such file or directory: 'EVAL.jsonl'

**问题**：找不到 EVAL.jsonl 文件

**解决方案**：
1. 确保 EVAL.jsonl 文件存在于 `settings.py` 所在目录
2. 或修改 `settings.py` 中的 `eval_jsonl_path` 为正确的文件路径

### 5.2 ConnectionError: HTTPConnectionPool(host='localhost', port=9621): Max retries exceeded

**问题**：无法连接到 API 服务器

**解决方案**：
1. 确保 LightRAG 服务正在运行
2. 检查服务端口是否正确（默认 9621）
3. 检查网络连接是否正常

### 5.3 PermissionError: [Errno 13] Permission denied

**问题**：没有权限读取或写入文件

**解决方案**：
1. 检查文件或目录的权限设置
2. 确保当前用户有读写权限
3. 尝试以管理员身份运行程序

### 5.4 ValueError: No JSON object could be decoded

**问题**：JSON 文件格式不正确

**解决方案**：
1. 检查 EVAL.jsonl 文件的格式是否正确
2. 确保每行都是一个有效的 JSON 对象
3. 使用在线 JSON 验证工具检查文件格式

## 6. 高级用法

### 6.1 评测参数说明

根据需要，可以修改 `settings.py` 中的各种配置参数：

#### 6.1.1 默认评测模型配置

```python
# 修改默认评测模型
DEFAULT_EVAL_LLM_MODEL = "deepseek-chat"
```

**参数说明：**
- **作用**：指定用于评测任务的默认LLM模型
- **位置**：`settings.py` 文件第70行
- **默认值**：`deepseek-chat`
- **修改方法**：将字符串替换为您要使用的LLM模型名称
- **注意事项**：
  - 模型名称必须与您在 `.env` 文件中配置的 `EVAL_LLM_MODEL` 兼容
  - 模型需要支持对话和评分功能

#### 6.1.2 内容预览长度配置

```python
# 修改内容预览长度
REFERENCE_CONTENT_PREVIEW_LENGTH = 200
```

**参数说明：**
- **作用**：设置评测结果中参考内容的预览长度限制
- **位置**：`settings.py` 文件第81行
- **默认值**：`200`（字符）
- **修改方法**：将数字替换为您想要的预览长度
- **注意事项**：
  - 预览长度影响结果文件的可读性
  - 过长可能导致输出文件过大，过短可能无法完整展示关键信息

#### 6.1.3 评测结果输出目录配置

```python
# 修改输出目录
OUTPUT_DIR = os.path.join(project_root, "eval_accuracy_citation")
```

**参数说明：**
- **作用**：指定评测结果文件的保存目录
- **位置**：`settings.py` 文件第104行
- **默认值**：项目根目录下的 `eval_accuracy_citation` 文件夹
- **修改方法**：可以使用相对路径或绝对路径指定新的输出目录
- **示例**：
  ```python
  # 使用相对路径（推荐保持相对路径以提高可移植性）
  OUTPUT_DIR = os.path.join(project_root, "my_eval_results")
  
  # 使用绝对路径（适用于需要固定输出位置的场景）
  OUTPUT_DIR = "/Users/your_username/my_eval_results"
  ```
- **注意事项**：
  - 确保指定的目录存在或程序有创建目录的权限
  - 使用绝对路径时注意跨平台兼容性（Windows使用`\`或`/`，Unix使用`/`）

#### 6.1.4 其他重要配置参数

**1. 评测数据文件路径**
```python
EVAL_JSONL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "EVAL.jsonl")
```

**参数说明：**
- **作用**：指定评测问题数据文件的位置
- **位置**：`settings.py` 文件第26行
- **默认值**：当前文件所在目录下的 `EVAL.jsonl` 文件
- **注意事项**：
  - 此文件包含用于RAG系统评测的问题、黄金答案和文档提示
  - 文件格式为JSON Lines（每行一个JSON对象）
  - 如果遇到路径问题，可以修改为绝对路径

**2. 环境变量文件路径**
```python
ENV_FILE_PATH = os.path.join(project_root, ".env")
```

**参数说明：**
- **作用**：指定包含环境变量的 `.env` 文件路径
- **位置**：`settings.py` 文件第40行
- **默认值**：项目根目录下的 `.env` 文件
- **注意事项**：
  - 此文件包含LLM API密钥、服务地址等敏感信息
  - 程序会自动尝试从多个位置加载此文件

**3. LLM温度设置**
```python
LLM_TEMPERATURE = 0.1
```

**参数说明：**
- **作用**：控制LLM生成内容的随机性
- **位置**：`settings.py` 文件第71行
- **默认值**：`0.1`（低温度确保评分稳定性）
- **注意事项**：
  - 温度值范围：0.0-2.0
  - 较低温度使输出更稳定、更可预测
  - 较高温度使输出更具创造性，但可能影响评分一致性

通过合理配置这些参数，您可以根据具体需求调整评测系统的行为，获得更准确的评测结果。

