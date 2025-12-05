import requests
import json
import time

# --- 配置部分 ---
BASE_URL = "http://127.0.0.1:9621"


# 颜色代码
class Colors:
    HEADER = "\033[95m"
    BLUE = "\033[94m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    RED = "\033[91m"
    ENDC = "\033[0m"
    BOLD = "\033[1m"


def print_reference_details(references, mode_name):
    """
    解析并打印 References 列表
    """
    if not references:
        print(
            f"{Colors.YELLOW}[{mode_name}] ⚠️  没有返回引用数据 (References is empty)。{Colors.ENDC}"
        )
        return

    print(
        f"\n{Colors.GREEN}✅ [{mode_name}] 成功收到 {len(references)} 个文档引用:{Colors.ENDC}"
    )

    for idx, ref in enumerate(references):
        ref_id = ref.get("reference_id", "Unknown")
        file_path = ref.get("file_path", "Unknown")

        scores_list = ref.get("scores")
        content_list = ref.get("content", [])

        print(f"{'-'*60}")
        print(f"📄 Document #{idx+1} (ID: {ref_id})")
        print(f"📂 Path: {Colors.BLUE}{file_path}{Colors.ENDC}")

        if scores_list is None:
            print(f"❌ {Colors.RED}Scores 字段缺失!{Colors.ENDC}")
            continue

        if not isinstance(scores_list, list):
            print(
                f"⚠️ {Colors.RED}Scores 格式错误: 期望 List[float], 实际是 {type(scores_list)}{Colors.ENDC}"
            )
            continue

        chunk_count = len(content_list)
        score_count = len(scores_list)

        print(f"🔢 命中片段数: {chunk_count} | 得分数量: {score_count}")

        if chunk_count != score_count:
            print(f"⚠️ {Colors.RED}警告: 片段数量与分数数量不一致!{Colors.ENDC}")

        if chunk_count > 0:
            print(f"\n   {Colors.YELLOW}--- 片段详细得分 ---{Colors.ENDC}")
            for i, (chunk_text, score) in enumerate(zip(content_list, scores_list)):
                preview = chunk_text.replace("\n", " ")[:60] + "..."
                score_color = (
                    Colors.GREEN
                    if score > 0.7
                    else (Colors.YELLOW if score > 0.4 else Colors.RED)
                )
                print(
                    f"   🔹 Chunk {i+1}: 得分 {score_color}{score:.4f}{Colors.ENDC} | 内容: {preview}"
                )
        else:
            print("   (无内容详情)")


def test_streaming_query():
    """测试流式接口 /query/stream"""
    url = f"{BASE_URL}/query/stream"
    payload = {
        "query": "RAG是什么",
        "mode": "hybrid",
        "stream": True,
        "include_references": True,
        "include_chunk_content": True,
    }

    print(f"\n{Colors.HEADER}>>> 开始测试 1: 流式接口 (Streaming) {Colors.ENDC}")
    print(f"请求: {url}")

    start_time = time.time()
    try:
        with requests.post(url, json=payload, stream=True) as response:
            response.raise_for_status()

            found_refs = False
            print(f"\n{Colors.BLUE}--- 正在接收流式回复 ---{Colors.ENDC}")

            for line in response.iter_lines():
                if line:
                    data = json.loads(line.decode("utf-8"))

                    # 1. 处理引用 (通常是第一条消息)
                    if "references" in data:
                        print_reference_details(data["references"], "Stream")
                        found_refs = True
                        print(f"\n{Colors.BLUE}--- LLM 回复内容 ---{Colors.ENDC}")
                        continue  # 继续循环读取后续的 response

                    # 2. 处理流式内容 (实时打印)
                    if "response" in data:
                        # end="" 防止自动换行，flush=True 强制刷新缓冲区实现打字机效果
                        print(data["response"], end="", flush=True)

                    # 3. 处理错误
                    if "error" in data:
                        print(f"\n{Colors.RED}[API Error] {data['error']}{Colors.ENDC}")

            # 流式结束后换行
            print("\n")

            if not found_refs:
                print(
                    f"{Colors.RED}[失败] 流式响应中未找到 references 字段{Colors.ENDC}"
                )

    except Exception as e:
        print(f"\n{Colors.RED}请求异常: {e}{Colors.ENDC}")
    print(f"耗时: {time.time() - start_time:.2f}s")


def test_non_streaming_query():
    """测试非流式接口 /query"""
    url = f"{BASE_URL}/query"
    payload = {
        "query": "RAG是什么",
        "mode": "hybrid",
        "include_references": True,
        "include_chunk_content": True,
    }

    print(f"\n{Colors.HEADER}>>> 开始测试 2: 非流式接口 (Non-Streaming) {Colors.ENDC}")
    print(f"请求: {url}")

    start_time = time.time()
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        data = response.json()

        # 1. 打印引用
        if "references" in data:
            print_reference_details(data["references"], "Normal")
        else:
            print(f"{Colors.RED}[失败] 响应中未找到 references 字段{Colors.ENDC}")

        # 2. 打印回复内容
        if "response" in data:
            print(f"\n{Colors.BLUE}--- LLM 完整回复内容 ---{Colors.ENDC}")
            print(data["response"])
        else:
            print(f"{Colors.RED}[失败] 响应中未找到 response 字段{Colors.ENDC}")

    except Exception as e:
        print(f"{Colors.RED}请求异常: {e}{Colors.ENDC}")
    print(f"耗时: {time.time() - start_time:.2f}s")


if __name__ == "__main__":
    test_streaming_query()
    print("\n" + "=" * 50)
    test_non_streaming_query()
