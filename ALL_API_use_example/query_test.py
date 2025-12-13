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
        "stream": False
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
        "stream": True
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
