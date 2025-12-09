# LightRAG 评测 API 调用示例
import requests
import json
import os
import time


def get_token(base_url, username, password):
    """
    获取认证令牌的函数
    如果API未启用认证，可以跳过此步骤
    """
    try:
        response = requests.post(
            f"{base_url}/login", json={"username": username, "password": password}
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

    print("=== 测试获取评测数据集 ===")
    # 获取评测数据集API调用示例
    try:
        response = requests.get(f"{base_url}/eval/data", headers=headers)

        if response.status_code == 200:
            eval_data = response.json()
            print(f"\n成功获取评测数据集，包含 {len(eval_data)} 条测试用例")
            print("\n前3条测试用例示例:")
            for i, test_case in enumerate(eval_data[:3]):
                print(f"\n测试用例 {i+1}:")
                print(f"问题: {test_case.get('q', '无问题')}")
                print(f"正确答案: {test_case.get('gold', '无正确答案')}")
                print(f"文档提示: {test_case.get('doc_hint', '无文档提示')}")
        else:
            print(f"请求失败，状态码: {response.status_code}")
            print("错误信息:", response.text)

    except Exception as e:
        print(f"请求发生错误: {str(e)}")




if __name__ == "__main__":
    main()