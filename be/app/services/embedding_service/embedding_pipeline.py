import logging
from typing import List, Optional

from llama_index.core.schema import BaseNode

from app.core.model_manager import model_manager
from .document_processor import DocumentProcessor
from .chunking_service import ChunkingService


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class EmbeddingPipeline:
    """
    Complete pipeline for processing documents: parsing -> chunking -> embedding.
    """
    
    def __init__(
        self,
        chunk_sizes: List[int] = None,
        chunk_overlap: int = 20,
        result_type: str = "markdown"
    ):
        """
        Initialize the complete embedding pipeline.
        """
        self.document_processor = DocumentProcessor(
            result_type=result_type
        )
        
        self.chunking_service = ChunkingService(
            chunk_sizes=chunk_sizes,
            chunk_overlap=chunk_overlap
        )
        
        self.embed_model = model_manager.get_embedding_instance()
        
        logger.info("EmbeddingPipeline initialized")

    def process_file(
        self,
        file_path: str,
        embed_nodes: bool = True
    ) -> List[BaseNode]:
        """
        Process a single file through the complete pipeline.
        """
        logger.info(f"Starting pipeline for file: {file_path}")
        
        # Parse document
        logger.info("Parsing document...")
        documents = self.document_processor.parse_file(file_path)
        
        # Chunk documents
        logger.info("Chunking document...")
        nodes = self.chunking_service.chunk_documents(documents)
        
        # Generate embeddings
        if embed_nodes:
            logger.info("Generating embeddings...")
            nodes = self._embed_nodes(nodes)
        else:
            logger.info("Skipping embedding generation")
        
        logger.info(f"Pipeline complete. Produced {len(nodes)} nodes ready for storage")
        return nodes

    def _embed_nodes(self, nodes: List[BaseNode]) -> List[BaseNode]:
        """
        Generate embeddings for all nodes.
        """
        if not nodes:
            return nodes
        
        try:
            logger.info(f"Generating embeddings for {len(nodes)} nodes...")
            
            for i, node in enumerate(nodes):
                if i % 10 == 0:
                    logger.debug(f"Embedding node {i+1}/{len(nodes)}")
                
                # Generate embedding for node text
                text_to_embed = node.get_content(metadata_mode="embed")
                embedding = self.embed_model.get_text_embedding(text_to_embed)
                node.embedding = embedding
            
            logger.info("Embeddings generated successfully")
            return nodes
            
        except Exception as e:
            logger.error(f"Embedding generation failed: {str(e)}")
            raise ValueError(f"Failed to generate embeddings: {str(e)}")