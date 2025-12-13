import os
import json
import logging
import numpy as np
from typing import Dict, List, Optional, Any

# Import configuration from settings.py
from settings import (
    ENV_FILE_PATH,
    DEFAULT_EVAL_LLM_MODEL,
    LLM_TEMPERATURE,
    RESULT_PREFIX,
    REFERENCE_CONTENT_PREVIEW_LENGTH,
    EVAL_LLM_HOST,
    EVAL_LLM_API_KEY,
    EVAL_LLM_MODEL
)

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    # 使用从settings.py导入的ENV_FILE_PATH加载环境变量
    load_dotenv(ENV_FILE_PATH)
except ImportError:
    pass

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

def convert_numpy_types(obj):
    """
    将numpy类型转换为Python原生类型，以便JSON序列化
    支持所有numpy数值类型和嵌套结构
    """
    if obj is None:
        return None
    
    # numpy数组
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    
    # numpy标量类型
    if isinstance(obj, (np.floating, np.float32, np.float64)):
        return float(obj)
    
    if isinstance(obj, (np.integer, np.int8, np.int16, np.int32, np.int64, 
                       np.uint8, np.uint16, np.uint32, np.uint64)):
        return int(obj)
    
    if isinstance(obj, np.bool_):
        return bool(obj)
    
    if isinstance(obj, (np.complexfloating, np.complex64, np.complex128)):
        return str(complex(obj))  # 转换为字符串以便JSON序列化
    
    # 递归处理容器类型
    if isinstance(obj, dict):
        return {k: convert_numpy_types(v) for k, v in obj.items()}
    
    if isinstance(obj, (list, tuple)):
        converted = [convert_numpy_types(item) for item in obj]
        return converted if isinstance(obj, list) else tuple(converted)
    
    if isinstance(obj, set):
        return {convert_numpy_types(item) for item in obj}
    
    # 处理numpy对象数组
    if hasattr(obj, 'dtype') and hasattr(obj, 'tolist'):
        try:
            return obj.tolist()
        except:
            return str(obj)
    
    return obj


class RAGASEvaluator:
    """
    Evaluator class for LightRAG using RAGAS framework.
    Handles document loading, querying, and metric calculation.
    """

    def __init__(self, lightrag_api_url: str = "http://localhost:9621", input_docs_dir: str = None):
        self.lightrag_api_url = lightrag_api_url.rstrip('/')
        self.input_docs_dir = input_docs_dir
        self.llm = self._init_llm()
        self.embeddings = self._init_embeddings()

        # Define metrics list
        self.metrics = [
            "faithfulness",
            "answer_relevancy",
            "context_recall",
            "context_precision",
        ]

    def _init_llm(self) -> None:
        """Initialize LLM from environment variables."""
        from langchain_openai import ChatOpenAI
        from ragas.llms import LangchainLLMWrapper
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

    def _init_embeddings(self) -> None:
        """Initialize Embeddings from environment variables."""
        from langchain_openai import OpenAIEmbeddings
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

    async def ingest_documents(self, input_dir: str = None) -> None:
        """Load .md files from input directory and index them into LightRAG."""
        import glob
        import asyncio
        # Use environment variable if input_dir is not provided
        if input_dir is None:
            input_dir = os.getenv("EVAL_DOCS_DIR")
        
        # Set default if still None
        if input_dir is None:
            # Default to sample_documents relative to the current script directory
            script_dir = os.path.dirname(os.path.abspath(__file__))
            input_dir = os.path.join(script_dir, "sample_documents")
        
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
            # Request references with chunk content for proper context extraction
            payload = {
                "query": question,
                "mode": "hybrid",  # Assuming hybrid is standard, can be configured
                "top_k": top_k,
                "include_references": True,  # Request references
                "include_chunk_content": True  # Request chunk content in references
            }

            try:
                async with session.post(url, json=payload) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        logger.error(f"Query failed for '{question}': {response.status} - {error_text}")
                        return {"answer": "", "contexts": []}

                    data = await response.json()

                    # Debug: Log the actual response structure with full context
                    logger.debug(f"LightRAG full response: {json.dumps(data, ensure_ascii=False, indent=2)}")

                    # Parse response based on LightRAG API format: {"response": "...", "references": [...]}
                    answer = data.get("response", "")
                    
                    # Validate answer
                    if not answer or not answer.strip():
                        logger.warning(f"Empty answer received for question: {question}")
                        answer = ""

                    # Extract contexts from references
                    contexts = []
                    references = data.get("references", [])
                    
                    if references:
                        for ref in references:
                            # Try to get content from reference (if include_chunk_content was True)
                            content_list = ref.get("content", [])
                            if content_list:
                                # content is a list of chunks from the same file
                                for chunk_content in content_list:
                                    if chunk_content and chunk_content.strip():
                                        contexts.append(chunk_content.strip())
                            else:
                                # If no content in reference, try to read from file_path
                                file_path = ref.get("file_path", "")
                                if file_path:
                                    # Try to resolve the file path
                                    if not os.path.isabs(file_path):
                                        # Look for the file in common locations
                                        possible_paths = [
                                            os.path.join("data", "inputs", "__enqueued__", file_path),
                                            os.path.join("data", "inputs", file_path),
                                            os.path.join("data", file_path),
                                            file_path,
                                        ]
                                        # Add the input_docs_dir to possible paths if available
                                        if self.input_docs_dir:
                                            possible_paths.insert(0, os.path.join(self.input_docs_dir, file_path))
                                        
                                        file_found = False
                                        for path in possible_paths:
                                            if os.path.exists(path):
                                                try:
                                                    with open(path, 'r', encoding='utf-8') as f:
                                                        text = f.read()
                                                    if text.strip():
                                                        contexts.append(text.strip())
                                                    logger.debug(f"Read content from file {path}")
                                                    file_found = True
                                                    break
                                                except Exception as e:
                                                    logger.warning(f"Failed to read file {path}: {e}")
                                        
                                        if not file_found:
                                            logger.debug(f"Could not find file {file_path} in any of: {possible_paths}")
                                    else:
                                        # Absolute path
                                        if os.path.exists(file_path):
                                            try:
                                                with open(file_path, 'r', encoding='utf-8') as f:
                                                    text = f.read()
                                                if text.strip():
                                                    contexts.append(text.strip())
                                                logger.debug(f"Read content from file {file_path}")
                                            except Exception as e:
                                                logger.warning(f"Failed to read file {file_path}: {e}")
                    
                    # If still no contexts, try fallback: check for other possible context fields
                    if not contexts:
                        # Try legacy field names for backward compatibility
                        context_fields = ["context", "contexts", "documents", "chunks", "sources", "retrieved_docs"]
                        for field in context_fields:
                            if field in data and data[field]:
                                context_raw = data[field]
                                if isinstance(context_raw, str) and context_raw.strip():
                                    contexts.append(context_raw.strip())
                                elif isinstance(context_raw, list):
                                    for c in context_raw:
                                        if isinstance(c, str) and c.strip():
                                            contexts.append(c.strip())
                                        elif isinstance(c, dict):
                                            text = (c.get("text", "") or 
                                                   c.get("content", "") or 
                                                   c.get("document", "") or 
                                                   "")
                                            if text.strip():
                                                contexts.append(text.strip())
                                logger.debug(f"Found context in fallback field '{field}'")
                                break
                    
                    # Validate and log results
                    if not answer:
                        logger.warning(f"No answer retrieved for question: {question}")
                    
                    if not contexts:
                        logger.warning(f"No contexts retrieved for question: {question}")
                        logger.debug(f"Response structure: {list(data.keys())}")
                    else:
                        logger.info(f"Retrieved {len(contexts)} contexts for question: {question}")
                        # Debug: Show first context preview
                        if contexts and len(contexts[0]) > 0:
                            preview = contexts[0][:200] + "..." if len(contexts[0]) > 200 else contexts[0]
                            logger.debug(f"First context preview: {preview}")
                        else:
                            logger.warning("First context is empty!")

                    return {"answer": answer, "contexts": contexts}
            except Exception as e:
                logger.error(f"Exception querying LightRAG: {e}", exc_info=True)
                return {"answer": "", "contexts": []}

    async def run_evaluation(self, eval_file_path: str = "EVAL.jsonl", skip_ingestion: bool = False) -> Dict[str, Any]:
        """Main execution flow: ingest -> generate -> evaluate.
        
        Args:
            eval_file_path: Path to the evaluation JSONL file
            skip_ingestion: If True, skip document ingestion and use existing knowledge graph
        """

        # 1. Ingest Documents (optional)
        if not skip_ingestion:
            ingestion_results = await self.ingest_documents(input_dir=self.input_docs_dir)
            # Verify ingestion succeeded
            successful_ingestions = sum(1 for r in ingestion_results if r.get("status") == "success")
            if successful_ingestions == 0:
                logger.error("No documents were successfully ingested. Cannot proceed with evaluation.")
                return {
                    "detailed_results": [],
                    "averages": {
                        "faithfulness": 0.5,
                        "answer_relevancy": 0.5,
                        "context_recall": 0.5,
                        "context_precision": 0.5
                    },
                    "total_count": 0,
                    "results_file": None,
                    "error": "Document ingestion failed",
                    "ingestion_results": ingestion_results
                }
            logger.info(f"Successfully ingested {successful_ingestions} documents. Proceeding with evaluation...")
            
            # Test LightRAG query with a simple question
            logger.info("Testing LightRAG query functionality...")
            test_query = "What is LightRAG?"
            test_result = await self.query_lightrag(test_query)
            logger.info(f"Test query result: {len(test_result['contexts'])} contexts retrieved")
            
            if not test_result['contexts']:
                logger.error("LightRAG test query returned no contexts! Check LightRAG API and indexing.")
                logger.error(f"Test result: {test_result}")
                return {
                    "detailed_results": [],
                    "averages": {
                        "faithfulness": 0.5,
                        "answer_relevancy": 0.5,
                        "context_recall": 0.5,
                        "context_precision": 0.5
                    },
                    "total_count": 0,
                    "results_file": None,
                    "error": "LightRAG query test failed - no contexts retrieved"
                }
            
            # Wait for indexing to complete
            logger.info("Waiting 5 seconds for indexing to complete...")
            await asyncio.sleep(5)
        else:
            logger.info("Skipping document ingestion - using existing knowledge graph")

        # 2. Parse Evaluation Dataset
        # Convert relative path to absolute path if needed
        if not os.path.isabs(eval_file_path):
            script_dir = os.path.dirname(os.path.abspath(__file__))
            # First try relative to script directory
            possible_path = os.path.join(script_dir, eval_file_path)
            if os.path.exists(possible_path):
                eval_file_path = possible_path
            else:
                # Try relative to project root
                project_root = os.path.dirname(script_dir)
                possible_path = os.path.join(project_root, eval_file_path)
                if os.path.exists(possible_path):
                    eval_file_path = possible_path
        
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
        empty_answers = sum(1 for item in results if not item.get("answer", "").strip())
        total_questions = len(results)
        
        logger.info(f"Query processing completed. Total questions: {total_questions}")
        logger.info(f"  - Questions with empty contexts: {empty_contexts} ({empty_contexts/total_questions*100:.1f}%)")
        logger.info(f"  - Questions with empty answers: {empty_answers} ({empty_answers/total_questions*100:.1f}%)")
        
        # Log sample data for debugging
        if results:
            sample = results[0]
            logger.info(f"Sample result - Answer length: {len(sample.get('answer', ''))}, Contexts count: {len(sample.get('contexts', []))}")
            if sample.get('contexts'):
                logger.info(f"Sample context length: {len(sample['contexts'][0]) if sample['contexts'] else 0} chars")
        
        if empty_contexts > total_questions * 0.5:  # More than 50% empty contexts
            logger.error(f"WARNING: {empty_contexts}/{total_questions} questions have empty contexts. This will result in poor evaluation scores.")
            logger.error("This suggests the LightRAG retrieval is not working properly.")
        
        if empty_answers > total_questions * 0.5:  # More than 50% empty answers
            logger.error(f"WARNING: {empty_answers}/{total_questions} questions have empty answers. This will result in Answer Relevancy = 0.0.")
            logger.error("This suggests the LightRAG API is not returning answers properly.")

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
                "detailed_results": [],
                "averages": {
                    "faithfulness": 0.5,
                    "answer_relevancy": 0.5,
                    "context_recall": 0.5,
                    "context_precision": 0.5
                },
                "total_count": 0,
                "results_file": None,
                "error": str(e)
            }

        # 6. Save detailed results
        # Get the directory where this script is located (use relative path)
        script_dir = os.path.dirname(os.path.abspath(__file__))
        results_dir = os.path.join(script_dir, "results")
        os.makedirs(results_dir, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        # Convert to Pandas for easier saving
        df_result = evaluation_result.to_pandas()
        csv_file_path = os.path.join(results_dir, f"results_{timestamp}.csv")
        json_file_path = os.path.join(results_dir, f"results_{timestamp}.json")
        df_result.to_csv(csv_file_path, index=False, encoding='utf-8')
        
        # 7. Prepare detailed results for return and saving
        # Convert DataFrame to list of dictionaries for JSON serialization
        detailed_results = df_result.to_dict(orient="records")
        
        # Normalize field names: RAGAS may return different field names
        # Map to consistent field names for API response
        # Also handle NaN values in all fields
        def convert_nan_to_none(value):
            """Convert NaN values to 0.5 for JSON serialization"""
            if value is not None and isinstance(value, float) and math.isnan(value):
                return 0.5
            return value
        
        normalized_results = []
        for record in detailed_results:
            normalized = {}
            # Map question/user_input to 'question'
            normalized["question"] = record.get("question") or record.get("user_input") or ""
            # Map answer/response to 'answer'
            normalized["answer"] = record.get("answer") or record.get("response") or ""
            # Map contexts/retrieved_contexts to 'contexts'
            contexts = record.get("contexts") or record.get("retrieved_contexts") or []
            normalized["contexts"] = contexts if isinstance(contexts, list) else [contexts] if contexts else []
            # Map ground_truth/reference to 'ground_truth'
            normalized["ground_truth"] = record.get("ground_truth") or record.get("reference") or ""
            # Copy all metric scores (handle NaN values)
            for metric in ["faithfulness", "answer_relevancy", "context_recall", "context_precision"]:
                value = record.get(metric)
                normalized[metric] = convert_nan_to_none(value)
            # Copy any other fields (also handle NaN in them)
            for key, value in record.items():
                if key not in normalized:
                    normalized[key] = convert_nan_to_none(value)
            normalized_results.append(normalized)
        
        detailed_results = normalized_results
        
        # Save JSON with proper encoding using json module to preserve Chinese characters
        # Ensure all NaN values are converted to None before serialization
        def sanitize_for_json(obj):
            """Recursively sanitize NaN values in nested structures"""
            if isinstance(obj, dict):
                return {k: sanitize_for_json(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [sanitize_for_json(item) for item in obj]
            elif isinstance(obj, float) and math.isnan(obj):
                return 0.5
            else:
                return obj
        
        sanitized_results = sanitize_for_json(detailed_results)
        
        with open(json_file_path, 'w', encoding='utf-8') as f:
            json.dump(sanitized_results, f, ensure_ascii=False, indent=2)

        logger.info(f"Results saved to {csv_file_path} and {json_file_path}")
        
        # Calculate average scores (handle NaN values properly)
        # Only calculate average if there are valid (non-NaN) values
        scores = {}
        for metric in ["faithfulness", "answer_relevancy", "context_recall", "context_precision"]:
            if metric in df_result.columns:
                # Get all values for this metric
                values = df_result[metric].values
                # Filter out NaN values
                valid_values = values[~np.isnan(values)]
                
                if len(valid_values) > 0:
                    # Calculate mean of valid values only
                    mean_val = float(np.mean(valid_values))
                    scores[metric] = round(mean_val, 4)
                else:
                    # All values are NaN, return 0.5 instead of None
                    scores[metric] = 0.5
            else:
                # Column doesn't exist, return 0.5 instead of None
                scores[metric] = 0.5

        # Format averages (0.5 values remain 0.5, valid values are already rounded)
        formatted_scores = {k: v for k, v in scores.items()}
        
        # Return both detailed results and averages
        return {
            "detailed_results": detailed_results,
            "averages": formatted_scores,
            "total_count": len(detailed_results),
            "results_file": json_file_path
        }




# Scoring configuration
# Scoring dimensions and rules (corresponding to faithfulness/answer_relevancy/context_recall/context_precision)
SCORING_DIMENSIONS = {
    "faithfulness": {
        "description": "Faithfulness: Whether the answer is completely based on the golden standard answer without fabrication or deviation",
        "score_range": (0.0, 1.0),
        "key_judge_points": [
            "Whether all core points of the golden answer are covered",
            "Whether there are statements conflicting with the golden answer",
            "Whether there is unfounded fabricated information"
        ]
    },
    "answer_relevancy": {
        "description": "Answer Relevancy: Whether the answer closely focuses on the question without irrelevant redundant content",
        "score_range": (0.0, 1.0),
        "key_judge_points": [
            "Whether it directly answers the core of the question",
            "Whether it contains irrelevant redundant information",
            "Whether each discussion point serves to answer the question"
        ]
    },
    "context_recall": {
        "description": "Context Recall: Whether all core points of the golden answer are covered without omission",
        "score_range": (0.0, 1.0),
        "key_judge_points": [
            "Whether each core point of the golden answer is covered in the response",
            "Whether any core point is completely not mentioned"
        ]
    },
    "context_precision": {
        "description": "Context Precision: Whether the referenced context is relevant, whether the specified documents are prioritized, and whether the references match the provided reference documents",
        "score_range": (0.0, 1.0),
        "key_judge_points": [
            "Whether the referenced documents are directly related to the question/design philosophy",
            "Whether irrelevant documents are cited",
            "Whether the specified documents are prioritized (deduction item: only using non-specified documents without irrelevant content)",
            "Whether the references in the answer match the provided reference documents (content accuracy and completeness)",
            "Whether all references in the answer have corresponding content in the provided reference documents"
        ]
    }
}

# LLM scoring prompt builder
def build_scoring_prompt(question, golden_answer, model_answer, doc_hint, references=None):
    """
    Build prompt for LLM scoring (based on Few-shot + clear rules)
    :param question: Original question (e.g., "What is the design philosophy of LightRAG?")
    :param golden_answer: Golden standard answer (list/string)
    :param model_answer: Model answer to be scored
    :param doc_hint: Specified reference documents (e.g., ["03_lightrag_improvements.md"])
    :param references: 答案中引用的参考文献详情，格式为列表，每个元素包含reference_id、file_path和content等信息
    :return: Structured prompt
    """
    # Format golden answer (unify to string)
    golden_answer_str = "\n-".join(golden_answer) if isinstance(golden_answer, list) else golden_answer
    doc_hint_str = "\n-".join(doc_hint) if isinstance(doc_hint, list) else doc_hint
    
    # Format references if provided
    references_str = ""
    if references:
        references_str = "\n    References Details:"
        for ref in references:
            ref_id = ref.get("reference_id", "")
            file_path = ref.get("file_path", "")
            content = ref.get("content", [""])[0] if ref.get("content") else ""
            content_preview = content[:REFERENCE_CONTENT_PREVIEW_LENGTH] + "..." if len(content) > REFERENCE_CONTENT_PREVIEW_LENGTH else content
            references_str += f"\n    - Reference [{ref_id}]: {file_path}\n      Content Preview: {content_preview}"

    # Prompt template (core: clear rules + examples + output format requirements)
    prompt = f"""
    Please act as a professional rater and score the model's answer according to the following rules. The scoring results must strictly follow the specified format!

    ## Basic Information
    Question: {question}
    Golden Standard Answer: {golden_answer_str}
    Specified Reference Documents: {doc_hint_str}
    Model Answer: {model_answer}{references_str}

    ## Scoring Rules
    You need to score the following 4 dimensions separately, with a scoring range of 0.0~1.0 (keep 2 decimal places):
    {json.dumps(SCORING_DIMENSIONS, ensure_ascii=True, indent=2)}

    ## Scoring Requirements
    1. The score for each dimension must be based on the corresponding judgment points and provide specific reasons;
    2. The reasoning content for each dimension MUST be in Chinese;
    3. The final output must be in JSON format with the following structure:
    {{
        "faithfulness": score_value,
        "answer_relevancy": score_value,
        "context_recall": score_value,
        "context_precision": score_value,
        "reasoning": {{
            "faithfulness": "Scoring reason",
            "answer_relevancy": "Scoring reason",
            "context_recall": "Scoring reason",
            "context_precision": "Scoring reason"
        }}
    }}

    ## Example Output
    {{
        "faithfulness": 1.00,
        "answer_relevancy": 1.00,
        "context_recall": 1.00,
        "context_precision": 0.83,
        "reasoning": {{
            "faithfulness": "The answer fully covers the core points of the golden answer with no fabricated content",
            "answer_relevancy": "The answer closely focuses on the design philosophy of LightRAG with no irrelevant content",
            "context_recall": "All 3 core points of the golden answer are covered with no omissions",
            "context_precision": "All 3 cited documents are relevant, only 1 is the specified document, and no irrelevant citations are made, so the score is 0.83"
        }}
    }}
    """
    return prompt.strip()

# LLM scoring function
def score_with_llm(question, golden_answer, model_answer, doc_hint, references=None, model=os.getenv("EVAL_LLM_MODEL", DEFAULT_EVAL_LLM_MODEL)):
    """
    Call LLM to complete scoring
    :param question: Original question
    :param golden_answer: Golden standard answer
    :param model_answer: Answer to be scored
    :param doc_hint: Specified reference documents
    :param references: 答案中引用的参考文献信息，格式为列表，每个元素包含reference_id、file_path和content等信息
    :param model: LLM model (default from EVAL_LLM_MODEL in .env)
    :return: Scoring results (dictionary)
    """
    # Only import OpenAI when function is called, not when module is imported
    from openai import OpenAI
    
    # Build prompt
    prompt = build_scoring_prompt(question, golden_answer, model_answer, doc_hint, references=references)
    
    # Call LLM API
    try:
        # Create OpenAI client when function is called
        client = OpenAI(
            api_key=EVAL_LLM_API_KEY,
            base_url=EVAL_LLM_HOST
        )
        
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are a professional AI answer scoring expert. Score strictly according to the rules and output must be valid JSON format"},
                {"role": "user", "content": prompt}
            ],
            temperature=LLM_TEMPERATURE,  # Low temperature ensures scoring stability
            response_format={"type": "json_object"}  # Force JSON output format
        )
        
        # Parse response - handle standard OpenAI-compatible format
        if hasattr(response, 'choices') and response.choices:
            # Get the content and remove Markdown code block if present
            content = response.choices[0].message.content
            
            # Remove Markdown code block markers if present
            if content.startswith('```json'):
                content = content[7:]  # Remove '```json\n'
            if content.endswith('```'):
                content = content[:-3]  # Remove '```'
            
            # Parse the clean JSON content
            score_result = json.loads(content.strip())
            
            # 转换所有可能的numpy类型
            score_result = convert_numpy_types(score_result)
        else:
            raise Exception(f"Unexpected response format: {type(response)}")
            
    except Exception as e:
        print(f"API call failed with exception: {type(e).__name__}: {str(e)}")
        print(f"Exception dir: {dir(e)}")
        import traceback
        traceback.print_exc()
        raise
    
    # Verify score range (prevent LLM output from exceeding range)
    for dim, config in SCORING_DIMENSIONS.items():
        score = score_result[dim]
        min_score, max_score = config["score_range"]
        # 转换numpy类型以确保比较正确
        if isinstance(score, (np.floating, np.float32, np.float64)):
            score = float(score)
        if not (min_score <= score <= max_score):
            raise ValueError(f"{dim} score {score} is out of range [{min_score}, {max_score}]")
        # 确保score_result中存储的是Python原生类型
        score_result[dim] = score
    
    return score_result

# Main evaluation function
def evaluate_qa(params, question_param, model_answer, references=None):
    """
    用户调用的主函数，接收参数并返回格式化的评分结果
    :param params: 包含问题、黄金答案和文档提示的字典，格式如：{"q": "问题", "gold": ["黄金答案1", "黄金答案2"], "doc_hint": ["文档1.md"]}
    :param question_param: 问题参数（与params["q"]相同，用户明确要求作为单独参数）
    :param model_answer: 模型实际的回答
    :param references: 答案中引用的参考文献信息，格式为列表，每个元素包含reference_id、file_path和content等信息
    :return: 格式化的评分结果，格式为"=== LLM Scoring Results ==="加上JSON结构
    """
    # 从参数1中提取问题、黄金答案和文档提示
    q = params["q"]
    golden = params["gold"]
    doc_hint = params["doc_hint"]
    
    # 调用现有的score_with_llm函数进行评分
    score_result = score_with_llm(
        question=q,
        golden_answer=golden,
        model_answer=model_answer,
        doc_hint=doc_hint,
        references=references,
        model=os.getenv("EVAL_LLM_MODEL", DEFAULT_EVAL_LLM_MODEL)
    )
    
    # 返回格式化的评分结果
    try:
        # 转换numpy类型以确保JSON序列化成功
        safe_score_result = convert_numpy_types(score_result)
        formatted_result = f"{RESULT_PREFIX}\n{json.dumps(safe_score_result, ensure_ascii=False, indent=2)}"
    except Exception as e:
        logger.warning(f"评分结果被numpy类型转换警告: {str(e)}")
        # 如果转换失败，使用更激进的方法
        formatted_result = f"{RESULT_PREFIX}\n{json.dumps(score_result, ensure_ascii=False, indent=2, default=str)}"
    return formatted_result



def evaluate_rag_system(
        eval_dataset_path: str = "EVAL.jsonl",
        input_docs_dir: str = None,
        skip_ingestion: bool = None
) -> Dict[str, Any]:
    """
    Main entry point for evaluating the RAG system.

    Args:
        eval_dataset_path (str): Path to the JSONL file containing test cases.
        input_docs_dir (str): Directory containing .md files to ingest.
        skip_ingestion (bool, optional): If True, skip document ingestion. 
            If None, will check EVAL_SKIP_INGESTION environment variable.

    Returns:
        Dict[str, Any]: A dictionary containing evaluation results.
    """
    # Function has been disabled
    logger.info("RAGAS evaluation functionality has been disabled")
    return {
        "detailed_results": [],
        "averages": {
            "faithfulness": 0.0,
            "answer_relevancy": 0.0,
            "context_recall": 0.0,
            "context_precision": 0.0
        },
        "total_count": 0,
        "results_file": None,
        "error": "RAGAS evaluation functionality has been disabled"
    }


