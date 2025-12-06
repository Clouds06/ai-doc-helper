# pytest tests/test_doc_search_and_filter.py -v

import pytest
import os
import sys
from unittest.mock import AsyncMock, patch
from typing import Dict, Any

# 确保可以导入 lightrag 模块 (假设脚本在 tests/ 目录下，需要将上级目录加入 path)
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from lightrag.kg.json_doc_status_impl import JsonDocStatusStorage
from lightrag.base import DocStatus

pytestmark = pytest.mark.offline

# 模拟数据
MOCK_DATA: Dict[str, Any] = {
    "doc_1": {
        "content_summary": "A deep dive into Artificial Intelligence and LLMs.",
        "content_length": 1000,
        "file_path": "papers/ai_research.pdf",
        "status": "processed",
        "created_at": "2023-10-01T10:00:00",
        "updated_at": "2023-10-02T10:00:00",
    },
    "doc_2": {
        "content_summary": "Beginner guide to Python programming.",
        "content_length": 2000,
        "file_path": "tutorials/python_101.md",
        "status": "processed",
        "created_at": "2023-10-03T10:00:00",
        "updated_at": "2023-10-04T10:00:00",
    },
    "doc_3": {
        "content_summary": "Financial Report 2024 Q1.",
        "content_length": 1500,
        "file_path": "finance/report_2024.TXT",  # 注意大写后缀测试大小写不敏感
        "status": "processed",
        "created_at": "2023-10-05T10:00:00",
        "updated_at": "2023-10-06T10:00:00",
    },
    "doc_4": {
        "content_summary": "Meeting notes regarding project roadmap.",
        "content_length": 500,
        "file_path": "notes/roadmap.docx",
        "status": "failed",  # 不同状态
        "created_at": "2023-10-07T10:00:00",
        "updated_at": "2023-10-08T10:00:00",
    },
    "doc_5": {
        "content_summary": "Another PDF file about Python automation.",
        "content_length": 1200,
        "file_path": "books/python_automation.pdf",
        "status": "processed",
        "created_at": "2023-10-09T10:00:00",
        "updated_at": "2023-10-10T10:00:00",
    },
}


@pytest.fixture
def storage():
    """创建一个带有模拟数据的 JsonDocStatusStorage 实例"""
    config = {"working_dir": "/tmp/test_lightrag"}

    # 【修复点 1】定义一个假的 embedding function
    async def mock_embedding_func(texts: list[str]) -> list[list[float]]:
        return [[0.0] * 10 for _ in texts]  # 返回假向量

    # Mock 掉文件系统操作和锁机制
    with (
        patch("lightrag.kg.json_doc_status_impl.os.makedirs"),
        patch("lightrag.kg.json_doc_status_impl.get_namespace_lock") as mock_lock_cls,
    ):
        # 创建一个假的异步锁
        mock_lock = AsyncMock()
        mock_lock.__aenter__.return_value = None
        mock_lock.__aexit__.return_value = None
        mock_lock_cls.return_value = mock_lock

        # 【修复点 2】实例化存储时传入 embedding_func
        storage_instance = JsonDocStatusStorage(
            namespace="test_ns",
            workspace="default",
            global_config=config,
            embedding_func=mock_embedding_func,
        )

        # 手动注入模拟数据和锁
        storage_instance._storage_lock = mock_lock
        storage_instance._data = MOCK_DATA.copy()

        return storage_instance


@pytest.mark.asyncio
async def test_search_by_keyword_filename(storage):
    """测试：根据文件名关键词搜索"""
    # 搜索 "ai" 应匹配 doc_1 (ai_research.pdf)
    docs, total = await storage.get_docs_paginated(keyword="ai_research")
    assert total == 1
    assert docs[0][0] == "doc_1"


@pytest.mark.asyncio
async def test_search_by_keyword_summary(storage):
    """测试：根据内容摘要关键词搜索"""
    # 搜索 "guide" 应匹配 doc_2 (Beginner guide...)
    docs, total = await storage.get_docs_paginated(keyword="guide")
    assert total == 1
    assert docs[0][0] == "doc_2"


@pytest.mark.asyncio
async def test_search_by_keyword_case_insensitive(storage):
    """测试：关键词搜索不区分大小写"""
    # 搜索 "PYTHON" 应匹配 doc_2 (python_101.md) 和 doc_5 (python_automation.pdf)
    docs, total = await storage.get_docs_paginated(keyword="PYTHON")
    assert total == 2
    found_ids = sorted([d[0] for d in docs])
    assert found_ids == ["doc_2", "doc_5"]


@pytest.mark.asyncio
async def test_filter_by_file_type_pdf(storage):
    """测试：筛选 PDF 文件"""
    # 应匹配 doc_1 和 doc_5
    docs, total = await storage.get_docs_paginated(file_type="pdf")
    assert total == 2
    found_ids = sorted([d[0] for d in docs])
    assert found_ids == ["doc_1", "doc_5"]


@pytest.mark.asyncio
async def test_filter_by_file_type_case_insensitive(storage):
    """测试：文件后缀筛选不区分大小写"""
    # "txt" 应匹配 doc_3 (finance/report_2024.TXT)
    docs, total = await storage.get_docs_paginated(file_type="txt")
    assert total == 1
    assert docs[0][0] == "doc_3"


@pytest.mark.asyncio
async def test_filter_by_file_type_with_dot(storage):
    """测试：输入带点的后缀 (.md)"""
    # ".md" 应匹配 doc_2
    docs, total = await storage.get_docs_paginated(file_type=".md")
    assert total == 1
    assert docs[0][0] == "doc_2"


@pytest.mark.asyncio
async def test_combined_search_and_filter(storage):
    """测试：同时使用关键词和文件类型筛选"""
    # 搜索关键词 "python" 且类型为 "pdf" -> 只有 doc_5 符合 (doc_2 是 md)
    docs, total = await storage.get_docs_paginated(keyword="python", file_type="pdf")
    assert total == 1
    assert docs[0][0] == "doc_5"


@pytest.mark.asyncio
async def test_pagination(storage):
    """测试：分页逻辑"""
    # 现有限制：get_docs_paginated 强制 page_size 最小为 10
    # 为了测试分页，我们需要确保数据量超过 10 条。
    # 当前 fixture 中只有 5 条，我们在测试中动态添加 10 条额外数据，凑够 15 条。

    extra_docs = {}
    for i in range(6, 16):  # 生成 doc_6 到 doc_15
        extra_docs[f"doc_{i}"] = {
            "content_summary": f"Extra doc {i}",
            "content_length": 100,
            "file_path": f"extra/doc_{i}.txt",
            "status": "processed",
            "created_at": "2023-11-01T10:00:00",
            "updated_at": "2023-11-02T10:00:00",
        }

    # 更新存储中的模拟数据
    storage._data.update(extra_docs)

    # 现在的总数据量 = 5 (初始) + 10 (新增) = 15 条

    # --- 测试第一页 ---
    # 请求 10 条 (满足最小限制)
    docs_page1, total = await storage.get_docs_paginated(page=1, page_size=10)

    assert total == 15
    assert len(docs_page1) == 10  # 第一页应该满 10 条

    # --- 测试第二页 ---
    # 请求第二页
    docs_page2, _ = await storage.get_docs_paginated(page=2, page_size=10)

    assert len(docs_page2) == 5  # 剩下 5 条

    # --- 验证分页正确性 ---
    # 确保两页的文档 ID 没有重叠
    ids_p1 = {d[0] for d in docs_page1}
    ids_p2 = {d[0] for d in docs_page2}
    assert ids_p1.isdisjoint(ids_p2)


@pytest.mark.asyncio
async def test_no_match(storage):
    """测试：无匹配结果"""
    docs, total = await storage.get_docs_paginated(keyword="non_existent_keyword")
    assert total == 0
    assert len(docs) == 0


@pytest.mark.asyncio
async def test_status_filter_interaction(storage):
    """测试：状态过滤与其他条件结合"""
    # 筛选状态为 FAILED 的文档 (doc_4)
    docs, total = await storage.get_docs_paginated(status_filter=DocStatus.FAILED)
    assert total == 1
    assert docs[0][0] == "doc_4"

    # 筛选状态为 PROCESSED 且是 PDF (doc_1, doc_5)
    docs, total = await storage.get_docs_paginated(
        status_filter=DocStatus.PROCESSED, file_type="pdf"
    )
    assert total == 2
