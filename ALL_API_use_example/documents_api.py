# LightRAG 文档管理API调用示例
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

def get_documents(base_url, headers=None):
    """
    调用GET /documents端点获取所有文档状态
    """
    print("=== 获取所有文档状态 ===")
    try:
        response = requests.get(
            f"{base_url}/documents",
            headers=headers
        )
        
        if response.status_code == 200:
            result = response.json()
            # 检查API返回的实际格式，从statuses.processed中获取文档列表
            if isinstance(result, dict) and 'statuses' in result:
                statuses = result['statuses']
                all_documents = []
                
                # 遍历statuses中的所有状态类别（如processed等）
                for status_key, documents in statuses.items():
                    if isinstance(documents, list):
                        all_documents.extend(documents)
                
                print(f"成功获取 {len(all_documents)} 个文档")
                for doc in all_documents:
                    if isinstance(doc, dict):
                        print(f"- 文件名: {doc.get('file_path', '未知')}")
                        print(f"  状态: {doc.get('status', '未知')}")
                        print(f"  创建时间: {doc.get('created_at', '未知')}")
                        print(f"  更新时间: {doc.get('updated_at', '未知')}")
                        print(f"  块数: {doc.get('chunks_count', '未知')}")
                    else:
                        print(f"- 文档数据格式错误: {type(doc)}")
                return all_documents
            elif isinstance(result, list):
                # 兼容列表格式的情况
                documents = result
                print(f"成功获取 {len(documents)} 个文档")
                for doc in documents:
                    if isinstance(doc, dict):
                        print(f"- 文件名: {doc.get('file_path', '未知')}")
                        print(f"  状态: {doc.get('status', '未知')}")
                        print(f"  处理时间: {doc.get('processed_at', '未知')}")
                        print(f"  章节数: {doc.get('sections_count', '未知')}")
                        print(f"  块数: {doc.get('chunks_count', '未知')}")
                    else:
                        print(f"- 文档数据格式错误: {type(doc)}")
                return documents
            else:
                print(f"API返回数据格式不符合预期，类型为: {type(result)}")
                print(f"返回内容: {result}")
                return None
        else:
            print(f"请求失败，状态码: {response.status_code}")
            print("错误信息:", response.text)
            return None
            
    except Exception as e:
        print(f"请求发生错误: {str(e)}")
        return None

def get_documents_paginated(base_url, page=1, page_size=10, headers=None):
    """
    调用POST /documents/paginated端点分页获取文档
    """
    print(f"\n=== 分页获取文档 (第 {page} 页，每页 {page_size} 条) ===")
    data = {
        "page": page,
        "page_size": page_size
    }
    
    try:
        response = requests.post(
            f"{base_url}/documents/paginated",
            headers=headers,
            json=data
        )
        
        if response.status_code == 200:
            result = response.json()
            documents = result.get('documents', [])
            total = result.get('total', 0)
            pages = result.get('pages', 0)
            
            print(f"成功获取第 {page} 页，共 {pages} 页，总计 {total} 个文档")
            print(f"当前页有 {len(documents)} 个文档")
            
            for doc in documents:
                print(f"- 文件名: {doc.get('file_path', '未知')}")
                print(f"  状态: {doc.get('status', '未知')}")
                print(f"  处理时间: {doc.get('processed_at', '未知')}")
            
            return result
        else:
            print(f"请求失败，状态码: {response.status_code}")
            print("错误信息:", response.text)
            return None
            
    except Exception as e:
        print(f"请求发生错误: {str(e)}")
        return None

def scan_new_documents(base_url, headers=None):
    """
    调用POST /documents/scan端点扫描新文档
    """
    print("\n=== 扫描新文档 ===")
    try:
        response = requests.post(
            f"{base_url}/documents/scan",
            headers=headers
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"扫描完成")
            print(f"新增文档数: {result.get('new_documents', 0)}")
            print(f"更新文档数: {result.get('updated_documents', 0)}")
            print(f"错误文档数: {result.get('error_documents', 0)}")
            
            if 'errors' in result:
                print("\n错误详情:")
                for error in result['errors']:
                    print(f"- {error.get('file_path', '未知文件')}: {error.get('error', '未知错误')}")
            
            return result
        else:
            print(f"请求失败，状态码: {response.status_code}")
            print("错误信息:", response.text)
            return None
            
    except Exception as e:
        print(f"请求发生错误: {str(e)}")
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
    
    # 1. 获取所有文档状态
    get_documents(base_url, headers)
    
    # 2. 分页获取文档 - 修改page_size为10或更大值以满足API要求
    get_documents_paginated(base_url, page=1, page_size=10, headers=headers)
    
    # 3. 扫描新文档
    scan_new_documents(base_url, headers)

if __name__ == "__main__":
    main()