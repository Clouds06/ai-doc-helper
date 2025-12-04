import os
from dotenv import load_dotenv
from openai import OpenAI

# 加载 .env 文件中的环境变量
load_dotenv()


def openai_complete_if_cache(
    model=None, prompt=None, system_prompt=None, history_messages=[], **kwargs
) -> str:
    # 从环境变量读取配置
    # llm_binding = os.getenv("LLM_BINDING", "openai")
    llm_binding_host = os.getenv("LLM_BINDING_HOST")
    llm_binding_api_key = os.getenv("LLM_BINDING_API_KEY")

    # 如果没有指定模型，则从环境变量读取
    if model is None:
        model = os.getenv("LLM_MODEL", "gpt-4o-mini")

    # 创建 OpenAI 客户端（支持 OpenAI 兼容的 API）
    openai_client = OpenAI(api_key=llm_binding_api_key, base_url=llm_binding_host)

    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.extend(history_messages)
    messages.append({"role": "user", "content": prompt})

    response = openai_client.chat.completions.create(
        model=model, messages=messages, **kwargs
    )
    return response.choices[0].message.content


if __name__ == "__main__":
    description = ""
    prompt = f"""
给定以下数据集描述：

{description}

请完成以下要求：

1. 识别 5 类可能会使用该数据集的潜在用户；

2. 为每类用户列出 5 项他们会利用该数据集执行的具体任务；

3. 针对每个（用户类型 + 任务）组合，生成 10 个需要对整个数据集有高阶理解（而非仅提取局部信息）的问题。

请严格按照以下格式输出结果：

- 用户 1：[用户类型描述，需明确身份、背景及使用数据集的核心诉求]

  - 任务 1：[具体任务描述，需说明用户通过该任务想要达成的目标]

    - 问题 1：[需基于数据集整体逻辑、趋势、关联或深层价值设计]

    - 问题 2：

    - 问题 3：

    - 问题 4：

    - 问题 5：

    - 问题 6：

    - 问题 7：

    - 问题 8：

    - 问题 9：

    - 问题 10：

  - 任务 2：[具体任务描述]

    - 问题 1：

    - 问题 2：

    - ...（依次补充至问题 10）

  - 任务 3：[具体任务描述]

    - ...（同上）

  - 任务 4：[具体任务描述]

    - ...（同上）

  - 任务 5：[具体任务描述]

    - ...（同上）

- 用户 2：[用户类型描述]

  - 任务 1：[具体任务描述]

    - 问题 1：

    - ...（依次补充至问题 10）

  - ...（依次补充至任务 5）

- 用户 3：[用户类型描述]

  - ...（同上）

- 用户 4：[用户类型描述]

  - ...（同上）

- 用户 5：[用户类型描述]

  - ...（同上）

关键说明（确保生成质量）

1. 「高阶理解问题」定义：需结合数据集的整体结构、数据间的关联关系、长期趋势、潜在规律、跨维度对比或业务价值，而非仅查询单个数据点、局部字段含义等基础信息；

2. 用户类型需具备差异性（如不同行业、不同角色、不同目标），避免重复；

3. 任务描述需具体可落地（如"基于数据集优化电商平台的商品推荐策略"而非"分析数据"）；

4. 问题需与对应用户的身份和任务强相关，避免泛化或无关的提问。

    """

    # 不指定模型，让函数从环境变量读取
    result = openai_complete_if_cache(prompt=prompt)

    file_path = "./queries.txt"
    with open(file_path, "w") as file:
        file.write(result)

    print(f"Queries written to {file_path}")
