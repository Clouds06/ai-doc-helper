# pytest -v -s -W ignore::DeprecationWarning tests/test_query_scores.py

import sys
import pytest
import numpy as np
from unittest.mock import AsyncMock, MagicMock
from fastapi import FastAPI
from fastapi.testclient import TestClient

pytestmark = pytest.mark.offline

# ==================== 【防止 argparse 报错】 ====================
_original_argv = sys.argv
sys.argv = ["pytest_runner"]

# 导入路由
from lightrag.api.routers.query_routes import create_query_routes, router

sys.argv = _original_argv
# ===============================================================


class MockRAG:
    def __init__(self):
        self.aquery_llm = AsyncMock()
        self.embedding_func = AsyncMock()
        self.config = MagicMock()


@pytest.fixture
def mock_rag():
    return MockRAG()


@pytest.fixture
def client(mock_rag):
    # 1. 清除旧路由
    router.routes = []
    # 2. 注入 Mock
    create_query_routes(rag=mock_rag)
    # 3. 创建 App 并挂载
    app = FastAPI()
    app.include_router(router)
    return TestClient(app)


def test_score_from_vector_search(client, mock_rag):
    """
    测试场景 1: 向量检索 (Naive/Mix)
    预期: 返回包含原始分数的列表 [0.88]
    """
    mock_rag.aquery_llm.return_value = {
        "status": "success",
        "data": {
            "chunks": [{"reference_id": "doc_1", "content": "Content", "score": 0.88}],
            "references": [{"reference_id": "doc_1", "file_path": "test.pdf"}],
        },
        "llm_response": {"content": "Res"},
    }

    payload = {
        "query": "test",
        "mode": "naive",
        "include_references": True,
        "include_chunk_content": True,
    }

    response = client.post("/query", json=payload)

    assert response.status_code == 200
    references = response.json().get("references")

    # 验证它是一个列表，且包含正确的值
    scores = references[0]["scores"]
    assert isinstance(scores, list)
    assert scores == [0.88]


def test_score_calculation_from_graph_search(client, mock_rag):
    """
    测试场景 2: 图谱检索 (Hybrid/Global)
    预期: 返回计算后的余弦相似度列表 [0.5]
    """
    mock_rag.aquery_llm.return_value = {
        "status": "success",
        "data": {
            "chunks": [
                {"reference_id": "doc_2", "content": "Graph Content", "score": None}
            ],
            "references": [{"reference_id": "doc_2", "file_path": "graph.pdf"}],
        },
        "llm_response": {"content": "Res"},
    }

    # 模拟向量: Query=[1,0], Chunk=[0.5, 0.866] -> Cosine=0.5
    async def side_effect(texts):
        if "test" in texts[0]:
            return [np.array([1.0, 0.0])]
        return [np.array([0.5, 0.866])]

    mock_rag.embedding_func.side_effect = side_effect

    payload = {
        "query": "test",
        "mode": "hybrid",
        "include_references": True,
        "include_chunk_content": True,
    }

    response = client.post("/query", json=payload)

    assert response.status_code == 200
    scores = response.json()["references"][0]["scores"]

    # 从列表中取出第一个值进行比较
    assert isinstance(scores, list)
    assert len(scores) == 1
    assert 0.499 < scores[0] < 0.501

    assert mock_rag.embedding_func.call_count >= 2


def test_score_fallback(client, mock_rag):
    """
    测试场景 3: 异常兜底
    预期: 返回兜底分数列表 [0.5]
    """
    mock_rag.aquery_llm.return_value = {
        "status": "success",
        "data": {
            "chunks": [{"reference_id": "doc_3", "content": "ERR", "score": None}],
            "references": [{"reference_id": "doc_3", "file_path": "err.pdf"}],
        },
        "llm_response": {"content": "Res"},
    }

    mock_rag.embedding_func.side_effect = Exception("API Error")

    payload = {"query": "Error", "mode": "hybrid", "include_references": True}

    response = client.post("/query", json=payload)

    assert response.status_code == 200
    scores = response.json()["references"][0]["scores"]

    # 【修正】验证列表
    assert isinstance(scores, list)
    assert scores == [0.5]
