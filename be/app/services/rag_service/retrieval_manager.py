import logging
from llama_index.core import (
    StorageContext,
    load_index_from_storage,
)
from llama_index.core import QueryBundle

from app.core.model_manager import model_manager
from .storage_manager import VectorStorageManager


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class VectorRetrievalManager(VectorStorageManager):
    """
    Manages vector retrieval operations including loading indices
    and performing similarity search with reranking.
    Inherits from VectorStorageManager to reuse connection setup.
    """
    
    def __init__(self, *args, **kwargs):
        """
        Initialize retrieval manager for vector database queries.
        Inherits all initialization from VectorStorageManager.
        """
        # Call parent constructor to setup all connections
        super().__init__(*args, **kwargs)
        
        # Initialize reranker for retrieval operations
        self.reranker = model_manager.get_model_rerank()
        logger.info("VectorRetrievalManager initialized with reranker")

    def _load_index(self):
        """
        Load the index from existing storage context.
        
        Returns:
            Loaded VectorStoreIndex
        """
        vector_store, docstore, index_store = self.setup_stores()

        self.storage_context = StorageContext.from_defaults(
            docstore=docstore,
            index_store=index_store,
            vector_store=vector_store
        )

        self.index = load_index_from_storage(self.storage_context, index_id=self.index_id)
        logger.info(f"Successfully loaded index: {self.index_id}")
        return self.index
    
    def _load_retriever(self, similarity_top_k: int = 30):
        """
        Load the retriever from the index.
        """
        self.index = self._load_index()

        retriever = self.index.as_retriever(
            similarity_top_k=similarity_top_k
        )
        return retriever

    def retrieve_basic(self, query_str: str, similarity_top_k: int = 30):
        """
        Perform basic retrieval without reranking.
        """
        retriever = self._load_retriever(similarity_top_k=similarity_top_k)
        
        logger.info(f"Retrieving documents for query: {query_str[:50]}...")
        retrieved_nodes = retriever.retrieve(query_str)
        logger.info(f"Retrieved {len(retrieved_nodes)} nodes.")
        
        return retrieved_nodes

    def retrieve_with_rerank(self, query_str: str, similarity_top_k: int = 30):
        """
        Perform retrieval and reranking for a given query string.
        """
        self.index = self._load_index()

        # Retriever
        retriever = self.index.as_retriever(
            similarity_top_k=similarity_top_k
        )

        # Initial retrieval
        logger.info("Retrieving initial documents from vector store...")
        retrieved_nodes = retriever.retrieve(query_str)
        logger.info(f"Retrieved {len(retrieved_nodes)} initial nodes.")

        if not retrieved_nodes:
            logger.warning("No nodes retrieved for the given query.")
            return []

        # Reranking
        logger.info("Reranking retrieved documents with Cohere...")
        query_bundle = QueryBundle(query_str=query_str)
        reranked_nodes = self.reranker.postprocess_nodes(
            retrieved_nodes, query_bundle=query_bundle
        )
        logger.info(f"Reranked down to {len(reranked_nodes)} nodes.")

        return reranked_nodes