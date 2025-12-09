import requests
import json
from lightrag.base import QueryParam


async def get_response(query, rag=None):
    # 如果提供了rag对象，直接调用其方法
    if rag is not None:
        try:
            # 创建查询参数
            param = QueryParam(
                mode="mix",
                include_references=True,
                stream=False
            )
            
            # 直接调用rag的aquery_llm方法
            result = await rag.aquery_llm(query, param=param)
            
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
    
    # HTTP请求方式（作为备选方案）
    base_url = "http://localhost:9621"
    headers = {}
    data = {
        "query": query,
        "mode": "mix",
        "include_references": True,
        
        "include_chunk_content": True  # 设置为True以获取完整内容
    }
    response = requests.post(f"{base_url}/query", headers=headers, json=data)
    if response.status_code == 200:
        result = response.json()
        print("完整响应格式：")
        print(json.dumps(result, ensure_ascii=False, indent=2))
        
        # 提取关键信息
        print("\n\n提取的关键信息：")
        print(f"问题: {data['query']}")
        print(f"回答: {result['response']}")
        print(f"引用源数量: {len(result.get('references', []))}")
        
        # 构建参考文献文本
        references_text = "## References\n\n"
        if result.get('references'):
            print("引用源:")
            for i, ref in enumerate(result['references'], 1):
                print(f"- 文件: {ref.get('file_path')}")
                print(f"  内容: {ref.get('content', '')[:200]}...")
                references_text += f"- [{i}] {ref.get('file_path')}\n"
        
        print(f"\n是否有context字段: {'context' in result}")
        print(f"是否有chunks字段: {'chunks' in result}")
        
        # 返回三个值：response内容、参考文献文本、references列表
        return result.get('response', ''), references_text.strip(), result.get('references', [])
    else:
        print(f"请求失败: {response.status_code}")
        print(response.text)
        # 请求失败时返回空值
        return "", "", []

if __name__ == "__main__":
    test_query = "how does LightRAG solve the hallucination problem in large language models"
    response_content, references_text, references_list = get_response(test_query)
    
    print("\n\n=== 函数返回结果 ===")
    print("1. response 内容:")
    print(response_content[:500] + "..." if len(response_content) > 500 else response_content)
    print("\n\n2. 参考文献文本:")
    print(references_text)
    print("\n\n3. references 列表:")
    print(json.dumps(references_list, ensure_ascii=False, indent=2))
