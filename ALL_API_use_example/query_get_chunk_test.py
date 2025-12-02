# LightRAG API调用示例 - 包含文本块返回
import requests 
import json 

def get_token(base_url, username, password): 
    """ 
    获取认证令牌的函数 
    如果API未启用认证，可以跳过此步骤 
    """
    try:
        response = requests.post(
            f"{base_url}/login",
            json={"username": username, "password": password}
        )
        if response.status_code == 200:
            return response.json()["access_token"]
        else:
            print(f"获取令牌失败: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"获取令牌时发生错误: {str(e)}")
        # 返回None表示不使用认证
        return None

def main():
    # API服务器地址
    base_url = "http://localhost:9621"
    
    # 可选：获取认证令牌
    # token = get_token(base_url, "your_username", "your_password")
    token = None  # 如果不需要认证，保持为None
    
    # 根据是否有token设置headers
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    print("=== 测试非流式查询（返回文本块）===")
    # 非流式查询示例 - 启用文本块返回
    data = {
        "query": "3NF",
        "mode": "mix",  # 查询模式
        "include_references": True,  # 是否包含引用源
        "include_chunk_content": True,  # 设置为True以返回检索到的文本块内容
        "response_type": "Multiple Paragraphs"  # 响应格式
    }
    
    try:
        response = requests.post(
            f"{base_url}/query",
            headers=headers,
            json=data
        )
        
        if response.status_code == 200:
            result = response.json()
            print("\n回答:", result["response"])
            if result["references"]:
                print("\n引用源及文本块:")
                for i, ref in enumerate(result["references"], 1):
                    print(f"\n引用 {i}:")
                    print(f"- 文件路径: {ref.get('file_path', '未知文件')}")
                    print(f"- 章节: {ref.get('section', '未知章节')}")
                    print(f"- 页码: {ref.get('page', '未知页码')}")
                    print(f"- 相关性得分: {ref.get('score', '未知得分')}")
                    # 显示文本块内容
                    if 'content' in ref:
                        print(f"- 文本块内容: {ref['content']}")
                    else:
                        print("- 文本块内容: 不可用")
        else:
            print(f"请求失败，状态码: {response.status_code}")
            print("错误信息:", response.text)
            
    except Exception as e:
        print(f"请求发生错误: {str(e)}")
    
    print("\n\n=== 测试流式查询（返回文本块）===")
    # 流式查询示例 - 启用文本块返回
    stream_data = {
        "query": "详细解释人工智能原理",
        "mode": "hybrid",
        "stream": True,
        "include_references": True,
        "include_chunk_content": True  # 设置为True以在流式响应中返回文本块内容
    }
    
    try:
        response = requests.post(
            f"{base_url}/query/stream",
            headers=headers,
            json=stream_data,
            stream=True  # 启用流式响应
        )
        
        if response.status_code == 200:
            print("\n流式响应开始:")
            for line in response.iter_lines():
                if line:
                    try:
                        data = json.loads(line.decode('utf-8'))
                        if "references" in data:
                            print("\n引用源及文本块:")
                            for i, ref in enumerate(data["references"], 1):
                                print(f"\n引用 {i}:")
                                print(f"- 文件路径: {ref.get('file_path', '未知文件')}")
                                print(f"- 章节: {ref.get('section', '未知章节')}")
                                print(f"- 页码: {ref.get('page', '未知页码')}")
                                print(f"- 相关性得分: {ref.get('score', '未知得分')}")
                                # 显示文本块内容
                                if 'content' in ref:
                                    print(f"- 文本块内容: {ref['content']}")
                                else:
                                    print("- 文本块内容: 不可用")
                        elif "response" in data:
                            print(data["response"], end="", flush=True)
                        elif "error" in data:
                            print(f"\n错误: {data['error']}")
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