import logging
import os
from typing import List, Optional
from pathlib import Path

from llama_index.core import Document
from llama_parse import LlamaParse

from app.core.config import settings


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DocumentProcessor:
    """
    Handles parsing of various document formats using LlamaParse.
    Supports PDF, DOCX, DOC, and TXT files.
    """
    
    def __init__(
        self,
        result_type: str = "markdown"
    ):
        """
        Initialize document processor with LlamaParse.
        """
        self.api_key = settings.LLAMA_CLOUD_API_KEY
        self.result_type = result_type
        
        self.parser = self._setup_parser()
        logger.info("DocumentProcessor initialized")

    def _setup_parser(self) -> LlamaParse:
        """
        Setup LlamaParse instance with configuration.
        """
        parser = LlamaParse(
            api_key=self.api_key,
            result_type=self.result_type,
            verbose=True
        )
        logger.debug("LlamaParse parser configured")
        return parser

    def parse_file(self, file_path: str) -> List[Document]:
        """
        Parse a document file from the given path.
        """
        # Validate file exists
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        
        # Validate file extension
        file_ext = Path(file_path).suffix.lower()
        supported_extensions = {".pdf", ".docx", ".doc", ".txt"}
        
        if file_ext not in supported_extensions:
            raise ValueError(
                f"Unsupported file format: {file_ext}. "
                f"Supported formats: {', '.join(supported_extensions)}"
            )
        
        logger.info(f"Parsing document: {file_path}")
        
        try:
            # Parse document
            documents = self.parser.load_data(file_path)
            
            logger.info(f"Successfully parsed {len(documents)} document(s) from {file_path}")
            return documents
            
        except Exception as e:
            logger.error(f"Failed to parse document {file_path}: {str(e)}")
            raise ValueError(f"Document parsing failed: {str(e)}")