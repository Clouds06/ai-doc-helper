#!/usr/bin/env python3
"""
准确率与引用率评测脚本

评测RAG系统回答的准确率和引用率：
- 准确率：模型回答是否至少覆盖gold数组中的一个关键点
- 引用率：模型回答是否引用了doc_hint中提示的正确文档

Usage:
    # 使用默认参数
    python lightrag/evaluation/eval_accuracy_citation.py

    # 指定评测数据集
    python lightrag/evaluation/eval_accuracy_citation.py --dataset EVAL.md

    # 指定RAG API端点
    python lightrag/evaluation/eval_accuracy_citation.py --ragendpoint http://localhost:9621

    # 查看帮助
    python lightrag/evaluation/eval_accuracy_citation.py --help
"""

import argparse
import asyncio
import json
import logging
import os
import re
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Tuple

import httpx

# 设置日志
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()],
)
logger = logging.getLogger(__name__)

# 添加父目录到路径
sys.path.insert(0, str(Path(__file__).parent.parent.parent))


class AccuracyCitationEvaluator:
    """评测RAG系统的准确率和引用率"""

    def __init__(self, dataset_path: str = None, rag_api_url: str = None):
        """
        初始化评测器

        Args:
            dataset_path: 评测数据集文件路径
            rag_api_url: LightRAG API基础URL
        """
        if dataset_path is None:
            dataset_path = Path(__file__).parent / "EVAL.md"

        if rag_api_url is None:
            rag_api_url = os.getenv("LIGHTRAG_API_URL", "http://localhost:9621")

        self.dataset_path = Path(dataset_path)
        self.rag_api_url = rag_api_url.rstrip("/")
        self.results_dir = Path(__file__).parent / "results"
        self.results_dir.mkdir(exist_ok=True)

        # 加载评测数据
        self.test_cases = self._load_evaluation_dataset()

        logger.info("=== 评测配置 ===")
        logger.info(f"评测数据集: {self.dataset_path.name}")
        logger.info(f"总用例数: {len(self.test_cases)}")
        logger.info(f"LightRAG API: {self.rag_api_url}")
        logger.info("================\n")

    def _load_evaluation_dataset(self) -> List[Dict[str, Any]]:
        """
        从JSONL文件加载评测数据

        Returns:
            评测用例列表

        Raises:
            FileNotFoundError: 如果数据集文件不存在
        """
        if not self.dataset_path.exists():
            raise FileNotFoundError(f"评测数据集不存在: {self.dataset_path}")

        test_cases = []
        with open(self.dataset_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line:
                    test_case = json.loads(line)
                    test_cases.append(test_case)

        return test_cases

    async def generate_rag_response(self, question: str) -> Dict[str, Any]:
        """
        调用LightRAG API生成回答

        Args:
            question: 用户问题

        Returns:
            包含answer和references的字典
        """
        async with httpx.AsyncClient(timeout=30.0) as client:
            payload = {
                "query": question,
                "mode": "mix",
                "include_references": True,
                "response_type": "Multiple Paragraphs",
                "top_k": 10,
            }

            # 获取API密钥
            api_key = os.getenv("LIGHTRAG_API_KEY")
            headers = {"X-API-Key": api_key} if api_key else None

            try:
                response = await client.post(
                    f"{self.rag_api_url}/query", json=payload, headers=headers
                )
                response.raise_for_status()
                result = response.json()

                return {
                    "answer": result.get("response", "No response generated"),
                    "references": result.get("references", []),
                }
            except Exception as e:
                logger.error(f"API调用错误: {str(e)}")
                return {"answer": f"Error: {str(e)}", "references": []}

    def evaluate_accuracy(
        self, answer: str, gold_points: List[str]
    ) -> Tuple[bool, str]:
        """
        评估准确率

        Args:
            answer: 模型回答
            gold_points: 标准答案要点列表

        Returns:
            (是否准确, 错误信息)
        """
        if not gold_points:
            return True, ""

        # 转换为小写进行匹配
        answer_lower = answer.lower()

        # 检查是否包含至少一个gold关键点
        for point in gold_points:
            point_lower = point.lower()
            # 使用正则表达式匹配，允许中间有其他字符
            # 对于较短的关键点，要求精确匹配
            if len(point_lower) <= 5:
                pattern = r"\b" + re.escape(point_lower) + r"\b"
            else:
                # 对于较长的关键点，使用分词匹配
                words = point_lower.split()
                pattern = ".*".join(re.escape(word) for word in words)

            if re.search(pattern, answer_lower, re.DOTALL):
                return True, ""

        # 如果没有匹配到任何关键点
        return False, f"未覆盖任何gold关键点，回答为'{answer[:50]}...'" if len(
            answer
        ) > 50 else f"未覆盖任何gold关键点，回答为'{answer}'"

    def evaluate_citation(
        self, references: List[Dict[str, Any]], expected_docs: List[str]
    ) -> Tuple[bool, str]:
        """
        评估引用率

        Args:
            references: 引用的文档列表
            expected_docs: 预期引用的文档列表

        Returns:
            (是否正确引用, 错误信息)
        """
        if not expected_docs:
            return True, ""

        # 提取引用的文档文件名
        cited_docs = []
        for ref in references:
            if isinstance(ref, dict):
                # 尝试从不同字段获取文档名
                for field in ["file_name", "filename", "title", "source"]:
                    if field in ref and ref[field]:
                        doc_name = str(ref[field])
                        # 提取文件名（如果是路径）
                        doc_name = doc_name.split("/")[-1].split("\\")[-1]
                        cited_docs.append(doc_name)
                        break

        # 检查是否至少引用了一个预期的文档
        for expected_doc in expected_docs:
            # 检查是否有引用包含预期文档名（不区分大小写）
            for cited_doc in cited_docs:
                if expected_doc.lower() in cited_doc.lower():
                    return True, ""

        # 如果没有引用任何预期文档
        if cited_docs:
            return (
                False,
                f"引用了错误文档 '{', '.join(cited_docs[:3])}'，预期是 '{', '.join(expected_docs)}'"
                if len(cited_docs) > 3
                else f"引用了错误文档 '{', '.join(cited_docs)}'，预期是 '{', '.join(expected_docs)}'",
            )
        else:
            return False, f"未引用任何文档，预期引用 '{', '.join(expected_docs)}'"

    async def evaluate_single_case(
        self, idx: int, test_case: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        评估单个测试用例

        Args:
            idx: 用例索引
            test_case: 测试用例

        Returns:
            评估结果
        """
        question = test_case.get("q", "")
        gold_points = test_case.get("gold", [])
        expected_docs = test_case.get("doc_hint", [])

        logger.info(f"[EVAL] 正在处理 Q{idx + 1}: {question[:50]}...")

        # 生成RAG回答
        rag_response = await self.generate_rag_response(question)
        answer = rag_response["answer"]
        references = rag_response["references"]

        # 评估准确率
        accuracy_result, accuracy_error = self.evaluate_accuracy(answer, gold_points)

        # 评估引用率
        citation_result, citation_error = self.evaluate_citation(
            references, expected_docs
        )

        # 生成note
        note = f"Q{idx + 1}: "
        if accuracy_result and citation_result:
            note += f"准确率和引用率均符合预期，回答完整覆盖gold关键点且引用了正确文档 '{', '.join(expected_docs)}'。"
        else:
            errors = []
            if not accuracy_result:
                errors.append(f"{accuracy_error}（预期提及'{', '.join(gold_points)}'）")
            if not citation_result:
                errors.append(citation_error)
            note += "，".join(errors)

        result = {
            "test_number": idx + 1,
            "question": question,
            "answer": answer,
            "accuracy": accuracy_result,
            "citation": citation_result,
            "accuracy_error": accuracy_error,
            "citation_error": citation_error,
            "note": note,
        }

        # 控制台输出
        accuracy_mark = "√" if accuracy_result else "×"
        citation_mark = "√" if citation_result else "×"

        console_line = f"[EVAL] Q{idx + 1} - 准确率：{accuracy_mark}"
        if not accuracy_result:
            console_line += f"（{accuracy_error}）"

        console_line += f" | 引用率：{citation_mark}"
        if not citation_result:
            console_line += f"（{citation_error}）"

        logger.info(console_line)

        return result

    async def run_evaluation(self):
        """
        运行完整评测
        """
        logger.info(f"[EVAL] 评测开始，总用例数：{len(self.test_cases)}")
        start_time = time.time()

        results = []
        total_accuracy = 0
        total_citation = 0

        # 逐个评测用例
        for idx, test_case in enumerate(self.test_cases):
            result = await self.evaluate_single_case(idx, test_case)
            results.append(result)

            if result["accuracy"]:
                total_accuracy += 1
            if result["citation"]:
                total_citation += 1

        # 计算整体指标
        overall_accuracy = (
            (total_accuracy / len(self.test_cases)) * 100 if self.test_cases else 0
        )
        overall_citation = (
            (total_citation / len(self.test_cases)) * 100 if self.test_cases else 0
        )

        # 控制台输出整体结果
        logger.info(
            f"[EVAL] 评测完成 - 整体准确率：{overall_accuracy:.1f}% | 整体引用率：{overall_citation:.1f}%"
        )

        # 输出Notes
        logger.info("\nNotes:")
        for result in results:
            logger.info(f"{result['test_number']}. {result['note']}")

        # 保存结果到文件
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        result_file = self.results_dir / f"eval_results_{timestamp}.json"

        with open(result_file, "w", encoding="utf-8") as f:
            json.dump(
                {
                    "timestamp": datetime.now().isoformat(),
                    "duration_seconds": time.time() - start_time,
                    "total_cases": len(self.test_cases),
                    "overall_accuracy": overall_accuracy,
                    "overall_citation": overall_citation,
                    "results": results,
                },
                f,
                ensure_ascii=False,
                indent=2,
            )

        logger.info(f"\n评测结果已保存到：{result_file}")

        # 返回页面展示内容
        page_content = self._generate_page_content(
            results, overall_accuracy, overall_citation
        )
        return page_content

    def _generate_page_content(
        self,
        results: List[Dict[str, Any]],
        overall_accuracy: float,
        overall_citation: float,
    ) -> str:
        """
        生成页面展示内容

        Args:
            results: 评测结果列表
            overall_accuracy: 整体准确率
            overall_citation: 整体引用率

        Returns:
            页面HTML内容
        """
        html = f"""
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>RAG评测结果</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                h1 {{ color: #333; }}
                .metrics {{ background: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 20px; }}
                .metric {{ display: inline-block; margin-right: 30px; font-size: 18px; }}
                .metric strong {{ color: #2c3e50; }}
                table {{ width: 100%; border-collapse: collapse; margin-bottom: 20px; }}
                th, td {{ border: 1px solid #ddd; padding: 12px; text-align: left; }}
                th {{ background-color: #f2f2f2; }}
                .success {{ color: #27ae60; }}
                .error {{ color: #e74c3c; }}
                .error-summary {{ background: #ffeaea; padding: 20px; border-radius: 5px; border-left: 4px solid #e74c3c; }}
            </style>
        </head>
        <body>
            <h1>RAG系统评测结果</h1>

            <div class="metrics">
                <div class="metric">
                    <strong>整体准确率：</strong>{overall_accuracy:.1f}% ({sum(1 for r in results if r['accuracy'])}/{len(results)})
                </div>
                <div class="metric">
                    <strong>整体引用率：</strong>{overall_citation:.1f}% ({sum(1 for r in results if r['citation'])}/{len(results)})
                </div>
            </div>

            <h2>单例结果</h2>
            <table>
                <tr>
                    <th>用例</th>
                    <th>问题</th>
                    <th>模型回答</th>
                    <th>准确率</th>
                    <th>引用率</th>
                </tr>
        """

        for result in results:
            accuracy_mark = (
                "<span class='success'>√</span>"
                if result["accuracy"]
                else "<span class='error'>×</span>"
            )
            citation_mark = (
                "<span class='success'>√</span>"
                if result["citation"]
                else "<span class='error'>×</span>"
            )

            # 截断长文本
            question_display = (
                result["question"][:100] + "..."
                if len(result["question"]) > 100
                else result["question"]
            )
            answer_display = (
                result["answer"][:200] + "..."
                if len(result["answer"]) > 200
                else result["answer"]
            )

            html += f"""
                <tr>
                    <td>Q{result['test_number']}</td>
                    <td title="{result['question']}">{question_display}</td>
                    <td title="{result['answer']}">{answer_display}</td>
                    <td>{accuracy_mark}</td>
                    <td>{citation_mark}</td>
                </tr>
            """

        html += "</table>"

        # 错误汇总
        error_results = [r for r in results if not r["accuracy"] or not r["citation"]]
        if error_results:
            html += "<h2>错误汇总</h2><div class='error-summary'><ul>"
            for result in error_results:
                errors = []
                if not result["accuracy"]:
                    errors.append(f"准确率不通过: {result['accuracy_error']}")
                if not result["citation"]:
                    errors.append(f"引用率不通过: {result['citation_error']}")
                html += f"<li>Q{result['test_number']}: {', '.join(errors)}</li>"
            html += "</ul></div>"

        html += "</body></html>"

        # 保存HTML结果
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        html_file = self.results_dir / f"eval_results_{timestamp}.html"
        with open(html_file, "w", encoding="utf-8") as f:
            f.write(html)

        logger.info(f"HTML报告已保存到：{html_file}")

        return html


def main():
    """主函数"""
    parser = argparse.ArgumentParser(description="准确率与引用率评测脚本")
    parser.add_argument("--dataset", "-d", help="评测数据集文件路径", default=None)
    parser.add_argument("--ragendpoint", "-r", help="LightRAG API端点", default=None)
    args = parser.parse_args()

    try:
        evaluator = AccuracyCitationEvaluator(args.dataset, args.ragendpoint)
        asyncio.run(evaluator.run_evaluation())
    except Exception as e:
        logger.error(f"评测失败: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
