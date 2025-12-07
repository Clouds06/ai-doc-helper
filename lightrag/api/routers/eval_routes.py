"""
This module contains routes for accessing evaluation data and running evaluations.
"""

import json
import os
import asyncio
from pathlib import Path
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse, FileResponse, Response
from lightrag.api.utils_api import get_combined_auth_dependency

# Import evaluation functions
import sys
# Use relative path to find eval_accuracy_citation directory
current_dir = Path(__file__).parent.parent.parent
eval_dir = current_dir / "eval_accuracy_citation"
if eval_dir.exists():
    sys.path.insert(0, str(eval_dir))
else:
    # Fallback to absolute path if relative path doesn't work
    sys.path.append('/Users/wangzihao/PycharmProjects/new/eval_accuracy_citation')
from ragas_evaluation import evaluate_rag_system, RAGASEvaluator

router = APIRouter(tags=["evaluation"])

def create_eval_routes(api_key: str = None):
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
        "/eval/run",
        dependencies=[Depends(combined_auth)],
        responses={
            200: {
                "description": "Successfully ran evaluation and returned results file",
                "content": {
                    "application/json": {
                        "description": "Evaluation results in JSON format"
                    },
                    "text/csv": {
                        "description": "Evaluation results in CSV format"
                    }
                }
            },
            400: {
                "description": "Invalid request parameters",
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
            },
            500: {
                "description": "Failed to run evaluation",
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
    async def run_evaluation(
        eval_dataset_path: Optional[str] = None,
        input_docs_dir: Optional[str] = None,
        skip_ingestion: Optional[bool] = None,
        output_format: Optional[str] = "json"
    ):
        """
        Run evaluation on the LightRAG system using the RAGAS framework.
        
        This endpoint triggers the evaluation process and returns the results
        in JSON format with detailed evaluation data.
        
        Args:
            eval_dataset_path: Path to the evaluation JSONL file (if None, uses default)
            input_docs_dir: Directory containing documents to ingest
            skip_ingestion: If True, skip document ingestion
            output_format: Format of the output ("json" or "csv") - currently only JSON is supported for API response
            
        Returns:
            JSONResponse: The evaluation results in JSON format containing:
                - detailed_results: List of detailed evaluation results for each test case
                - averages: Dictionary with average scores
                - total_count: Number of test cases evaluated
                - results_file: Path to the saved results file
        
        Raises:
            HTTPException: If the evaluation fails or the file format is invalid
        """
        try:
            # Validate output format
            if output_format not in ["json", "csv"]:
                raise HTTPException(status_code=400, detail="Invalid output format. Must be either 'json' or 'csv'")
            
            # Use relative path to find EVAL.jsonl if not provided
            if eval_dataset_path is None:
                current_dir = Path(__file__).parent.parent.parent
                default_eval_path = current_dir / "eval_accuracy_citation" / "EVAL.jsonl"
                if default_eval_path.exists():
                    eval_dataset_path = str(default_eval_path)
                else:
                    # Fallback to absolute path
                    eval_dataset_path = "/Users/wangzihao/PycharmProjects/new/eval_accuracy_citation/EVAL.jsonl"
            
            # Convert relative paths to absolute if needed
            if eval_dataset_path and not os.path.isabs(eval_dataset_path):
                current_dir = Path(__file__).parent.parent.parent
                eval_dataset_path = str(current_dir / eval_dataset_path)
            
            if input_docs_dir and not os.path.isabs(input_docs_dir):
                current_dir = Path(__file__).parent.parent.parent
                input_docs_dir = str(current_dir / input_docs_dir)
            
            # Initialize evaluator and run evaluation
            evaluator = RAGASEvaluator(input_docs_dir=input_docs_dir)
            results = await evaluator.run_evaluation(
                eval_file_path=eval_dataset_path,
                skip_ingestion=skip_ingestion
            )
            
            # Check if evaluation was successful
            if "error" in results:
                raise HTTPException(status_code=500, detail=f"Evaluation failed: {results['error']}")
            
            # For JSON format, return the detailed results directly
            # Use custom Response to ensure proper UTF-8 encoding without ASCII escaping
            if output_format == "json":
                json_str = json.dumps(results, ensure_ascii=False, indent=2)
                return Response(
                    content=json_str,
                    media_type="application/json; charset=utf-8",
                    headers={"Content-Type": "application/json; charset=utf-8"}
                )
            
            # For CSV format, return the file (but still save JSON for API compatibility)
            # Find the latest results file
            current_dir = Path(__file__).parent.parent.parent
            results_dir = current_dir / "eval_accuracy_citation" / "results"
            
            # Fallback to absolute path if relative doesn't exist
            if not results_dir.exists():
                results_dir = Path("/Users/wangzihao/PycharmProjects/new/eval_accuracy_citation/results")
            
            if not results_dir.exists():
                raise HTTPException(status_code=500, detail="Results directory not found")
            
            # Get all result files and find the latest one
            result_files = list(results_dir.glob(f"results_*.{output_format}"))
            if not result_files:
                raise HTTPException(status_code=500, detail=f"No {output_format} result files found")
            
            # Sort files by modification time (newest first)
            latest_file = max(result_files, key=lambda x: x.stat().st_mtime)
            
            # Return the latest file
            return FileResponse(
                path=latest_file,
                media_type=f"text/{output_format}",
                filename=latest_file.name
            )
            
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to run evaluation: {str(e)}")

    return router
