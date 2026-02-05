import boto3
from botocore.exceptions import ClientError
from app.core.config import settings
from typing import Optional
import os

class S3Manager:
    def __init__(self):
        """Initialize S3 client for production mode"""
        self.is_production = settings.ENV_MODE == "production"
        
        if self.is_production:
            if not all([settings.AWS_ACCESS_KEY_ID, settings.AWS_SECRET_ACCESS_KEY, 
                       settings.S3_BUCKET_IMAGES, settings.S3_BUCKET_DOCUMENTS]):
                raise ValueError("AWS credentials and bucket names required for production mode")
            
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_REGION
            )
            self.images_bucket = settings.S3_BUCKET_IMAGES
            self.documents_bucket = settings.S3_BUCKET_DOCUMENTS
        else:
            self.s3_client = None
            self.images_bucket = None
            self.documents_bucket = None
    
    def upload_image(self, file_bytes: bytes, filename: str, user_id: int) -> str:
        """Upload image to S3 (production) or return local path"""
        if not self.is_production:
            raise Exception("S3 upload not available in local mode. Use local storage.")
        
        try:
            s3_key = f"users/{user_id}/images/{filename}"
            
            self.s3_client.put_object(
                Bucket=self.images_bucket,
                Key=s3_key,
                Body=file_bytes,
                ContentType='image/jpeg',
                ACL='public-read'
            )
            
            url = f"https://{self.images_bucket}.s3.{settings.AWS_REGION}.amazonaws.com/{s3_key}"
            return url
            
        except ClientError as e:
            raise Exception(f"Failed to upload to S3: {str(e)}")
    
    def upload_document(self, file_bytes: bytes, filename: str, user_id: int) -> str:
        """Upload document to S3 (production) or return local path"""
        if not self.is_production:
            raise Exception("S3 upload not available in local mode. Use local storage.")
        
        try:
            s3_key = f"users/{user_id}/documents/{filename}"
            
            # Determine content type
            ext = os.path.splitext(filename)[1].lower()
            content_types = {
                '.pdf': 'application/pdf',
                '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                '.doc': 'application/msword',
                '.txt': 'text/plain'
            }
            content_type = content_types.get(ext, 'application/octet-stream')
            
            self.s3_client.put_object(
                Bucket=self.documents_bucket,
                Key=s3_key,
                Body=file_bytes,
                ContentType=content_type,
                ServerSideEncryption='AES256'
            )
            
            return s3_key
            
        except ClientError as e:
            raise Exception(f"Failed to upload to S3: {str(e)}")
    
    def download_file(self, bucket: str, key: str) -> bytes:
        """Download file from S3"""
        if not self.is_production:
            raise Exception("S3 download not available in local mode")
        
        try:
            response = self.s3_client.get_object(Bucket=bucket, Key=key)
            return response['Body'].read()
        except ClientError as e:
            raise Exception(f"Failed to download from S3: {str(e)}")
    
    def get_presigned_url(self, bucket: str, key: str, expiration: int = 3600) -> str:
        """Generate presigned URL for private documents"""
        if not self.is_production:
            raise Exception("S3 presigned URLs not available in local mode")
        
        try:
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': bucket, 'Key': key},
                ExpiresIn=expiration
            )
            return url
        except ClientError as e:
            raise Exception(f"Failed to generate presigned URL: {str(e)}")
    
    def delete_file(self, bucket: str, key: str) -> bool:
        """Delete file from S3"""
        if not self.is_production:
            raise Exception("S3 delete not available in local mode")
        
        try:
            self.s3_client.delete_object(Bucket=bucket, Key=key)
            return True
        except ClientError as e:
            return False

s3_manager = S3Manager()