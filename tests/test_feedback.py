# pytest -v -s tests/test_feedback.py

import os
import shutil
import pytest
import asyncio
from lightrag.lightrag import LightRAG
from lightrag.llm.openai import gpt_4o_mini_complete, openai_embed

pytestmark = pytest.mark.offline

# 定义测试用的临时工作目录
WORKING_DIR = "./tests/test_feedback_workdir"


@pytest.fixture
def rag_instance():
    """创建一个 LightRAG 实例用于测试，测试后自动清理"""
    # 1. 清理旧环境
    if os.path.exists(WORKING_DIR):
        shutil.rmtree(WORKING_DIR)
    os.makedirs(WORKING_DIR)

    # 2. 初始化实例
    rag = LightRAG(
        working_dir=WORKING_DIR,
        llm_model_func=gpt_4o_mini_complete,
        embedding_func=openai_embed,
    )

    # 手动初始化存储
    loop = asyncio.get_event_loop()
    loop.run_until_complete(rag.initialize_storages())

    yield rag

    # 3. 清理环境
    if os.path.exists(WORKING_DIR):
        shutil.rmtree(WORKING_DIR)


@pytest.mark.asyncio
async def test_submit_and_retrieve_feedback(rag_instance):
    """测试提交反馈并验证上下文生成的逻辑"""

    # --- 步骤 1: 模拟一次查询产生的 ID ---
    query_id_1 = "test-uuid-001"
    query_text = "什么是 RAG？"
    response_text = "RAG 是检索增强生成。"

    # --- 步骤 2: 提交一条 'Dislike' 反馈 ---
    feedback_data_1 = {
        "query_id": query_id_1,
        "feedback_type": "dislike",
        "comment": "回答太简单了，请详细一点。",
        "query": query_text,
        "response": response_text,
    }

    await rag_instance.submit_feedback(query_id_1, feedback_data_1)

    # --- 步骤 3: 验证反馈是否已存入 ---
    history_wrapper = await rag_instance.feedback.get_by_id("recent_history")

    assert history_wrapper is not None
    # 兼容处理：检查是否被包装在 "data" 中
    if "data" in history_wrapper:
        history_list = history_wrapper["data"]
    else:
        history_list = history_wrapper

    assert len(history_list) == 1
    assert history_list[0]["query_id"] == query_id_1

    # --- 步骤 4: 验证生成的 Prompt 上下文 ---
    context_str = await rag_instance._get_feedback_context()

    print(f"\n生成的上下文: {context_str}")

    assert "[用户不满/Dislike]" in context_str
    assert "回答太简单了" in context_str
    assert query_text in context_str


@pytest.mark.asyncio
async def test_feedback_limit_logic(rag_instance):
    """测试反馈记录的条数限制（验证只保留最近 N 条）"""

    # 模拟提交 15 条反馈
    for i in range(15):
        # 构造带有 query_id 的数据
        fb_data = {
            "query_id": f"id-{i}",
            "feedback_type": "like",
            "comment": f"第 {i} 条评价",
            "query": f"问题 {i}",
        }
        await rag_instance.submit_feedback(f"id-{i}", fb_data)

    # 获取上下文
    history_wrapper = await rag_instance.feedback.get_by_id("recent_history")
    if "data" in history_wrapper:
        history_list = history_wrapper["data"]
    else:
        history_list = history_wrapper

    # 断言：应该只保留最近的 10 条（根据 lightrag.py 中的逻辑）
    assert len(history_list) == 10

    # 验证保留的是最后一条 (id-14)
    assert history_list[-1]["query_id"] == "id-14"


@pytest.mark.asyncio
async def test_query_id_generation(rag_instance):
    """测试查询接口是否正确返回了 query_id"""

    query = "测试查询"
    # 这里我们只是为了测试 query_id 的生成机制，不需要真正的 LLM 成功返回
    # 即使 LLM 失败（因为没有 Key），aquery_llm 也会在 except 块中返回包含 query_id 的结果
    result = await rag_instance.aquery_llm(query)

    # 验证返回结构
    assert "query_id" in result
    assert result["query_id"] is not None
    assert len(result["query_id"]) > 0

    # 验证该 ID 可以用于提交反馈
    fb_result = await rag_instance.submit_feedback(
        result["query_id"],
        {"query_id": result["query_id"], "feedback_type": "like", "comment": "测试"},
    )
    assert fb_result is True
