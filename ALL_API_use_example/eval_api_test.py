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

    print("\n\n=== 测试运行评测 ===")
    # 运行评测API调用示例
    # 完整参数说明：
    # - eval_dataset_path: 评测数据集JSONL文件路径
    # - input_docs_dir: 要摄取的文档目录
    # - skip_ingestion: 是否跳过文档摄取
    # - output_format: 输出格式（json或csv）
    params = {
        "eval_dataset_path": "/Users/wangzihao/PycharmProjects/new/eval_accuracy_citation/EVAL.jsonl",
        "output_format": "json",  # 输出格式：json或csv
        "skip_ingestion": False,  # 是否跳过文档摄取
        "input_docs_dir": "/Users/wangzihao/PycharmProjects/new/lightrag/evaluation/sample_documents"  # 文档目录
    }

    try:
        print("正在运行评测，请耐心等待...")
        start_time = time.time()
        
        # 发送POST请求到评测API
        response = requests.post(
            f"{base_url}/eval/run", 
            headers=headers, 
            params=params
        )

        end_time = time.time()
        print(f"\n评测完成，耗时 {end_time - start_time:.2f} 秒")

        if response.status_code == 200:
            # 保存结果文件
            timestamp = time.strftime("%Y%m%d_%H%M%S")
            output_file = f"eval_results_{timestamp}.{params['output_format']}"
            
            with open(output_file, 'wb') as f:
                f.write(response.content)
            
            print(f"\n评测结果已保存到文件: {output_file}")
            
            # 如果是JSON格式，解析并展示部分内容
            if params['output_format'] == 'json':
                with open(output_file, 'r', encoding='utf-8') as f:
                    results = json.load(f)
                
                print(f"\n评测结果包含 {len(results)} 条记录")
                print("\n前2条记录示例:")
                for i, record in enumerate(results[:2]):
                    print(f"\n记录 {i+1}:")
                    print(f"用户输入: {record.get('user_input', '无用户输入')[:100]}...")
                    print(f"回答: {record.get('response', '无回答')[:100]}...")
                    print(f"忠实度: {record.get('faithfulness', '无数据')}")
                    print(f"答案相关性: {record.get('answer_relevancy', '无数据')}")
                    print(f"上下文召回率: {record.get('context_recall', '无数据')}")
                    print(f"上下文精确率: {record.get('context_precision', '无数据')}")
        else:
            print(f"请求失败，状态码: {response.status_code}")
            print("错误信息:", response.text)

    except Exception as e:
        print(f"请求发生错误: {str(e)}")


if __name__ == "__main__":
    main()