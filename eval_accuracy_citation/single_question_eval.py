import sys
import os
import json
import argparse
from datetime import datetime

# 添加当前目录到Python路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# 导入所需模块
from test_response_format import get_response
from ragas_evaluation import evaluate_qa
from read_eval_jsonl import process_eval_jsonl

# 从settings.py导入配置
from settings import EVAL_JSONL_PATH, RESULT_PREFIX, OUTPUT_DIR

# -------------------------- Configuration Constants --------------------------
LIGHTRAG_SERVER_URL = "http://localhost:9621"

# -------------------------- Main Evaluation Function --------------------------
def evaluate_single_question(question_data):
    """
    评测单个问题并返回JSON格式的结果
    
    :param question_data: 问题数据字典，包含q（问题）、gold（黄金答案）、doc_hint（文档提示）
    :return: 包含完整评测信息的JSON对象，或None如果评测失败
    """
    if not question_data:
        print("错误: 问题数据不能为空")
        return None
        
    try:
        print(f"   问题: {question_data['q']}")
        if question_data.get('gold'):
            print(f"   黄金答案: {', '.join(question_data['gold'])}")
        if question_data.get('doc_hint'):
            print(f"   指定参考文档: {', '.join(question_data['doc_hint'])}")
        
        # 1. 调用LightRAG获取问答结果
        print("\n2. 调用LightRAG服务器获取问答结果...")
        query = question_data['q']
        response_content, references_text, references_list = get_response(query)
        print("   成功获取LightRAG问答结果")
        
        # 2. 调用评测函数进行评分
        print("\n3. 调用评测函数进行评分...")
        eval_result_str = evaluate_qa(
            params=question_data,
            question_param=question_data['q'],
            model_answer=response_content,
            references=references_list
        )
        
        # 3. 解析评测结果
        if eval_result_str.startswith(RESULT_PREFIX):
            # 提取JSON部分
            json_str = eval_result_str[len(RESULT_PREFIX):].strip()
            try:
                eval_result = json.loads(json_str)
                print(f"   成功解析评测结果")
            except json.JSONDecodeError as e:
                print(f"   解析评测结果失败: {str(e)}")
                print(f"   原始结果: {eval_result_str}")
                return None
        else:
            print(f"   评测结果格式异常: {eval_result_str}")
            return None
        
        # 4. 构建contexts和retrieved_contexts
        contexts = []
        retrieved_contexts = []
        if references_list:
            for ref in references_list:
                if 'content' in ref:
                    content = ref['content']
                    if isinstance(content, list):
                        contexts.extend(content)
                        retrieved_contexts.extend(content)
                    else:
                        contexts.append(content)
                        retrieved_contexts.append(content)
        
        # 5. 构建标准格式的结果项
        detailed_item = {
            "question": question_data['q'],
            "answer": response_content,
            "contexts": contexts,
            "ground_truth": ', '.join(question_data.get('gold', [])),
            "faithfulness": float(eval_result.get("faithfulness", 0.0)),
            "answer_relevancy": float(eval_result.get("answer_relevancy", 0.0)),
            "context_recall": float(eval_result.get("context_recall", 0.0)),
            "context_precision": float(eval_result.get("context_precision", 0.0)),
            "user_input": question_data['q'],
            "retrieved_contexts": retrieved_contexts,
            "references": references_list,
            "references_text": references_text,
            "evaluation_reasoning": {
                "faithfulness": str(eval_result.get("reasoning", {}).get("faithfulness", "")),
                "answer_relevancy": str(eval_result.get("reasoning", {}).get("answer_relevancy", "")),
                "context_recall": str(eval_result.get("reasoning", {}).get("context_recall", "")),
                "context_precision": str(eval_result.get("reasoning", {}).get("context_precision", ""))
            }
        }
        
        return detailed_item
        
    except Exception as e:
        print(f"\n评测过程出错: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

def run_single_question_eval(question_text=None, line_number=None, output_file=None):
    """
    运行单个问题的评测流程
    
    :param question_text: 直接输入的问题文本，如果为None则从文件读取
    :param line_number: 要评测的EVAL.jsonl中的特定行号（从1开始），如果为None则评测所有问题
    :param output_file: 输出文件路径，如果为None则自动生成或打印到控制台
    :return: 标准格式的评测结果字典
    """
    detailed_results = []
    
    try:
        print("=== RAG单问题评测流程开始 ===")
        
        # 1. 获取问题数据
        print("\n1. 准备问题数据...")
        questions = []
        if question_text:
            # 直接输入问题
            print("   使用直接输入的问题文本")
            questions = [{
                "q": question_text,
                "gold": [],
                "doc_hint": []
            }]
        else:
            # 从EVAL.jsonl读取问题
            if line_number:
                questions = [process_eval_jsonl(mode="specific", line_number=line_number)]
                print(f"   已读取第{line_number}行的问题数据")
            else:
                questions = process_eval_jsonl(mode="all")
                print(f"   已读取所有{len(questions)}个问题数据")
        
        # 2. 过滤无效问题
        questions = [q for q in questions if q is not None]
        if not questions:
            print("\n错误: 没有有效的问题数据可评测")
            return {"detailed_results": detailed_results}
        
        # 3. 评测每个问题
        for i, question_data in enumerate(questions, 1):
            print(f"\n=== 评测第{i}个问题 ===")
            result = evaluate_single_question(question_data)
            if result:
                detailed_results.append(result)
        
        # 4. 构建最终结果
        final_result = {
            "detailed_results": detailed_results
        }
        
        print(f"\n=== 所有问题评测完成 ===")
        print(f"   共评测 {len(questions)} 个问题")
        print(f"   成功评测 {len(detailed_results)} 个问题")
        
        # 5. 输出结果
        if output_file:
            # 保存到指定文件
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(final_result, f, ensure_ascii=False, indent=2)
            print(f"\n=== 评测结果已保存到文件 ===")
            print(f"   文件路径: {output_file}")
        else:
            # 打印到控制台
            if detailed_results:
                print(f"\n=== 评测结果 ===")
                print(json.dumps(detailed_results[0], ensure_ascii=False, indent=2))
        
    except Exception as e:
        print(f"\n评测流程出错: {str(e)}")
        import traceback
        traceback.print_exc()
        raise
    
    return final_result

def main():
    """
    主函数，用于命令行调用
    """
    parser = argparse.ArgumentParser(description="评测RAG问题并返回JSON结果")
    
    # 模式选择：直接输入问题或从EVAL.jsonl读取
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--question", help="要评测的问题文本")
    group.add_argument("--file", action="store_true", help="从EVAL.jsonl文件读取问题")
    
    # 从文件读取时的选项
    parser.add_argument("--line", type=int, help="当使用--file时，指定要读取的行号（从1开始），若不指定则读取所有问题")
    
    # 输出选项
    parser.add_argument("-o", "--output", help="输出JSON文件路径，若不指定则打印到控制台")
    
    args = parser.parse_args()
    
    # 运行评测流程
    result = run_single_question_eval(
        question_text=args.question,
        line_number=args.line if args.file else None,
        output_file=args.output
    )
    
    # 输出结果摘要
    print("\n=== 评测完成摘要 ===")
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

if __name__ == "__main__":
    main()