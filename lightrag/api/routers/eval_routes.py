"""
This module contains routes for accessing evaluation data.
"""

import json
import os
import asyncio
import sys
from pathlib import Path
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse, FileResponse, Response
from lightrag.api.utils_api import get_combined_auth_dependency

# 添加eval_accuracy_citation目录到Python路径
# 优先尝试相对路径
eval_dir = Path(__file__).parent.parent.parent.parent / "eval_accuracy_citation"
if not eval_dir.exists():
    # 尝试绝对路径
    eval_dir = Path("/Users/wangzihao/PycharmProjects/new/eval_accuracy_citation")

if eval_dir.exists():
    sys.path.insert(0, str(eval_dir))
    # 导入评测管道
    from rag_eval_pipeline import run_eval_pipeline
else:
    raise ImportError(f"无法找到eval_accuracy_citation目录: {eval_dir}")


router = APIRouter(tags=["evaluation"])

def create_eval_routes(rag, api_key: str = None):
    combined_auth = get_combined_auth_dependency(api_key)

    @router.get(
        "/eval/data",
        response_model=List[Dict[str, Any]],
        dependencies=[Depends(combined_auth)],
        responses={
            200: {
                "description": "Successfully retrieved evaluation data",
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "q": {
                                        "type": "string",
                                        "description": "Evaluation question"
                                    },
                                    "gold": {
                                        "type": "array",
                                        "items": {"type": "string"},
                                        "description": "Expected answers"
                                    },
                                    "doc_hint": {
                                        "type": "array",
                                        "items": {"type": "string"},
                                        "description": "Relevant document hints"
                                    }
                                },
                                "required": ["q", "gold", "doc_hint"]
                            }
                        },
                        "example": [
                            {
                                "q": "What are the main components of a RAG system?",
                                "gold": ["Retrieval system", "Embedding model", "LLM"],
                                "doc_hint": ["rag_architecture.md"]
                            }
                        ]
                    }
                }
            },
            500: {
                "description": "Failed to read evaluation data",
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "object",
                            "properties": {
                                "detail": {
                                    "type": "string",
                                    "description": "Error message"
                                }
                            }
                        },
                        "example": {
                            "detail": "Failed to read evaluation data: File not found"
                        }
                    }
                }
            }
        }
    )
    async def get_eval_data():
        """
        Retrieve evaluation data from the EVAL.jsonl file.
        
        This endpoint returns all evaluation questions, expected answers, 
        and document hints from the evaluation dataset.
        
        Returns:
            List[Dict[str, Any]]: A list of evaluation data entries, each containing:
                - q: The evaluation question
                - gold: The expected answers (list of strings)
                - doc_hint: The relevant document hints (list of strings)
        
        Raises:
            HTTPException: If the evaluation data file cannot be read
        """
        try:
            # Use relative path to find EVAL.jsonl
            current_dir = Path(__file__).parent.parent.parent
            eval_file_path = current_dir / "eval_accuracy_citation" / "EVAL.jsonl"
            
            # Fallback to absolute path if relative path doesn't exist
            if not eval_file_path.exists():
                eval_file_path = Path("/Users/wangzihao/PycharmProjects/new/eval_accuracy_citation/EVAL.jsonl")
            
            eval_data = []
            
            with open(eval_file_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line:
                        entry = json.loads(line)
                        eval_data.append(entry)
            
            return eval_data
            
        except FileNotFoundError:
            raise HTTPException(
                status_code=500,
                detail=f"Evaluation data file not found at: {eval_file_path}"
            )
        except json.JSONDecodeError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to parse evaluation data: {str(e)}"
            )
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to read evaluation data: {str(e)}"
            )



    @router.post(
        "/eval/do_eval",
        response_model=Dict[str, Any],
        dependencies=[Depends(combined_auth)],
        responses={
            200: {
                "description": "Successfully completed evaluation pipeline",
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "object",
                            "properties": {
                                "detailed_results": {
                                    "type": "array",
                                    "items": {
                                        "type": "object",
                                        "description": "Detailed evaluation results for each question"
                                    }
                                },
                                "averages": {
                                    "type": "object",
                                    "properties": {
                                        "faithfulness": {
                                            "type": "number",
                                            "description": "Average faithfulness score"
                                        },
                                        "answer_relevancy": {
                                            "type": "number",
                                            "description": "Average answer relevancy score"
                                        },
                                        "context_recall": {
                                            "type": "number",
                                            "description": "Average context recall score"
                                        },
                                        "context_precision": {
                                            "type": "number",
                                            "description": "Average context precision score"
                                        }
                                    }
                                },
                                "total_count": {
                                    "type": "integer",
                                    "description": "Total number of evaluated questions"
                                },
                                "results_file": {
                                    "type": "string",
                                    "description": "Path to the results file"
                                }
                            },
                            "required": ["detailed_results", "averages", "total_count", "results_file"]
                        }
                    }
                }
            },
            500: {
                "description": "Failed to execute evaluation pipeline",
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "object",
                            "properties": {
                                "detail": {
                                    "type": "string",
                                    "description": "Error message"
                                }
                            }
                        }
                    }
                }
            }
        }
    )
    async def do_eval(line_number: Optional[int] = None, output_file: Optional[str] = None):
        """
        Run the complete RAG evaluation pipeline.
        
        This endpoint executes the full evaluation pipeline including:
        1. Reading evaluation questions from EVAL.jsonl
        2. Getting responses from LightRAG server
        3. Evaluating responses using various metrics
        4. Saving results to a JSON file
        
        Args:
            line_number: Specific line number to evaluate (1-based), if None evaluates all questions
            output_file: Output file path, if None generates a timestamped filename automatically
        
        Returns:
            Dict[str, Any]: Evaluation results including detailed results, averages, total count, and results file path
        
        Raises:
            HTTPException: If the evaluation pipeline fails to execute
        """
        try:
            # 调用评测管道，传递rag对象
            results = await run_eval_pipeline(line_number=line_number, output_file=output_file, rag=rag)
            return results
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Evaluation pipeline failed: {str(e)}"
            )

    return router
