"""
This module contains routes for accessing evaluation data and running evaluations.
"""

import json
import os
import asyncio
from pathlib import Path
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from lightrag.api.utils_api import get_combined_auth_dependency

# Import evaluation functions
import sys
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
        eval_dataset_path: Optional[str] = "/Users/wangzihao/PycharmProjects/new/eval_accuracy_citation/EVAL.jsonl",
        input_docs_dir: Optional[str] = None,
        skip_ingestion: Optional[bool] = None,
        output_format: Optional[str] = "json"
    ):
        """
        Run evaluation on the LightRAG system using the RAGAS framework.
        
        This endpoint triggers the evaluation process and returns the results file
        in either JSON or CSV format.
        
        Args:
            eval_dataset_path: Path to the evaluation JSONL file
            input_docs_dir: Directory containing documents to ingest
            skip_ingestion: If True, skip document ingestion
            output_format: Format of the output file ("json" or "csv")
            
        Returns:
            FileResponse: The evaluation results file
        
        Raises:
            HTTPException: If the evaluation fails or the file format is invalid
        """
        try:
            # Validate output format
            if output_format not in ["json", "csv"]:
                raise HTTPException(status_code=400, detail="Invalid output format. Must be either 'json' or 'csv'")
            
            # Initialize evaluator and run evaluation
            evaluator = RAGASEvaluator(input_docs_dir=input_docs_dir)
            results = await evaluator.run_evaluation(
                eval_file_path=eval_dataset_path,
                skip_ingestion=skip_ingestion
            )
            
            # Check if evaluation was successful
            if "error" in results:
                raise HTTPException(status_code=500, detail=f"Evaluation failed: {results['error']}")
            
            # Find the latest results file
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
                media_type=f"application/{output_format}",
                filename=latest_file.name
            )
            
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to run evaluation: {str(e)}")

    return router
