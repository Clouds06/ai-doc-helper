import sys
import os
import json
import asyncio
from datetime import datetime
import numpy as np

# 添加当前目录到Python路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# 导入三个模块的主函数
from read_eval_jsonl import process_eval_jsonl
from test_response_format import get_response
from ragas_evaluation import evaluate_qa

# 从settings.py导入配置
from settings import EVAL_JSONL_PATH, RESULT_PREFIX, OUTPUT_DIR

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

# -------------------------- Configuration Constants --------------------------
LIGHTRAG_SERVER_URL = "http://localhost:9621"

# -------------------------- Main Evaluation Pipeline --------------------------
async def run_eval_pipeline(line_number=None, output_file=None, rag=None):
    """
    运行完整的RAG评测流程
    
    :param line_number: 要评测的特定行号（从1开始），如果为None则评测所有问题
    :param output_file: 输出文件路径，如果为None则自动生成带时间戳的文件名
    :return: 标准格式的评测结果字典，包含以下结构：
        {
            "detailed_results": [详细评测结果列表],
            "averages": {各评测维度的平均值},
            "total_count": 评测总数,
            "results_file": 结果文件路径
        }
    """
    
    detailed_results = []
    
    try:
        print("=== RAG评测流程开始 ===")
        
        # 1. 读取问题数据
        print("\n1. 读取EVAL.jsonl中的问题数据...")
        if line_number:
            questions = [process_eval_jsonl(mode="specific", line_number=line_number)]
            print(f"   已读取第{line_number}行的问题数据")
        else:
            questions = process_eval_jsonl(mode="all")
            print(f"   已读取所有{len(questions)}个问题数据")
        
        # 2. 遍历问题，进行评测
        for i, question_data in enumerate(questions, 1):
            if not question_data:
                continue
                
            print(f"\n=== 评测第{i}个问题 ===")
            print(f"   问题: {question_data['q']}")
            print(f"   黄金答案: {', '.join(question_data['gold'])}")
            print(f"   指定参考文档: {', '.join(question_data['doc_hint'])}")
            
            # 3. 调用LightRAG获取问答结果
            print("\n2. 调用LightRAG服务器获取问答结果...")
            query = question_data['q']
            response_content, references_text, references_list = await get_response(query, rag=rag)
            print(f"   成功获取LightRAG问答结果")
            print(f"   回答长度: {len(response_content)} 字符")
            print(f"   参考文献数量: {len(references_list)}")
            
            # 调试：检查参考文献结构
            if references_list:
                print(f"   第一个参考文献结构:")
                first_ref = references_list[0]
                print(f"     类型: {type(first_ref)}")
                print(f"     键: {list(first_ref.keys()) if isinstance(first_ref, dict) else '不是字典'}")
                if isinstance(first_ref, dict) and 'content' in first_ref:
                    content = first_ref['content']
                    if isinstance(content, list):
                        print(f"     内容: 列表，{len(content)} 项")
                    else:
                        print(f"     内容: {str(content)[:100]}...")
                else:
                    print(f"     无内容字段")
            else:
                print("   警告：参考文献列表为空！")
            
            # 4. 调用评测函数进行评分
            print("\n3. 调用评测函数进行评分...")
            eval_result_str = evaluate_qa(
                params=question_data,
                question_param=question_data['q'],
                model_answer=response_content,
                references=references_list
            )
            
            # 5. 解析评测结果
            if eval_result_str.startswith(RESULT_PREFIX):
                # 提取JSON部分
                json_str = eval_result_str[len(RESULT_PREFIX):].strip()
                try:
                    eval_result = json.loads(json_str)
                    print(f"   成功解析评测结果")
                except json.JSONDecodeError as e:
                    print(f"   解析评测结果失败: {str(e)}")
                    print(f"   原始结果: {eval_result_str}")
                    continue
            else:
                print(f"   评测结果格式异常: {eval_result_str}")
                continue
            
            # 6. 构建contexts和retrieved_contexts
            contexts = []
            retrieved_contexts = []
            if references_list:
                print(f"   开始构建contexts，参考文献数量: {len(references_list)}")
                for i, ref in enumerate(references_list):
                    if 'content' in ref:
                        content = ref['content']
                        print(f"     参考文献 {i+1}: 找到内容字段，类型: {type(content)}")
                        if isinstance(content, list):
                            contexts.extend(content)
                            retrieved_contexts.extend(content)
                            print(f"       添加 {len(content)} 项到contexts")
                        else:
                            contexts.append(content)
                            retrieved_contexts.append(content)
                            print(f"       添加 1 项到contexts")
                    else:
                        print(f"     参考文献 {i+1}: 无内容字段，可用键: {list(ref.keys())}")
            else:
                print("   警告：无参考文献，contexts将为空")
            
            print(f"   最终contexts数量: {len(contexts)}")
            print(f"   最终retrieved_contexts数量: {len(retrieved_contexts)}")
            
            # 7. 构建标准格式的结果项
            detailed_item = {
                "question": question_data['q'],
                "answer": response_content,
                "contexts": contexts,
                "ground_truth": ', '.join(question_data['gold']),
                "faithfulness": float(eval_result.get("faithfulness", 0.0)),
                "answer_relevancy": float(eval_result.get("answer_relevancy", 0.0)),
                "context_recall": float(eval_result.get("context_recall", 0.0)),
                "context_precision": float(eval_result.get("context_precision", 0.0)),
                "reasoning": convert_numpy_types(eval_result.get("reasoning", {})),
                "user_input": question_data['q'],
                "retrieved_contexts": retrieved_contexts
            }
            
            detailed_results.append(detailed_item)
            
            # 8. 输出评测结果
            print(f"\n4. 评测结果:")
            try:
                # 转换numpy类型以确保JSON序列化成功
                safe_eval_result = convert_numpy_types(eval_result)
                print(json.dumps(safe_eval_result, ensure_ascii=False, indent=2))
            except Exception as e:
                print(f"评测结果序列化警告: {str(e)}")
                # 如果转换失败，使用更激进的方法
                print(json.dumps(eval_result, ensure_ascii=False, indent=2, default=str))
        
        # 9. 计算平均得分
        averages = {
            "faithfulness": 0.0,
            "answer_relevancy": 0.0,
            "context_recall": 0.0,
            "context_precision": 0.0
        }
        
        if detailed_results:
            total_faithfulness = sum(item['faithfulness'] for item in detailed_results)
            total_relevancy = sum(item['answer_relevancy'] for item in detailed_results)
            total_recall = sum(item['context_recall'] for item in detailed_results)
            total_precision = sum(item['context_precision'] for item in detailed_results)
            
            count = len(detailed_results)
            averages = {
                "faithfulness": round(total_faithfulness / count, 4),
                "answer_relevancy": round(total_relevancy / count, 4),
                "context_recall": round(total_recall / count, 4),
                "context_precision": round(total_precision / count, 4)
            }
        
        print("\n=== 所有问题评测完成 ===")
        print(f"   共评测 {len(detailed_results)} 个问题")
        
        # 10. 确定输出文件路径
        if output_file:
            save_path = output_file
        else:
            # 生成带时间戳的文件名
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            save_path = os.path.join(OUTPUT_DIR, f"eval_results_{timestamp}.json")
        
        # 11. 构建最终结果
        final_result = {
            "detailed_results": detailed_results,
            "averages": averages,
            "total_count": len(detailed_results),
            "results_file": save_path
        }
        
        # 12. 保存结果到JSON文件
        try:
            # 转换numpy类型以确保JSON序列化成功
            safe_final_result = convert_numpy_types(final_result)
            with open(save_path, 'w', encoding='utf-8') as f:
                json.dump(safe_final_result, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"最终结果被numpy类型转换警告: {str(e)}")
            # 如果转换失败，使用更激进的方法
            with open(save_path, 'w', encoding='utf-8') as f:
                json.dump(final_result, f, ensure_ascii=False, indent=2, default=str)
        
        print(f"\n=== 评测结果已保存到文件 ===")
        print(f"   文件路径: {save_path}")
        
    except Exception as e:
        print(f"\n评测流程出错: {str(e)}")
        import traceback
        traceback.print_exc()
        raise
    
    return final_result

# -------------------------- Test the Pipeline --------------------------
if __name__ == "__main__":
    # 解析命令行参数
    line_number = None
    output_file = None
    
    if len(sys.argv) > 1:
        try:
            line_number = int(sys.argv[1])
        except ValueError:
            output_file = sys.argv[1]
    
    if len(sys.argv) > 2:
        output_file = sys.argv[2]
    
    # 运行评测流程
    result = asyncio.run(run_eval_pipeline(line_number=line_number, output_file=output_file))
    
    # 输出结果摘要
    print(f"\n=== 评测完成摘要 ===")
    print(f"共评测问题数: {len(result['detailed_results'])}")
    
    # 计算平均得分
    if result['detailed_results']:
        total_faithfulness = sum(item['faithfulness'] for item in result['detailed_results'])
        total_relevancy = sum(item['answer_relevancy'] for item in result['detailed_results'])
        total_recall = sum(item['context_recall'] for item in result['detailed_results'])
        total_precision = sum(item['context_precision'] for item in result['detailed_results'])
        
        count = len(result['detailed_results'])
        print(f"平均忠实度: {total_faithfulness / count:.3f}")
        print(f"平均相关性: {total_relevancy / count:.3f}")
        print(f"平均召回率: {total_recall / count:.3f}")
        print(f"平均精确率: {total_precision / count:.3f}")

# -------------------------- Module Exports --------------------------
__all__ = ['run_eval_pipeline']