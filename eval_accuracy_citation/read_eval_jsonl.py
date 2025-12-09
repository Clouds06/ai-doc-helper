import json
import os

# Import configuration from settings.py
from settings import EVAL_JSONL_PATH

# Output formatting constants
PROGRAM_TITLE = "=== EVAL.jsonl Reader ==="
ALL_QUESTIONS_TITLE = "1. All questions:"
SPECIFIC_QUESTION_TITLE = "2. Specific question (line 1):"
TOTAL_QUESTIONS_PREFIX = "Total questions:"
QUESTION_PREFIX = "Question"
Q_LABEL = "Q:"
GOLD_LABEL = "Gold:"
DOC_HINT_LABEL = "Doc hint:"
DONE_MESSAGE = "=== Done ==="

def read_eval_questions(line_number=None):
    """
    读取EVAL.jsonl文件中的问题数据
    
    :param line_number: 要读取的行号（从1开始），如果为None则读取所有行
    :return: 包含问题数据的列表，每个元素是包含q、gold、doc_hint的字典
    """
    questions = []
    
    try:
        # Check if file exists
        if not os.path.exists(EVAL_JSONL_PATH):
            raise FileNotFoundError(f"EVAL.jsonl file not found at {EVAL_JSONL_PATH}")
        
        with open(EVAL_JSONL_PATH, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            
            if line_number:
                # Read specific line (convert to 0-based index)
                if 1 <= line_number <= len(lines):
                    line = lines[line_number - 1].strip()
                    if line:  # Skip empty lines
                        question_data = json.loads(line)
                        # Extract required parameters
                        extracted_data = {
                            "q": question_data.get("q", ""),
                            "gold": question_data.get("gold", []),
                            "doc_hint": question_data.get("doc_hint", [])
                        }
                        questions.append(extracted_data)
                    else:
                        print(f"Line {line_number} is empty")
                else:
                    print(f"Line number {line_number} is out of range. File has {len(lines)} lines.")
            else:
                # Read all lines
                for i, line in enumerate(lines, 1):
                    line = line.strip()
                    if line:  # Skip empty lines
                        try:
                            question_data = json.loads(line)
                            # Extract required parameters
                            extracted_data = {
                                "q": question_data.get("q", ""),
                                "gold": question_data.get("gold", []),
                                "doc_hint": question_data.get("doc_hint", [])
                            }
                            questions.append(extracted_data)
                        except json.JSONDecodeError:
                            print(f"Invalid JSON format on line {i}: {line}")
        
    except Exception as e:
        print(f"Error reading EVAL.jsonl: {e}")
        raise
    
    return questions

def get_specific_question(line_number):
    """
    获取特定行的问题数据
    
    :param line_number: 要获取的行号（从1开始）
    :return: 包含q、gold、doc_hint的字典，如果行不存在则返回None
    """
    questions = read_eval_questions(line_number)
    return questions[0] if questions else None

def get_all_questions():
    """
    获取所有问题数据
    
    :return: 包含所有问题数据的列表，每个元素是包含q、gold、doc_hint的字典
    """
    return read_eval_questions()

def process_eval_jsonl(mode="all", line_number=None):
    """
    处理EVAL.jsonl文件的主函数，封装所有核心功能
    
    :param mode: 处理模式，可选值："all"（读取所有问题）、"specific"（读取特定行）
    :param line_number: 当mode="specific"时，指定要读取的行号（从1开始）
    :return: 根据mode返回不同结果：
             - mode="all"：包含所有问题数据的列表
             - mode="specific"：包含特定问题数据的字典，或None（如果行不存在）
    """
    if mode == "all":
        return get_all_questions()
    elif mode == "specific":
        if line_number is None:
            raise ValueError("line_number must be provided when mode='specific'")
        return get_specific_question(line_number)
    else:
        raise ValueError(f"Invalid mode: {mode}. Supported modes are 'all' and 'specific'")

# -------------------------- Example Usage --------------------------
if __name__ == "__main__":
    print(PROGRAM_TITLE)
    
    # Example 1: Read all questions using main function
    print(f"\n{ALL_QUESTIONS_TITLE}")
    all_questions = process_eval_jsonl(mode="all")
    print(f"{TOTAL_QUESTIONS_PREFIX} {len(all_questions)}")
    for i, question in enumerate(all_questions, 1):
        print(f"\n{QUESTION_PREFIX} {i}:")
        print(f"  {Q_LABEL} {question['q']}")
        print(f"  {GOLD_LABEL} {', '.join(question['gold'])}")
        print(f"  {DOC_HINT_LABEL} {', '.join(question['doc_hint'])}")
    
    # Example 2: Read specific line using main function
    print(f"\n{SPECIFIC_QUESTION_TITLE}")
    specific_question = process_eval_jsonl(mode="specific", line_number=1)
    if specific_question:
        print(f"  {Q_LABEL} {specific_question['q']}")
        print(f"  {GOLD_LABEL} {', '.join(specific_question['gold'])}")
        print(f"  {DOC_HINT_LABEL} {', '.join(specific_question['doc_hint'])}")
    
    print(f"\n{DONE_MESSAGE}")
