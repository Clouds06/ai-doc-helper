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
        print(f"[调试] 请求参数: {params}")
        start_time = time.time()
        
        # 发送POST请求到评测API
        response = requests.post(
            f"{base_url}/eval/run", 
            headers=headers, 
            params=params,
            timeout=600  # 设置10分钟超时，因为评测可能需要较长时间
        )

        end_time = time.time()
        print(f"\n评测完成，耗时 {end_time - start_time:.2f} 秒")
        
        # 添加调试信息
        print(f"\n[调试] HTTP 状态码: {response.status_code}")
        print(f"[调试] 响应 Content-Type: {response.headers.get('Content-Type', '未知')}")
        print(f"[调试] 响应内容长度: {len(response.content)} 字节")

        if response.status_code == 200:
            # 直接使用 API 返回的数据，不读取任何保存的文件
            if params['output_format'] == 'json':
                try:
                    # 直接从 API 响应获取 JSON 数据
                    results = response.json()
                    print(f"[调试] JSON 解析成功，结果类型: {type(results)}")
                    print(f"[调试] 结果键: {list(results.keys()) if isinstance(results, dict) else '不是字典'}")
                    
                    # 显示平均分数（直接从 API 返回的数据中获取）
                    if 'averages' in results:
                        print("\n" + "=" * 50)
                        print("📊 平均评测分数（来自 API 响应）")
                        print("=" * 50)
                        for metric, score in results['averages'].items():
                            if score is not None:
                                print(f"{metric.replace('_', ' ').title():<25}: {score:.4f}")
                            else:
                                print(f"{metric.replace('_', ' ').title():<25}: 无数据（所有值均为 NaN）")
                        print("=" * 50)
                    else:
                        print("\n[警告] 结果中没有 'averages' 字段")
                        print(f"[调试] 完整结果: {json.dumps(results, ensure_ascii=False, indent=2)[:500]}...")
                    
                    # 显示详细结果（直接从 API 返回的数据中获取）
                    if 'detailed_results' in results and results['detailed_results']:
                        detailed = results['detailed_results']
                        print(f"\n评测结果包含 {len(detailed)} 条详细记录（来自 API 响应）")
                        print("\n前2条记录示例:")
                        for i, record in enumerate(detailed[:2]):
                            print(f"\n记录 {i+1}:")
                            # 支持多种字段名格式
                            question = record.get('question') or record.get('user_input') or ''
                            answer = record.get('answer') or record.get('response') or ''
                            print(f"问题: {question[:100] if question else '无问题'}...")
                            print(f"回答: {answer[:100] if answer else '无回答'}...")
                            # 处理 NaN 值
                            faithfulness = record.get('faithfulness')
                            answer_relevancy = record.get('answer_relevancy')
                            context_recall = record.get('context_recall')
                            context_precision = record.get('context_precision')
                            print(f"忠实度: {faithfulness if faithfulness is not None and not (isinstance(faithfulness, float) and (faithfulness != faithfulness)) else '无数据'}")
                            print(f"答案相关性: {answer_relevancy if answer_relevancy is not None and not (isinstance(answer_relevancy, float) and (answer_relevancy != answer_relevancy)) else '无数据'}")
                            print(f"上下文召回率: {context_recall if context_recall is not None and not (isinstance(context_recall, float) and (context_recall != context_recall)) else '无数据'}")
                            print(f"上下文精确率: {context_precision if context_precision is not None and not (isinstance(context_precision, float) and (context_precision != context_precision)) else '无数据'}")
                    else:
                        print("\n[警告] 结果中没有 'detailed_results' 字段或为空")
                        if 'detailed_results' in results:
                            print(f"[调试] detailed_results 类型: {type(results['detailed_results'])}")
                            print(f"[调试] detailed_results 长度: {len(results['detailed_results']) if isinstance(results['detailed_results'], list) else '不是列表'}")
                    
                    # 显示统计信息
                    if 'total_count' in results:
                        print(f"\n总测试用例数: {results['total_count']}")
                    
                    # 保存结果到文件以便调试
                    timestamp = time.strftime("%Y%m%d_%H%M%S")
                    output_file = f"eval_results_{timestamp}.json"
                    with open(output_file, 'w', encoding='utf-8') as f:
                        json.dump(results, f, ensure_ascii=False, indent=2)
                    print(f"\n[调试] 完整结果已保存到文件: {output_file}")
                    
                except json.JSONDecodeError as e:
                    print(f"\n[错误] JSON 解析失败: {e}")
                    print(f"[调试] 响应内容前500字符: {response.text[:500]}")
                except Exception as e:
                    print(f"\n[错误] 处理响应时发生错误: {e}")
                    import traceback
                    traceback.print_exc()
            else:
                # CSV 格式：直接使用 API 返回的文件内容
                print("\n收到 CSV 格式的评测结果（来自 API 响应）")
                # 保存 CSV 文件以便查看
                timestamp = time.strftime("%Y%m%d_%H%M%S")
                output_file = f"eval_results_{timestamp}.csv"
                with open(output_file, 'wb') as f:
                    f.write(response.content)
                print(f"评测结果已保存到文件: {output_file}")
        else:
            print(f"\n[错误] 请求失败，状态码: {response.status_code}")
            print(f"[错误] 错误信息: {response.text}")
            # 尝试解析错误响应
            try:
                error_data = response.json()
                print(f"[错误] 错误详情: {json.dumps(error_data, ensure_ascii=False, indent=2)}")
            except:
                pass

    except requests.exceptions.Timeout:
        print(f"\n[错误] 请求超时（超过10分钟）")
    except requests.exceptions.RequestException as e:
        print(f"\n[错误] 网络请求失败: {str(e)}")
        import traceback
        traceback.print_exc()
    except Exception as e:
        print(f"\n[错误] 发生未预期的错误: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()