# -------------------------- Configuration Constants --------------------------
import os

# EVAL.jsonl文件路径配置
# 作用：指定评测问题数据文件的位置，该文件包含用于RAG系统评测的问题、黄金答案和文档提示
# EVAL.jsonl是一个JSON Lines格式的文件，每行包含一个评测样本，格式如下：
# {"q": "问题文本", "gold": ["黄金答案1", "黄金答案2"], "doc_hint": ["相关文档1", "相关文档2"]}
#
# 使用相对路径配置，提高代码可移植性
# 此配置会自动在当前文件所在目录下查找EVAL.jsonl文件
#
# 可能的报错情况：
# 1. FileNotFoundError: 找不到EVAL.jsonl文件
# 2. PermissionError: 没有权限读取该文件
# 3. JSONDecodeError: 文件格式不正确
#
# 如果遇到路径相关的报错，可以修改为绝对路径：
# 1. 查找EVAL.jsonl文件的实际绝对路径
# 2. 将以下配置替换为实际的绝对路径
#    例如：EVAL_JSONL_PATH = "/Users/your_username/path/to/EVAL.jsonl"
# 3. 确保路径中的斜杠方向正确（Unix系统用/，Windows系统用\\或/）
#
# 注意事项：
# - 确保该文件存在且格式正确
# - 确保程序有读取该文件的权限
EVAL_JSONL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "EVAL.jsonl")

# -------------------------- RAGAS Evaluation Configuration --------------------------

# .env文件路径配置（来源：ragas_evaluation.py）
# 作用：指定包含环境变量的文件路径，用于加载LLM配置
# 来源：原始代码中硬编码的绝对路径，用于加载LLM API密钥和其他环境变量
# 改进：使用相对路径指向项目根目录下的.env文件，提高可移植性
# 首先尝试使用项目根目录下的.env文件
# 获取当前settings.py文件的目录
current_dir = os.path.dirname(os.path.abspath(__file__))
# 向上一级目录到项目根目录
project_root = os.path.abspath(os.path.join(current_dir, ".."))
# 项目根目录下的.env文件路径
ENV_FILE_PATH = os.path.join(project_root, ".env")

# 如果项目根目录下的.env文件不存在，可以尝试以下备选路径
# 1. 当前目录下的.env文件
if not os.path.exists(ENV_FILE_PATH):
    current_env_path = os.path.join(current_dir, ".env")
    if os.path.exists(current_env_path):
        ENV_FILE_PATH = current_env_path
    else:
        # 2. 如果都不存在，可以使用原始的绝对路径作为最后备选
        ENV_FILE_PATH = os.path.join(project_root, ".env")

# 加载环境变量
# 确保在获取环境变量之前先加载.env文件
try:
    from dotenv import load_dotenv
    load_dotenv(ENV_FILE_PATH)
    print(f"成功加载.env文件: {ENV_FILE_PATH}")
except ImportError:
    print("警告: dotenv库未安装，无法加载.env文件")
    print("请运行: pip install python-dotenv")
except Exception as e:
    print(f"加载.env文件失败: {e}")
    print(f"使用的.env文件路径: {ENV_FILE_PATH}")

# LLM配置默认值（来源：ragas_evaluation.py）
# 作用：设置评测使用的LLM模型配置
# 来源：原始代码中定义的默认评测模型配置
# 改进：优先从环境变量获取值，提高可移植性
# 如果环境变量EVAL_LLM_DEFAULT_MODEL不存在，使用默认值"deepseek-chat"
DEFAULT_EVAL_LLM_MODEL = os.getenv("EVAL_LLM_DEFAULT_MODEL", "deepseek-chat")  # 默认的评测LLM模型
LLM_TEMPERATURE = 0.1  # 低温度设置确保评分稳定性

# 输出格式配置（来源：ragas_evaluation.py）
# 作用：定义评测结果的输出格式前缀
# 来源：原始代码中定义的结果输出前缀
RESULT_PREFIX = "=== LLM Scoring Results ==="

# 内容预览设置（来源：ragas_evaluation.py）
# 作用：设置参考内容的预览长度
# 来源：原始代码中定义的内容预览配置
REFERENCE_CONTENT_PREVIEW_LENGTH = 200  # 参考内容的预览长度限制

# LLM客户端配置（来源：ragas_evaluation.py）
# 作用：从环境变量加载LLM服务配置
# 来源：原始代码中从.env文件读取的LLM服务配置
# 注意：这些变量会在程序运行时从环境变量中获取，不是固定值
EVAL_LLM_HOST = os.getenv("EVAL_LLM_BINDING_HOST")  # 评测LLM服务主机地址
EVAL_LLM_API_KEY = os.getenv("EVAL_LLM_BINDING_API_KEY")  # 评测LLM服务API密钥
EVAL_LLM_MODEL = os.getenv("EVAL_LLM_MODEL")  # 评测LLM模型（优先级高于DEFAULT_EVAL_LLM_MODEL）

# 评测结果输出目录配置（来源：rag_eval_pipeline.py）
# 作用：指定评测结果文件的保存目录

# 可能的报错情况：
# 1. FileNotFoundError: 目录不存在（通常会自动创建，但如果父目录权限不足可能失败）
# 2. PermissionError: 没有写入该目录的权限
# 3. NotADirectoryError: 指定的路径不是目录

# 如果遇到路径相关的报错，可以修改为绝对路径：
# 1. 选择一个有写入权限的目录
# 2. 将以下配置替换为实际的绝对路径
#    例如：OUTPUT_DIR = "/path/to/your/eval_accuracy_citation"
# 3. 确保路径中的斜杠方向正确（Unix系统用/，Windows系统用\\或/）
OUTPUT_DIR = os.path.join(project_root, "eval_accuracy_citation")


