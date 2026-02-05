import os
from typing import Tuple
from app.core.config import settings
from app.utils.s3_utils import s3_manager
from app.utils.document_utils import save_document_file
from app.utils.image_utils import save_uploaded_file

import requests

class StorageManager:
    """Storage manager that handles both local and S3 storage"""
    def __init__(self):
        self.is_production = settings.ENV_MODE == "production"
    
    def save_image(self, file_bytes: bytes, filename: str, user_id: int) -> str:
        """
        Save image file
        """
        if self.is_production:
            # Save to S3
            return s3_manager.upload_image(file_bytes, filename, user_id)
        else:
            # Save locally
            local_path = save_uploaded_file(file_bytes, filename, user_id)
            return local_path
    
    def save_document(self, file_bytes: bytes, filename: str, user_id: int) -> str:
        """
        Save document file
        """
        if self.is_production:
            return s3_manager.upload_document(file_bytes, filename, user_id)
        else:
            
            local_path = save_document_file(file_bytes, filename, user_id)
            return local_path
    
    def get_file_bytes(self, file_path: str) -> bytes:
        """
        Read file bytes from storage
        """
        if self.is_production and file_path.startswith('https://'):
            # Download from S3 URL
            response = requests.get(file_path)
            response.raise_for_status()
            return response.content
        else:
            # Read from local file system
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"File not found: {file_path}")
            
            with open(file_path, 'rb') as f:
                return f.read()
    
    def delete_file(self, file_path: str) -> bool:
        """Delete file from storage"""
        if self.is_production and file_path.startswith('https://'):
            # Extract bucket and key from URL
            parts = file_path.replace('https://', '').split('/')
            bucket = parts[0].split('.')[0]
            key = '/'.join(parts[1:])
            return s3_manager.delete_file(bucket, key)
        else:
            if os.path.exists(file_path):
                os.remove(file_path)
                return True
            return False

storage_manager = StorageManager()