#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
文件上传脚本
用于通过API上传Markdown文档到LightRAG系统
"""

import os
import sys
import requests
import json
from pathlib import Path

def upload_document(file_path, api_url="http://localhost:9621/documents/upload"):
    """
    上传文档到指定的API端点
    
    Args:
        file_path: 要上传的文件路径
        api_url: API端点URL
    
    Returns:
        上传结果（字典格式）
    """
    # 检查文件是否存在
    file_path_obj = Path(file_path)
    if not file_path_obj.exists():
        return {"status": "error", "message": f"文件不存在: {file_path}"}
    
    # 准备文件数据
    files = {
        "file": (file_path_obj.name, open(file_path, 'rb'), "text/markdown")
    }
    
    print(f"正在上传文件: {file_path}")
    print(f"目标API: {api_url}")
    
    try:
        # 发送POST请求
        response = requests.post(
            api_url,
            files=files,
            headers={"accept": "application/json"}
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
        return {"status": "error", "message": f"上传失败: {str(e)}"}
    finally:
        # 确保文件被关闭
        files["file"][1].close()


def main():
    """
    主函数
    """
    # 默认文件路径
    default_file = "/Users/wangzihao/Documents/Obsidian Vault/数据库系统/规范化.md"
    
    # 从命令行参数获取文件路径（如果提供）
    file_path = sys.argv[1] if len(sys.argv) > 1 else default_file
    
    # 执行上传
    result = upload_document(file_path)
    
    # 打印结果
    print("\n上传结果:")
    if result.get("status") == "error":
        print(f"❌ 上传失败: {result.get('message')}")
        if "raw_response" in result:
            print(f"原始响应: {result['raw_response']}")
    else:
        print(f"✅ 上传成功!")
        # 格式化打印响应内容
        for key, value in result.items():
            print(f"  {key}: {value}")


if __name__ == "__main__":
    print("📄 LightRAG 文档上传工具")
    print("=" * 50)
    main()
