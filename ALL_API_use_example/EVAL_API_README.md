# LightRAG 评测 API 使用文档

本文档提供了 LightRAG 评测 API 的详细使用说明，包括获取评测数据集和运行评测的功能。

## 功能概述

### 1. 评测数据集获取
- **端点**：`GET /eval/data`
- **功能**：获取系统中的评测数据集，包含测试问题和参考答案
- **应用场景**：查看可用的评测用例，为评测做准备

### 2. 评测执行
- **端点**：`POST /eval/run`
- **功能**：运行完整的 RAGAS 评测流程，生成评测结果
- **应用场景**：评估 LightRAG 系统的性能指标（忠实度、答案相关性、上下文召回率、上下文精确率）

## 环境要求

- Python 3.7+
- 依赖库：`requests`

## 安装说明

```bash
pip install requests
```

## 使用示例

### 1. 获取评测数据集

```python
import requests

base_url = "http://localhost:9621"
headers = {}

# 获取评测数据集
response = requests.get(f"{base_url}/eval/data", headers=headers)

if response.status_code == 200:
    eval_data = response.json()
    print(f"成功获取评测数据集，包含 {len(eval_data)} 条测试用例")
```

### 2. 运行评测

```python
import requests
import json
import time

base_url = "http://localhost:9621"
headers = {}

# 运行评测
params = {
    "eval_dataset_path": "/Users/wangzihao/PycharmProjects/new/eval_accuracy_citation/EVAL.jsonl",
    "output_format": "json",  # 输出格式：json或csv
    "skip_ingestion": True,  # 是否跳过文档摄取
    # "input_docs_dir": "/Users/wangzihao/PycharmProjects/new/lightrag/evaluation/sample_documents"  # 可选：文档目录
}

print("正在运行评测，请耐心等待...")
start_time = time.time()

response = requests.post(
    f"{base_url}/eval/run", 
    headers=headers, 
    params=params
)

end_time = time.time()
print(f"评测完成，耗时 {end_time - start_time:.2f} 秒")

if response.status_code == 200:
    # 保存结果
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    output_file = f"eval_results_{timestamp}.{params['output_format']}"
    
    with open(output_file, 'wb') as f:
        f.write(response.content)
    
    print(f"评测结果已保存到文件: {output_file}")
```

## API 详细说明

### 获取评测数据集

- **端点**：`GET /eval/data`
- **请求方式**：GET
- **请求参数**：无
- **响应格式**：JSON 数组，包含多个测试用例
- **响应字段**：
  | 字段名     | 类型   | 说明                 | 示例值                           |
  |------------|--------|----------------------|----------------------------------|
  | q          | string | 测试问题             | "LightRAG的主要特点是什么？"     |
  | gold       | string | 参考答案             | "LightRAG是一个基于图的RAG系统..."|
  | doc_hint   | string | 文档提示（可选）     | "lightrag_overview.md"          |

### 运行评测

- **端点**：`POST /eval/run`
- **请求方式**：POST
- **请求参数**：
  | 参数名               | 类型    | 必选 | 说明                                   | 示例值                                               |
  |----------------------|---------|------|----------------------------------------|------------------------------------------------------|
  | eval_dataset_path    | string  | 否   | 评测数据集JSONL文件路径                | "/Users/wangzihao/PycharmProjects/new/eval_accuracy_citation/EVAL.jsonl" |
  | input_docs_dir       | string  | 否   | 要摄取的文档目录路径                   | "/Users/wangzihao/PycharmProjects/new/lightrag/evaluation/sample_documents" |
  | skip_ingestion       | boolean | 否   | 是否跳过文档摄取（默认false）          | true                                                 |
  | output_format        | string  | 否   | 输出格式（json或csv，默认json）        | "json"                                               |

- **响应格式**：
  - JSON：包含详细评测结果的JSON数组
  - CSV：包含详细评测结果的CSV文件

- **评测指标说明**：
  | 指标名               | 类型   | 说明                                   |
  |----------------------|--------|----------------------------------------|
  | faithfulness         | float  | 答案忠实度（0-1），越高表示越忠实于上下文 |
  | answer_relevancy     | float  | 答案相关性（0-1），越高表示越相关于问题 |
  | context_recall       | float  | 上下文召回率（0-1），越高表示召回越全面 |
  | context_precision    | float  | 上下文精确率（0-1），越高表示越精确     |

## 配置说明

所有 API 调用的服务器地址默认为：`http://localhost:9621`

如需修改服务器地址，请在脚本中修改 `base_url` 变量：

```python
base_url = "http://your_server_address:port"
```

## 认证机制

系统支持 JWT Bearer Token 认证方式，默认情况下可以不使用认证。如需认证，可在脚本中添加令牌：

```python
def get_token(base_url, username, password):
    response = requests.post(
        f"{base_url}/login", json={"username": username, "password": password}
    )
    if response.status_code == 200:
        return response.json()["access_token"]
    return None

# 获取令牌
token = get_token(base_url, "your_username", "your_password")

# 设置请求头
headers = {}
if token:
    headers["Authorization"] = f"Bearer {token}"
```

## 错误处理

所有 API 调用都包含了完善的错误处理机制：
- HTTP 状态码检查
- 异常捕获与提示
- 响应格式验证

错误信息会以友好的方式输出到控制台。

## 注意事项

1. 确保 LightRAG 服务正在运行，且可通过配置的地址访问
2. 运行评测前，请确保已配置正确的 API 密钥（OPENAI_API_KEY 或 EVAL_LLM_BINDING_API_KEY）
3. 首次运行评测时，建议设置 `skip_ingestion=False` 以确保文档正确摄取
4. 评测执行时间较长，取决于测试用例数量和系统性能
5. 评测结果默认保存为带时间戳的文件

## 示例脚本

完整的示例脚本可参考：`/Users/wangzihao/PycharmProjects/new/ALL_API_use_example/eval_api_test.py`

该脚本包含了完整的 API 调用流程，包括获取评测数据集和运行评测的功能。