import requests
import json
import numpy as np
from lightrag.base import QueryParam


def convert_numpy_types(obj):
    """
    将numpy类型转换为Python原生类型，以便JSON序列化
    支持所有numpy数值类型和嵌套结构
    """
    if obj is None:
        return None
    
    # numpy数组
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    
    # numpy标量类型
    if isinstance(obj, (np.floating, np.float32, np.float64)):
        return float(obj)
    
    if isinstance(obj, (np.integer, np.int8, np.int16, np.int32, np.int64, 
                       np.uint8, np.uint16, np.uint32, np.uint64)):
        return int(obj)
    
    if isinstance(obj, np.bool_):
        return bool(obj)
    
    if isinstance(obj, (np.complexfloating, np.complex64, np.complex128)):
        return str(complex(obj))  # 转换为字符串以便JSON序列化
    
    # 递归处理容器类型
    if isinstance(obj, dict):
        return {k: convert_numpy_types(v) for k, v in obj.items()}
    
    if isinstance(obj, (list, tuple)):
        converted = [convert_numpy_types(item) for item in obj]
        return converted if isinstance(obj, list) else tuple(converted)
    
    if isinstance(obj, set):
        return {convert_numpy_types(item) for item in obj}
    
    # 处理numpy对象数组
    if hasattr(obj, 'dtype') and hasattr(obj, 'tolist'):
        try:
            return obj.tolist()
        except:
            return str(obj)
    
    return obj


def get_api_key():
    """
    获取API密钥的函数
    如果API未启用认证，可以返回None
    """
    # 这里可以从配置文件、环境变量或用户输入获取API密钥
    # 例如: return os.environ.get('LIGHTRAG_API_KEY')
    return None  # 如果不需要认证，保持为None


async def get_response(query, rag=None):
    # 如果提供了rag对象，直接调用其方法
    if rag is not None:
        try:
            # 创建查询参数
            param = QueryParam(
                mode="hybrid",  # 与前端默认模式一致
                include_references=True,
                stream=False,
                conversation_history=[],  # 对应前端的history参数
                enable_rerank=False  # 禁用重排序，避免警告
            )
            
            # 直接调用rag的aquery_llm方法
            result = await rag.aquery_llm(query, param=param)
            
            # 转换结果中的numpy类型，解决JSON序列化问题
            try:
                result = convert_numpy_types(result)
            except Exception as conv_error:
                print(f"类型转换警告: {str(conv_error)}")
                # 如果转换失败，尝试更激进的转换
                result = json.loads(json.dumps(result, default=str))
            
            # 从结果中提取关键信息
            llm_response = result.get("llm_response", {})
            data = result.get("data", {})
            references = data.get("references", [])
            
            # 获取回答内容
            response_content = llm_response.get("content", "")
            if not response_content:
                response_content = "No relevant context found for the query."
            
            # 构建参考文献文本
            references_text = "## References\n\n"
            if references:
                for i, ref in enumerate(references, 1):
                    references_text += f"- [{i}] {ref.get('file_path')}\n"
            
            # 返回三个值：response内容、参考文献文本、references列表
            return response_content, references_text.strip(), references
        except Exception as e:
            print(f"直接调用rag方法失败: {str(e)}")
            import traceback
            traceback.print_exc()
            # 如果直接调用失败，回退到HTTP请求方式
    
    # HTTP请求方式（严格遵循前端模式）
    base_url = "http://localhost:9621"
    
    # 获取API密钥
    api_key = get_api_key()
    
    # 设置headers
    headers = {
        "Content-Type": "application/json"
    }
    if api_key:
        headers["X-API-Key"] = api_key
    
    # 非流式查询 - 严格使用前端模式参数
    data = {
        "query": query,
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
            
            # 转换结果中的numpy类型，解决JSON序列化问题
            try:
                result = convert_numpy_types(result)
            except Exception as conv_error:
                print(f"类型转换警告: {str(conv_error)}")
                # 如果转换失败，尝试更激进的转换
                result = json.loads(json.dumps(result, default=str))
            
            print("完整响应格式：")
            print(json.dumps(result, ensure_ascii=False, indent=2))
            
            # 提取关键信息
            print("\n\n提取的关键信息：")
            print(f"问题: {data['query']}")
            print(f"回答: {result['response']}")
            print(f"引用源数量: {len(result.get('references', []))}")
            
            # 构建参考文献文本
            references_text = "## References\n\n"
            if result.get('references', []):
                print("引用源:")
                for i, ref in enumerate(result['references'], 1):
                    print(f"- 文件: {ref.get('file_path', '未知文件')}")
                    print(f"  内容: {ref.get('content', '')[:200]}...")
                    references_text += f"- [{i}] {ref.get('file_path', '未知文件')}\n"
            
            print(f"\n是否有context字段: {'context' in result}")
            print(f"是否有chunks字段: {'chunks' in result}")
            
            # 返回三个值：response内容、参考文献文本、references列表
            return result.get('response', ''), references_text.strip(), result.get('references', [])
        else:
            print(f"请求失败，状态码: {response.status_code}")
            print("错误信息:", response.text)
            # 请求失败时返回空值
            return "", "", []
    except Exception as e:
        print(f"请求发生错误: {str(e)}")
        # 请求失败时返回空值
        return "", "", []

if __name__ == "__main__":
    import asyncio
    
    async def main():
        test_query = "how does LightRAG solve the hallucination problem in large language models"
        response_content, references_text, references_list = await get_response(test_query)
        
        print("\n\n=== 函数返回结果 ===")
        print("1. response 内容:")
        print(response_content[:500] + "..." if len(response_content) > 500 else response_content)
        print("\n\n2. 参考文献文本:")
        print(references_text)
        print("\n\n3. references 列表:")
        print(json.dumps(references_list, ensure_ascii=False, indent=2))
    
    asyncio.run(main())
