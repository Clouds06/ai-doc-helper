import requests
import json
import time

# --- 配置部分 ---
BASE_URL = "http://127.0.0.1:9621"  # 请根据你的服务实际端口进行调整
# API_KEY = "your_api_key" # 如果你在 LightRAG 设置了 API Key，请在此配置


# 颜色代码
class Colors:
    HEADER = "\033[95m"
    BLUE = "\033[94m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    RED = "\033[91m"
    ENDC = "\033[0m"
    BOLD = "\033[1m"


def get_headers():
    headers = {
        "Content-Type": "application/json",
    }
    # if API_KEY:
    #     headers["Authorization"] = f"Bearer {API_KEY}"
    return headers


def test_feedback_non_streaming():
    """
    测试场景 1: 非流式查询 -> 获取 query_id -> 提交'点踩'反馈
    """
    query_url = f"{BASE_URL}/query"
    feedback_url = f"{BASE_URL}/feedback"

    payload = {
        "query": "什么是 RAG ？",
        "mode": "hybrid",
        "stream": False,
        "include_references": True,
        "include_chunk_content": True,
    }

    print(
        f"\n{Colors.HEADER}>>> 开始测试 1: 非流式接口 + 反馈 (Non-Streaming Feedback) {Colors.ENDC}"
    )
    print(f"1. 发起查询请求: {query_url}")

    start_time = time.time()
    try:
        # Step 1: 发起查询
        response = requests.post(query_url, json=payload, headers=get_headers())
        response.raise_for_status()
        data = response.json()

        query_id = data.get("query_id")
        content = data.get("response")

        if not query_id:
            print(f"❌ {Colors.RED}[失败] 响应中未找到 query_id 字段!{Colors.ENDC}")
            return

        print(f"{Colors.GREEN}✅ 查询成功!{Colors.ENDC}")
        print(f"   🆔 Query ID: {Colors.BOLD}{query_id}{Colors.ENDC}")
        print(f"   📄 完整回复内容:\n{Colors.YELLOW}{content}{Colors.ENDC}")

        # Step 2: 提交反馈 (模拟点踩)
        print("\n2. 正在提交'点踩' (Dislike) 反馈...")

        feedback_payload = {
            "query_id": query_id,
            "feedback_type": "dislike",
            "comment": "测试脚本反馈：回答太啰嗦了，请简练一点。",
            "original_query": payload["query"],
            "original_response": content,
        }

        fb_response = requests.post(
            feedback_url, json=feedback_payload, headers=get_headers()
        )
        fb_response.raise_for_status()
        fb_data = fb_response.json()

        if fb_data.get("status") == "success":
            print(f"{Colors.GREEN}✅ 反馈提交成功!{Colors.ENDC}")
        else:
            print(f"⚠️ {Colors.YELLOW}反馈提交可能未成功: {fb_data}{Colors.ENDC}")

    except Exception as e:
        print(f"\n{Colors.RED}请求异常: {e}{Colors.ENDC}")

    print(f"耗时: {time.time() - start_time:.2f}s")


def test_feedback_streaming():
    """
    测试场景 2: 流式查询 -> 解析首包 query_id -> 提交'点赞'反馈
    """
    query_url = f"{BASE_URL}/query/stream"
    feedback_url = f"{BASE_URL}/feedback"

    payload = {
        "query": "RAG 是什么",
        "mode": "hybrid",
        "stream": True,
        "include_references": True,
        "include_chunk_content": True,
    }

    print(
        f"\n{Colors.HEADER}>>> 开始测试 2: 流式接口 + 反馈 (Streaming Feedback) {Colors.ENDC}"
    )
    print(f"1. 发起流式查询请求: {query_url}")

    start_time = time.time()
    query_id = None
    full_response = ""

    try:
        # Step 1: 发起流式查询
        with requests.post(
            query_url, json=payload, headers=get_headers(), stream=True
        ) as response:
            response.raise_for_status()

            print(f"{Colors.BLUE}--- 正在接收流式数据 ---{Colors.ENDC}")

            for line in response.iter_lines():
                if line:
                    chunk_data = json.loads(line.decode("utf-8"))

                    # 尝试捕获 query_id
                    if "query_id" in chunk_data and not query_id:
                        query_id = chunk_data["query_id"]
                        print(
                            f"   🎯 {Colors.GREEN}捕获到 Query ID: {query_id}{Colors.ENDC}"
                        )

                    # 拼接完整回复
                    if "response" in chunk_data:
                        content_chunk = chunk_data["response"]
                        full_response += content_chunk
                        print(content_chunk, end="", flush=True)

            print("\n")

        if not query_id:
            print(
                f"❌ {Colors.RED}[失败] 流式响应全程未发现 query_id 字段!{Colors.ENDC}"
            )
            return

        print(f"{Colors.GREEN}✅ 流式接收完成。{Colors.ENDC}")

        # Step 2: 提交反馈 (模拟点赞)
        print("2. 正在提交'点赞' (Like) 反馈...")

        feedback_payload = {
            "query_id": query_id,
            "feedback_type": "like",
            "comment": "测试脚本反馈：回答非常准确，保持这个风格！",
            "original_query": payload["query"],
            "original_response": full_response,
        }

        fb_response = requests.post(
            feedback_url, json=feedback_payload, headers=get_headers()
        )
        fb_response.raise_for_status()
        fb_data = fb_response.json()

        if fb_data.get("status") == "success":
            print(f"{Colors.GREEN}✅ 反馈提交成功!{Colors.ENDC}")
        else:
            print(f"⚠️ {Colors.YELLOW}反馈提交可能未成功: {fb_data}{Colors.ENDC}")

    except Exception as e:
        print(f"\n{Colors.RED}请求异常: {e}{Colors.ENDC}")

    print(f"耗时: {time.time() - start_time:.2f}s")


def test_feedback_effect_verification():
    """
    测试场景 3: 验证反馈是否真的影响了后续回答 (Closed-Loop Verification)
    流程: 提问 -> 记录回答 -> 提交Dislike要求改变风格(幼儿园老师语气) -> 再次提问 -> 验证风格变化
    """
    print(
        f"\n{Colors.HEADER}>>> 开始测试 3: 验证反馈实际效果 (Feedback Effect Verification) {Colors.ENDC}"
    )

    # 构造一个技术性问题
    query_text = "请介绍 RAG "
    url = f"{BASE_URL}/query"
    feedback_url = f"{BASE_URL}/feedback"

    # --- Round 1: 初始查询 ---
    print(f"{Colors.BLUE}--- Step 1: 初始查询 (Baseline) ---{Colors.ENDC}")
    payload = {
        "query": query_text,
        "mode": "hybrid",
        "stream": False,
        "include_references": True,
        "include_chunk_content": True,
    }

    try:
        resp1 = requests.post(url, json=payload, headers=get_headers())
        resp1.raise_for_status()
        data1 = resp1.json()
        query_id1 = data1.get("query_id")
        content1 = data1.get("response", "")

        print(f"Round 1 完整回复:\n{Colors.YELLOW}{content1}{Colors.ENDC}")

        if not query_id1:
            print(f"{Colors.RED}❌ 错误: 未获取到 query_id{Colors.ENDC}")
            return

        # --- Round 2: 提交反馈 (注入特定风格指令) ---
        print(
            f"\n{Colors.BLUE}--- Step 2: 提交反馈 (要求改为幼儿园老师语气) ---{Colors.ENDC}"
        )

        # 设定新的指令：要求语气转换
        instruction = "你的解释太专业太枯燥了。请你在下次回答时，扮演一位温柔的幼儿园老师，把我们当成小朋友，用讲故事的语气、最简单的比喻来解释这个概念。"

        print(f"📝 拟提交的建议: {Colors.BOLD}{instruction}{Colors.ENDC}")

        feedback_payload = {
            "query_id": query_id1,
            "feedback_type": "dislike",
            "comment": instruction,
            "original_query": query_text,
            "original_response": content1,
        }

        fb_resp = requests.post(
            feedback_url, json=feedback_payload, headers=get_headers()
        )
        fb_resp.raise_for_status()
        print(f"{Colors.GREEN}✅ 反馈已提交。{Colors.ENDC}")

        # --- Round 3: 再次查询 (验证) ---
        print(f"\n{Colors.BLUE}--- Step 3: 再次查询 (验证风格变化) ---{Colors.ENDC}")
        print("正在发送相同的问题...")

        resp2 = requests.post(url, json=payload, headers=get_headers())
        resp2.raise_for_status()
        data2 = resp2.json()
        content2 = data2.get("response", "")

        print(f"Round 2 完整回复:\n{Colors.YELLOW}{content2}{Colors.ENDC}")

    except Exception as e:
        print(f"{Colors.RED}❌ 测试过程中发生异常: {e}{Colors.ENDC}")


if __name__ == "__main__":
    # 1. 基础功能测试
    test_feedback_non_streaming()

    # 2. 流式功能测试
    test_feedback_streaming()

    # 3. 效果验证测试
    test_feedback_effect_verification()
