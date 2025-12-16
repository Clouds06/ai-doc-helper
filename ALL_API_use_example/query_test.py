# LightRAG API调用示例（前端模式）
import requests
import json


def get_api_key():
    """
    获取API密钥的函数
    如果API未启用认证，可以返回None
    """
    # 这里可以从配置文件、环境变量或用户输入获取API密钥
    # 例如: return os.environ.get('LIGHTRAG_API_KEY')
    return None  # 如果不需要认证，保持为None


def main():
    # API服务器地址
    base_url = "http://localhost:9621"

    # 获取API密钥
    api_key = get_api_key()

    # 设置headers
    headers = {
        "Content-Type": "application/json"
    }
    if api_key:
        headers["X-API-Key"] = api_key

    print("=== 测试非流式查询 ===")
    # 非流式查询示例 - 匹配前端模式
    data = {
        "query": "What is RAGAS",
        "mode": "hybrid",  # 前端使用的默认模式
        "history": [],  # 对话历史，前端使用history而不是conversation_history
        "include_references": True,
        "include_chunk_content": True,
        "stream": False,
        # 上下文相关参数
        "top_k": 10,  # 检索的实体/关系数量
        "chunk_top_k": 5,  # 检索的文本块数量
        "max_entity_tokens": 2000,  # 实体上下文token限制
        "max_relation_tokens": 2000,  # 关系上下文token限制
        "max_total_tokens": 8000,  # 总上下文token限制
        "hl_keywords": ["RAGAS", "evaluation"],  # 高级关键词
        "ll_keywords": ["metrics", "faithfulness"],  # 低级关键词
        "enable_rerank": True,  # 启用重排序
        "response_type": "Multiple Paragraphs",  # 响应格式
        "user_prompt": "Please provide a detailed explanation with examples."  # 用户提示
    }

    try:
        response = requests.post(f"{base_url}/query", headers=headers, json=data)

        if response.status_code == 200:
            result = response.json()
            print("\n回答:", result["response"])
            if result.get("references", []):
                print("\n引用源:")
                for ref in result["references"]:
                    print(f"- {ref.get('file_path', '未知文件')}")
        else:
            print(f"请求失败，状态码: {response.status_code}")
            print("错误信息:", response.text)

    except Exception as e:
        print(f"请求发生错误: {str(e)}")

    print("\n\n=== 测试仅获取上下文（不生成回答） ===")
    # 仅获取上下文示例 - 用于调试和评估
    context_data = {
        "query": "What is RAGAS",
        "mode": "hybrid",
        "only_need_context": True,  # 只返回上下文，不生成回答
        "include_references": True,
        "include_chunk_content": True,
        "top_k": 5,  # 减少检索数量用于测试
        "chunk_top_k": 3,  # 减少文本块数量
        "hl_keywords": ["RAGAS"],  # 关键词筛选
        "ll_keywords": ["evaluation", "metrics"]
    }

    try:
        response = requests.post(f"{base_url}/query", headers=headers, json=context_data)

        if response.status_code == 200:
            result = response.json()
            print("\n上下文信息:")
            print(f"检索到的实体数量: {len(result.get('entities', []))}")
            print(f"检索到的关系数量: {len(result.get('relationships', []))}")
            print(f"检索到的文本块数量: {len(result.get('chunks', []))}")
            
            if result.get("references", []):
                print("\n引用源:")
                for ref in result["references"]:
                    print(f"- {ref.get('file_path', '未知文件')}")
                    if ref.get('content'):
                        print(f"  内容预览: {ref['content'][0][:100]}...")
        else:
            print(f"请求失败，状态码: {response.status_code}")
            print("错误信息:", response.text)

    except Exception as e:
        print(f"请求发生错误: {str(e)}")

    print("\n\n=== 测试不同查询模式 ===")
    # 测试不同模式的上下文检索效果
    modes = ["local", "global", "hybrid", "mix"]
    
    for mode in modes:
        print(f"\n--- {mode.upper()} 模式 ---")
        mode_data = {
            "query": "What is RAGAS",
            "mode": mode,
            "only_need_context": True,
            "include_references": True,
            "top_k": 3,
            "chunk_top_k": 2
        }
        
        try:
            response = requests.post(f"{base_url}/query", headers=headers, json=mode_data)
            
            if response.status_code == 200:
                result = response.json()
                print(f"实体: {len(result.get('entities', []))}, "
                      f"关系: {len(result.get('relationships', []))}, "
                      f"文本块: {len(result.get('chunks', []))}")
            else:
                print(f"失败: {response.status_code}")
                
        except Exception as e:
            print(f"错误: {str(e)}")

    print("\n\n=== 测试关键词增强查询 ===")
    # 使用关键词增强上下文检索
    keyword_data = {
        "query": "evaluation metrics for RAG systems",
        "mode": "hybrid",
        "hl_keywords": ["RAG", "evaluation", "metrics", "faithfulness", "relevance"],
        "ll_keywords": ["precision", "recall", "accuracy"],
        "include_references": True,
        "include_chunk_content": True,
        "top_k": 8,
        "chunk_top_k": 5,
        "user_prompt": "Focus on quantitative metrics and evaluation methodologies."
    }

    try:
        response = requests.post(f"{base_url}/query", headers=headers, json=keyword_data)

        if response.status_code == 200:
            result = response.json()
            print("\n回答:", result["response"])
            if result.get("references", []):
                print(f"\n引用源数量: {len(result['references'])}")
                for i, ref in enumerate(result["references"][:3]):  # 只显示前3个引用
                    print(f"- {ref.get('file_path', '未知文件')}")
                    if ref.get('content'):
                        print(f"  内容: {ref['content'][0][:150]}...")
        else:
            print(f"请求失败，状态码: {response.status_code}")
            print("错误信息:", response.text)

    except Exception as e:
        print(f"请求发生错误: {str(e)}")

    print("\n\n=== 测试流式查询 ===")
    # 流式查询示例 - 匹配前端模式
    stream_data = {
        "query": "What is RAGAS",
        "mode": "hybrid",  # 前端使用的默认模式
        "history": [],  # 对话历史，前端使用history而不是conversation_history
        "include_references": True,
        "include_chunk_content": True,
        "system_prompt": None,  # 系统提示
        "chunk_top_k": None,  # 检索文本块数量
        "temperature": None,  # LLM生成随机性
        "stream": True,
        # 上下文相关参数
        "top_k": 10,  # 检索的实体/关系数量
        "chunk_top_k": 5,  # 检索的文本块数量
        "max_entity_tokens": 2000,  # 实体上下文token限制
        "max_relation_tokens": 2000,  # 关系上下文token限制
        "max_total_tokens": 8000,  # 总上下文token限制
        "hl_keywords": ["RAGAS", "evaluation"],  # 高级关键词
        "ll_keywords": ["metrics", "faithfulness"],  # 低级关键词
        "enable_rerank": True,  # 启用重排序
        "response_type": "Multiple Paragraphs",  # 响应格式
        "user_prompt": "Please provide a detailed explanation with examples."  # 用户提示
    }

    try:
        response = requests.post(
            f"{base_url}/query/stream",
            headers=headers,
            json=stream_data,
            stream=True,  # 启用流式响应
        )

        if response.status_code == 200:
            print("\n流式响应开始:")
            for line in response.iter_lines():
                if line:
                    try:
                        data = json.loads(line.decode("utf-8"))
                        if "error" in data:
                            print(f"\n错误: {data['error']}")
                        elif "references" in data and data.get("references", []):
                            print("\n引用源:")
                            for ref in data["references"]:
                                print(f"- {ref.get('file_path', '未知文件')}")
                        elif "query_id" in data:
                            print(f"\n查询ID: {data['query_id']}")
                        elif "response" in data:
                            print(data["response"], end="", flush=True)
                    except json.JSONDecodeError:
                        print(f"\n解析错误，无效的JSON: {line}")
            print("\n\n流式响应结束")
        else:
            print(f"请求失败，状态码: {response.status_code}")
            print("错误信息:", response.text)

    except Exception as e:
        print(f"请求发生错误: {str(e)}")


if __name__ == "__main__":
    main()
