# LightRAG do_eval API 调用示例
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

    print("=== 测试完整评测流程 ===")
    # 测试do_eval接口 - 完整评测流程
    try:
        response = requests.post(f"{base_url}/eval/do_eval", headers=headers)

        if response.status_code == 200:
            eval_results = response.json()
            print(f"\n评测成功完成!")
            print(f"总测试数量: {eval_results.get('total_count', 0)}")
            print(f"评测结果文件: {eval_results.get('results_file', '未生成')}")
            
            print(f"\n平均评测指标:")
            averages = eval_results.get('averages', {})
            for metric, value in averages.items():
                print(f"{metric}: {value:.4f}")
                
            print(f"\n详细结果示例:")
            detailed_results = eval_results.get('detailed_results', [])
            for i, result in enumerate(detailed_results[:2]):  # 显示前2个详细结果
                print(f"\n测试用例 {i+1}:")
                print(f"问题: {result.get('question', '无问题')[:100]}...")
                print(f"答案: {result.get('answer', '无答案')[:100]}...")
                print(f"忠实度: {result.get('faithfulness', 0.0):.4f}")
                print(f"答案相关性: {result.get('answer_relevancy', 0.0):.4f}")
        else:
            print(f"评测请求失败，状态码: {response.status_code}")
            print("错误信息:", response.text)

    except Exception as e:
        print(f"评测请求发生错误: {str(e)}")

    print("\n=== 测试单条评测 ===")
    # 测试do_eval接口 - 单条评测（指定line_number）
    try:
        response = requests.post(
            f"{base_url}/eval/do_eval",
            params={"line_number": 1},  # 测试第1条数据
            headers=headers
        )

        if response.status_code == 200:
            eval_results = response.json()
            print(f"\n单条评测成功完成!")
            print(f"总测试数量: {eval_results.get('total_count', 0)}")
            
            print(f"\n详细结果:")
            detailed_results = eval_results.get('detailed_results', [])
            if detailed_results:
                result = detailed_results[0]
                print(f"问题: {result.get('question', '无问题')}")
                print(f"答案: {result.get('answer', '无答案')}")
                print(f"忠实度: {result.get('faithfulness', 0.0):.4f}")
                print(f"答案相关性: {result.get('answer_relevancy', 0.0):.4f}")
                print(f"上下文召回率: {result.get('context_recall', 0.0):.4f}")
                print(f"上下文精确率: {result.get('context_precision', 0.0):.4f}")
        else:
            print(f"单条评测请求失败，状态码: {response.status_code}")
            print("错误信息:", response.text)

    except Exception as e:
        print(f"单条评测请求发生错误: {str(e)}")


if __name__ == "__main__":
    main()