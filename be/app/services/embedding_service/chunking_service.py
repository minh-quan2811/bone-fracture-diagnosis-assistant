import logging
from typing import List

from llama_index.core import Document
from llama_index.core.schema import BaseNode
from llama_index.core.node_parser import HierarchicalNodeParser, SentenceSplitter

from app.core.model_manager import model_manager


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ChunkingService:
    """
    Handles document chunking using hierarchical node parsing strategy.
    Creates multiple levels of chunks for better retrieval.
    """
    
    def __init__(
        self,
        chunk_sizes: List[int] = None,
        chunk_overlap: int = 20,
    ):
        """
        Initialize chunking service with hierarchical parser.
        """
        self.chunk_sizes = chunk_sizes or [2048, 512, 128]
        self.chunk_overlap = chunk_overlap
        
        # Get embedding model for tokenization
        self.embed_model = model_manager.get_embedding_instance()
        
        self.parser = self._setup_parser()
        logger.info(f"ChunkingService initialized with chunk sizes: {self.chunk_sizes}")

    def _setup_parser(self) -> HierarchicalNodeParser:
        """
        Setup hierarchical node parser with multiple chunk sizes.
        """
        node_parsers = []
        
        for chunk_size in self.chunk_sizes:
            node_parser = SentenceSplitter(
                chunk_size=chunk_size,
                chunk_overlap=self.chunk_overlap,
            )
            node_parsers.append(node_parser)
        
        hierarchical_parser = HierarchicalNodeParser.from_defaults(
            node_parser_ids=[f"chunk_{size}" for size in self.chunk_sizes],
            node_parser_map={
                f"chunk_{self.chunk_sizes[i]}": node_parsers[i]
                for i in range(len(self.chunk_sizes))
            }
        )
        
        logger.debug("HierarchicalNodeParser configured")
        return hierarchical_parser

    def chunk_documents(self, documents: List[Document]) -> List[BaseNode]:
        """
        Chunk documents into hierarchical nodes.
        """
        if not documents:
            raise ValueError("No documents provided for chunking")
        
        logger.info(f"Chunking {len(documents)} document(s)...")
        
        try:
            # Parse documents into hierarchical nodes
            nodes = self.parser.get_nodes_from_documents(documents)
            
            logger.info(f"Created {len(nodes)} chunks from {len(documents)} document(s)")
            
            return nodes
            
        except Exception as e:
            logger.error(f"Chunking failed: {str(e)}")
            raise ValueError(f"Document chunking failed: {str(e)}")