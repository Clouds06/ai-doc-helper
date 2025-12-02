#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
文档删除脚本
用于通过API删除LightRAG系统中的文档
"""
"""
用法：
python /Users/wangzihao/Desktop/LightRAG-main/examples/delete_document.py 
doc-00a0d12461b4a17df380893788e27138 
"""
import sys
import requests
import json

def delete_document(doc_id, api_url="http://localhost:9621/documents/delete_document", api_key="null"):
    """
    删除指定ID的文档
    
    Args:
        doc_id: 要删除的文档ID
        api_url: API端点URL
        api_key: API密钥
    
    Returns:
        删除结果（字典格式）
    """
    # 准备请求参数
    params = {
        "api_key_header_value": api_key
    }
    
    # 准备请求体
    data = {
        "doc_ids": [doc_id],
        "delete_file": False,
        "delete_llm_cache": False
    }
    
    print(f"正在删除文档: {doc_id}")
    print(f"目标API: {api_url}")
    
    try:
        # 发送DELETE请求
        response = requests.delete(
            api_url,
            params=params,
            headers={
                "accept": "application/json",
                "Content-Type": "application/json"
            },
            data=json.dumps(data)
        )
        
        # 检查响应状态
        response.raise_for_status()
        
        # 尝试解析JSON响应
        try:
            result = response.json()
            return result
        except json.JSONDecodeError:
            return {"status": "error", "message": "无法解析API响应", "raw_response": response.text}
    
    except requests.exceptions.RequestException as e:
        return {"status": "error", "message": f"删除失败: {str(e)}"}

def main():
    """
    主函数
    """
    # 检查命令行参数
    if len(sys.argv) < 2:
        print("用法: python delete_document.py <文档ID>")
        print("示例: python delete_document.py doc-00a0d12461b4a17df380893788e27138")
        sys.exit(1)
    
    # 获取文档ID
    doc_id = sys.argv[1]
    
    # 执行删除
    result = delete_document(doc_id)
    
    # 打印结果
    print("\n删除结果:")
    if result.get("status") == "error":
        print(f"❌ 删除失败: {result.get('message')}")
        if "raw_response" in result:
            print(f"原始响应: {result['raw_response']}")
    else:
        print(f"✅ 删除请求已提交!")
        # 格式化打印响应内容
        for key, value in result.items():
            print(f"  {key}: {value}")

if __name__ == "__main__":
    print("🗑️  LightRAG 文档删除工具")
    print("=" * 50)
    main()