import os
import json
import glob
import asyncio
import logging
import time
import pandas as pd
from typing import Dict, List, Optional, Any
from datetime import datetime
from datasets import Dataset

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Ragas & LangChain imports
from ragas import evaluate
from ragas.metrics import (
    faithfulness,
    answer_relevancy,
    context_recall,
    context_precision,
)
from ragas.llms import LangchainLLMWrapper
from langchain_openai import ChatOpenAI, OpenAIEmbeddings

# Configure logging with more detail
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('ragas_evaluation.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class RAGASEvaluator:
    """
    Evaluator class for LightRAG using RAGAS framework.
    Handles document loading, querying, and metric calculation.
    """

    def __init__(self, lightrag_api_url: str = "http://localhost:9621"):
        self.lightrag_api_url = lightrag_api_url.rstrip('/')
        self.llm = self._init_llm()
        self.embeddings = self._init_embeddings()

        # Define metrics list
        self.metrics = [
            faithfulness,
            answer_relevancy,
            context_recall,
            context_precision,
        ]

    def _init_llm(self) -> ChatOpenAI:
        """Initialize LLM from environment variables."""
        api_key = os.getenv("EVAL_LLM_BINDING_API_KEY", os.getenv("OPENAI_API_KEY"))
        base_url = os.getenv("EVAL_LLM_BINDING_HOST", None)  # Default to OpenAI if None
        model = os.getenv("EVAL_LLM_MODEL", "gpt-4o-mini")

        if not api_key:
            logger.warning("No API key found for LLM. Ensure OPENAI_API_KEY or EVAL_LLM_BINDING_API_KEY is set.")

        logger.info(f"Initializing LLM: {model} (Base URL: {base_url or 'OpenAI Default'})")
        
        # Additional configuration for custom models
        llm_kwargs = {
            "model": model,
            "api_key": api_key,
            "base_url": base_url,
            "temperature": 0,  # Deterministic for evaluation
            "max_retries": int(os.getenv("EVAL_LLM_MAX_RETRIES", 5)),
            "timeout": int(os.getenv("EVAL_LLM_TIMEOUT", 180)),
            "n": 1  # Force n=1 for APIs that don't support multiple completions
        }
        
        # Remove None values to avoid issues with ChatOpenAI
        llm_kwargs = {k: v for k, v in llm_kwargs.items() if v is not None}
        
        # Create LLM instance with n=1 enforced
        base_llm = ChatOpenAI(**llm_kwargs)
        
        # Use RAGAS LangchainLLMWrapper for proper compatibility
        ragas_llm = LangchainLLMWrapper(base_llm)
        
        return ragas_llm

    def _init_embeddings(self) -> OpenAIEmbeddings:
        """Initialize Embeddings from environment variables."""
        # Fallback logic: specific embedding key -> specific llm key -> general openai key
        api_key = os.getenv("EVAL_EMBEDDING_BINDING_API_KEY",
                            os.getenv("EVAL_LLM_BINDING_API_KEY",
                                      os.getenv("OPENAI_API_KEY")))

        # Fallback logic: specific embedding host -> specific llm host -> None (OpenAI)
        base_url = os.getenv("EVAL_EMBEDDING_BINDING_HOST",
                             os.getenv("EVAL_LLM_BINDING_HOST"))

        model = os.getenv("EVAL_EMBEDDING_MODEL", "text-embedding-3-large")

        if not api_key:
            logger.warning("No API key found for Embeddings. Ensure EVAL_EMBEDDING_BINDING_API_KEY or EVAL_LLM_BINDING_API_KEY is set.")

        logger.info(f"Initializing Embeddings: {model} (Base URL: {base_url or 'OpenAI Default'})")
        
        # Additional configuration for custom models
        embedding_kwargs = {
            "model": model,
            "api_key": api_key,
            "base_url": base_url,
            "check_embedding_ctx_length": False,
            "max_retries": int(os.getenv("EVAL_LLM_MAX_RETRIES", 5)),
            "timeout": int(os.getenv("EVAL_LLM_TIMEOUT", 180))
        }
        
        # Remove None values to avoid issues with OpenAIEmbeddings
        embedding_kwargs = {k: v for k, v in embedding_kwargs.items() if v is not None}
        
        return OpenAIEmbeddings(**embedding_kwargs)

    async def ingest_documents(self, input_dir: str = "data/inputs/__enqueued__") -> None:
        """Load .md files from input directory and index them into LightRAG."""
        # Convert relative path to absolute path if needed
        if not os.path.isabs(input_dir):
            # Get the absolute path relative to the project root (not script directory)
            project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            input_dir = os.path.join(project_root, input_dir)
        
        # Normalize path separators for Windows
        input_dir = os.path.normpath(input_dir)
        
        # Use proper path joining for glob pattern
        md_files = glob.glob(os.path.join(input_dir, "*.md"))
        if not md_files:
            logger.warning(f"No markdown files found in {input_dir}")
            # List the actual files in the directory for debugging
            if os.path.exists(input_dir):
                actual_files = os.listdir(input_dir)
                logger.info(f"Actual files in {input_dir}: {actual_files}")
            return []  # Return empty list instead of None

        logger.info(f"Found {len(md_files)} documents to ingest.")
        ingestion_results = []

        import aiohttp
        async with aiohttp.ClientSession() as session:
            for file_path in md_files:
                try:
                    logger.debug(f"Ingesting document: {file_path}")
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()

                    # Construct payload for LightRAG /documents/text endpoint
                    # Adjust endpoint if LightRAG uses a different structure
                    payload = {"text": content, "file_source": os.path.basename(file_path)}

                    # Use the correct LightRAG endpoint for text ingestion
                    url = f"{self.lightrag_api_url}/documents/text"

                    async with session.post(url, json=payload) as response:
                        response_text = await response.text()
                        logger.debug(f"Ingestion response for {file_path}: Status {response.status}, Body: {response_text}")
                        if response.status == 200:
                            logger.info(f"Successfully ingested: {os.path.basename(file_path)}")
                            ingestion_results.append({"file": file_path, "status": "success"})
                        else:
                            logger.error(f"Failed to ingest {os.path.basename(file_path)}: HTTP {response.status} - {response_text}")
                            ingestion_results.append({"file": file_path, "status": "failed", "error": response_text})

                except Exception as e:
                    logger.error(f"Exception during ingestion of {file_path}: {e}", exc_info=True)
                    ingestion_results.append({"file": file_path, "status": "failed", "error": str(e)})

            # Summary of ingestion results
            successful = sum(1 for r in ingestion_results if r.get("status") == "success")
            failed = sum(1 for r in ingestion_results if r.get("status") == "failed")
            logger.info(f"Document ingestion completed. Success: {successful}, Failed: {failed}, Total: {len(ingestion_results)}")
            if failed > 0:
                logger.error("Some documents failed to ingest. This will affect retrieval quality.")
                for result in ingestion_results:
                    if result.get("status") == "failed":
                        logger.error(f"Failed ingestion: {result.get('file')} - {result.get('error')}")
            
            return ingestion_results

    async def query_lightrag(self, question: str) -> Dict[str, Any]:
        """Query LightRAG API for answer and retrieved contexts."""
        top_k = int(os.getenv("EVAL_QUERY_TOP_K", 10))

        import aiohttp
        async with aiohttp.ClientSession() as session:
            url = f"{self.lightrag_api_url}/query"
            payload = {
                "query": question,
                "mode": "hybrid",  # Assuming hybrid is standard, can be configured
                "top_k": top_k
            }

            try:
                async with session.post(url, json=payload) as response:
                    if response.status != 200:
                        logger.error(f"Query failed for '{question}': {response.status}")
                        return {"answer": "", "contexts": []}

                    data = await response.json()

                    # Debug: Log the actual response structure
                    logger.debug(f"LightRAG response structure: {data}")

                    # Parse response based on standard LightRAG output format
                    # Try multiple possible field names for the answer
                    answer = (data.get("response", "") or 
                             data.get("answer", "") or 
                             data.get("result", "") or 
                             "")

                    # Extract contexts - try multiple possible field names and formats
                    contexts = []
                    
                    # Try different possible context field names
                    context_fields = ["context", "contexts", "documents", "chunks", "sources", "retrieved_docs"]
                    context_raw = None
                    
                    for field in context_fields:
                        if field in data and data[field]:
                            context_raw = data[field]
                            logger.debug(f"Found context in field '{field}': {context_raw}")
                            break
                    
                    if context_raw is None:
                        # Check if the entire response might be the context
                        if isinstance(data, dict) and len(data) > 0:
                            # Try to extract any list or string values that might be contexts
                            for key, value in data.items():
                                if key not in ["response", "answer", "result", "query"]:
                                    if isinstance(value, (list, str)):
                                        context_raw = value
                                        logger.debug(f"Using '{key}' as context: {context_raw}")
                                        break

                    if isinstance(context_raw, str):
                        contexts = [context_raw]  # Wrap single string
                    elif isinstance(context_raw, list):
                        # If list of objects, extract text; if strings, use as is
                        contexts = []
                        for c in context_raw:
                            if isinstance(c, str):
                                contexts.append(c)
                            elif isinstance(c, dict):
                                # Try to extract text from common fields
                                text = (c.get("text", "") or 
                                       c.get("content", "") or 
                                       c.get("document", "") or 
                                       "")
                                if text.strip():
                                    contexts.append(text)
                                else:
                                    # If content is None but we have file_path, try to read the file
                                    file_path = c.get("file_path", "")
                                    if file_path:
                                        # Try to resolve the file path relative to the data directory
                                        if not os.path.isabs(file_path):
                                            # Look for the file in common locations
                                            possible_paths = [
                                                os.path.join("data", "inputs", "__enqueued__", file_path),
                                                os.path.join("data", "inputs", file_path),
                                                os.path.join("data", file_path),
                                                file_path
                                            ]
                                            
                                            file_found = False
                                            for path in possible_paths:
                                                if os.path.exists(path):
                                                    try:
                                                        with open(path, 'r', encoding='utf-8') as f:
                                                            text = f.read()
                                                        contexts.append(text)
                                                        logger.debug(f"Read content from file {path}")
                                                        file_found = True
                                                        break
                                                    except Exception as e:
                                                        logger.warning(f"Failed to read file {path}: {e}")
                                            
                                            if not file_found:
                                                logger.warning(f"Could not find file {file_path} in any of: {possible_paths}")
                                                # Fallback: try to get any meaningful content
                                                fallback_text = ""
                                                for key in ["reference_id", "file_path", "title", "name"]:
                                                    if c.get(key):
                                                        fallback_text += f"{key}: {c.get(key)}\n"
                                                if fallback_text:
                                                    contexts.append(fallback_text.strip())
                                        else:
                                            if os.path.exists(file_path):
                                                try:
                                                    with open(file_path, 'r', encoding='utf-8') as f:
                                                        text = f.read()
                                                    contexts.append(text)
                                                    logger.debug(f"Read content from file {file_path}")
                                                except Exception as e:
                                                    logger.warning(f"Failed to read file {file_path}: {e}")
                                            else:
                                                logger.warning(f"File not found: {file_path}")
                                                # Fallback to metadata
                                                fallback_text = ""
                                                for key in ["reference_id", "file_path", "title", "name"]:
                                                    if c.get(key):
                                                        fallback_text += f"{key}: {c.get(key)}\n"
                                                if fallback_text:
                                                    contexts.append(fallback_text.strip())
                                    else:
                                        # Fallback: try to get any meaningful content
                                        fallback_text = ""
                                        for key in ["reference_id", "file_path", "title", "name"]:
                                            if c.get(key):
                                                fallback_text += f"{key}: {c.get(key)}\n"
                                        if fallback_text:
                                            contexts.append(fallback_text.strip())
                            else:
                                contexts.append(str(c))
                    
                    # If still no contexts, log a warning
                    if not contexts:
                        logger.warning(f"No contexts retrieved for question: {question}")
                        logger.warning(f"Response: {data}")
                        contexts = []  # Ensure it's an empty list, not None
                    else:
                        logger.info(f"Retrieved {len(contexts)} contexts for question: {question}")
                        # Debug: Show first context preview
                        if contexts and len(contexts[0]) > 0:
                            preview = contexts[0][:100] + "..." if len(contexts[0]) > 100 else contexts[0]
                            logger.debug(f"First context preview: {preview}")
                        else:
                            logger.warning("First context is empty!")

                    return {"answer": answer, "contexts": contexts}
            except Exception as e:
                logger.error(f"Exception querying LightRAG: {e}", exc_info=True)
                return {"answer": "", "contexts": []}

    async def run_evaluation(self, eval_file_path: str = "EVAL.jsonl", skip_ingestion: bool = False) -> Dict[str, float]:
        """Main execution flow: ingest -> generate -> evaluate.
        
        Args:
            eval_file_path: Path to the evaluation JSONL file
            skip_ingestion: If True, skip document ingestion and use existing knowledge graph
        """

        # 1. Ingest Documents (optional)
        if not skip_ingestion:
            ingestion_results = await self.ingest_documents()
            # Verify ingestion succeeded
            successful_ingestions = sum(1 for r in ingestion_results if r.get("status") == "success")
            if successful_ingestions == 0:
                logger.error("No documents were successfully ingested. Cannot proceed with evaluation.")
                return {"error": "Document ingestion failed", "ingestion_results": ingestion_results}
            logger.info(f"Successfully ingested {successful_ingestions} documents. Proceeding with evaluation...")
            
            # Test LightRAG query with a simple question
            logger.info("Testing LightRAG query functionality...")
            test_query = "What is LightRAG?"
            test_result = await self.query_lightrag(test_query)
            logger.info(f"Test query result: {len(test_result['contexts'])} contexts retrieved")
            
            if not test_result['contexts']:
                logger.error("LightRAG test query returned no contexts! Check LightRAG API and indexing.")
                logger.error(f"Test result: {test_result}")
                return {"error": "LightRAG query test failed - no contexts retrieved"}
            
            # Wait for indexing to complete
            logger.info("Waiting 5 seconds for indexing to complete...")
            await asyncio.sleep(5)
        else:
            logger.info("Skipping document ingestion - using existing knowledge graph")

        # 2. Parse Evaluation Dataset
        if not os.path.exists(eval_file_path):
            raise FileNotFoundError(f"Evaluation file not found at {eval_file_path}")

        test_cases = []
        with open(eval_file_path, 'r', encoding='utf-8') as f:
            for line in f:
                if line.strip():
                    try:
                        data = json.loads(line)
                        # Map JSONL fields to RAGAS expected fields
                        # Support multiple field name formats
                        question = data.get("query", "") or data.get("q", "") or data.get("question", "")
                        ground_truth = data.get("ground_truth", "") or data.get("gold", "") or data.get("answer", "")
                        
                        # Handle gold field which might be a list
                        if isinstance(ground_truth, list):
                            ground_truth = ". ".join(ground_truth)
                        
                        if question and ground_truth:
                            test_cases.append({
                                "question": question,
                                "ground_truth": ground_truth
                            })
                            
                            # Verify contexts contain actual content
                            # Note: contexts will be populated later during query_lightrag
                            logger.debug(f"Added test case: '{question[:50]}...' with ground_truth length {len(ground_truth)}")
                        else:
                            logger.warning(f"Skipping invalid test case: {data}")
                    except json.JSONDecodeError:
                        logger.warning(f"Skipping invalid JSON line in {eval_file_path}")

        if not test_cases:
            raise ValueError("No valid test cases found.")

            # 3. Generate Answers via LightRAG (Async)
        logger.info(f"Generating answers for {len(test_cases)} test cases...")
        ragas_data = {
            "question": [],
            "answer": [],
            "contexts": [],
            "ground_truth": []
        }

        # Semaphore to limit concurrency
        max_concurrent = int(os.getenv("EVAL_MAX_CONCURRENT", 2))
        sem = asyncio.Semaphore(max_concurrent)

        async def process_case(case):
            async with sem:
                q = case["question"]
                gt = case["ground_truth"]

                result = await self.query_lightrag(q)
                
                # Debug log the contexts
                logger.debug(f"Question: {q}")
                logger.debug(f"Retrieved {len(result['contexts'])} contexts")
                if result['contexts']:
                    logger.debug(f"First context (truncated): {result['contexts'][0][:200]}...")

                return {
                    "question": q,
                    "answer": result["answer"],
                    "contexts": result["contexts"],
                    "ground_truth": gt
                }

        tasks = [process_case(case) for case in test_cases]
        results = await asyncio.gather(*tasks)

        # Analyze the evaluation data for issues
        empty_contexts = sum(1 for item in results if not item.get("contexts", []))
        total_questions = len(results)
        
        logger.info(f"Query processing completed. Total questions: {total_questions}, Empty contexts: {empty_contexts}")
        
        if empty_contexts > total_questions * 0.5:  # More than 50% empty contexts
            logger.error(f"WARNING: {empty_contexts}/{total_questions} questions have empty contexts. This will result in poor evaluation scores.")
            logger.error("This suggests the LightRAG retrieval is not working properly.")

        # 4. Prepare Dataset for RAGAS
        for res in results:
            ragas_data["question"].append(res["question"])
            ragas_data["answer"].append(res["answer"])
            ragas_data["contexts"].append(res["contexts"])
            ragas_data["ground_truth"].append(res["ground_truth"])

        dataset = Dataset.from_dict(ragas_data)

        # 5. Run RAGAS Evaluation
        logger.info("Starting RAGAS metric calculation...")

        # Debug: Log sample dataset entry
        if len(dataset) > 0:
            logger.debug(f"Sample dataset entry: {dataset[0]}")

        # Patching models into RAGAS metrics
        # In newer RAGAS versions, you might pass llm/embeddings to evaluate(),
        # but setting them on metrics is a robust fallback for specific customized calls.
        # However, evaluate() accepts 'llm' and 'embeddings' arguments directly.

        try:
            evaluation_result = evaluate(
                dataset=dataset,
                metrics=self.metrics,
                llm=self.llm,
                embeddings=self.embeddings
            )
        except Exception as e:
            logger.error(f"RAGAS evaluation failed: {e}", exc_info=True)
            logger.error(f"Dataset info: {dataset}")
            return {
                "faithfulness": 0.0,
                "answer_relevancy": 0.0,
                "context_recall": 0.0,
                "context_precision": 0.0
            }

        # 6. Save detailed results
        os.makedirs("results", exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        # Convert to Pandas for easier saving
        df_result = evaluation_result.to_pandas()
        df_result.to_csv(f"results/results_{timestamp}.csv", index=False)
        df_result.to_json(f"results/results_{timestamp}.json", orient="records", indent=2)

        logger.info(f"Results saved to results/results_{timestamp}.csv")

        # 7. Return averages
        # Get mean scores from the pandas DataFrame
        scores = {
            "faithfulness": float(df_result["faithfulness"].mean()),
            "answer_relevancy": float(df_result["answer_relevancy"].mean()),
            "context_recall": float(df_result["context_recall"].mean()),
            "context_precision": float(df_result["context_precision"].mean())
        }

        # Format to 4 decimal places
        return {k: round(v, 4) for k, v in scores.items()}


def evaluate_rag_system(
        eval_dataset_path: str = "EVAL.jsonl",
        input_docs_dir: str = "data/inputs/__enqueued__",
        skip_ingestion: bool = None
) -> Dict[str, float]:
    """
    Main entry point for evaluating the RAG system.

    Args:
        eval_dataset_path (str): Path to the JSONL file containing test cases.
        input_docs_dir (str): Directory containing .md files to ingest.
        skip_ingestion (bool, optional): If True, skip document ingestion. 
            If None, will check EVAL_SKIP_INGESTION environment variable.

    Returns:
        Dict[str, float]: A dictionary containing the average scores for:
            - faithfulness
            - answer_relevancy
            - context_recall
            - context_precision
    """

    # Initialize Evaluator
    # Assumes LightRAG is running on default or env var URL
    rag_url = os.getenv("LIGHTRAG_API_URL", "http://localhost:9621")
    evaluator = RAGASEvaluator(lightrag_api_url=rag_url)

    # Determine if we should skip ingestion
    if skip_ingestion is None:
        skip_ingestion = os.getenv("EVAL_SKIP_INGESTION", "false").lower() == "true"

    try:
        # Run the async evaluation loop
        results = asyncio.run(evaluator.run_evaluation(
            eval_file_path=eval_dataset_path, 
            skip_ingestion=skip_ingestion
        ))

        print("\n" + "=" * 50)
        print("📊 FINAL EVALUATION SCORES")
        print("=" * 50)
        for metric, score in results.items():
            print(f"{metric.replace('_', ' ').title():<25}: {score:.4f}")
        print("=" * 50 + "\n")

        return results

    except Exception as e:
        logger.critical(f"Evaluation failed: {str(e)}")
        # Return empty/zero scores on failure to match return type signature
        return {
            "faithfulness": 0.0,
            "answer_relevancy": 0.0,
            "context_recall": 0.0,
            "context_precision": 0.0
        }


if __name__ == "__main__":
    # Example usage when running script directly
    evaluate_rag_system()
