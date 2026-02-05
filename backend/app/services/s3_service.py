import os
import uuid
from pathlib import Path
from typing import Optional, BinaryIO
import logging

from app.config import settings

logger = logging.getLogger(__name__)

# Try to import boto3, but don't fail if not available
try:
    import boto3
    from botocore.exceptions import ClientError
    BOTO3_AVAILABLE = True
except ImportError:
    BOTO3_AVAILABLE = False
    logger.warning("boto3 not installed. S3 features will use local storage fallback.")


class S3Service:
    """Service for file storage with S3 and local fallback"""
    
    def __init__(self):
        self.use_s3 = getattr(settings, 'USE_S3', False) and BOTO3_AVAILABLE
        self.local_storage_path = Path("uploads/procurement")
        
        if self.use_s3:
            try:
                self.s3_client = boto3.client(
                    's3',
                    aws_access_key_id=getattr(settings, 'S3_ACCESS_KEY', ''),
                    aws_secret_access_key=getattr(settings, 'S3_SECRET_KEY', ''),
                    region_name=getattr(settings, 'S3_REGION', 'us-east-1')
                )
                self.bucket_name = getattr(settings, 'S3_BUCKET_NAME', '')
                logger.info(f"S3 service initialized with bucket: {self.bucket_name}")
            except Exception as e:
                logger.error(f"Failed to initialize S3 client: {e}")
                self.use_s3 = False
        
        if not self.use_s3:
            # Ensure local storage directory exists
            self.local_storage_path.mkdir(parents=True, exist_ok=True)
            logger.info(f"Using local storage at: {self.local_storage_path}")
    
    async def upload_file(
        self,
        file_content: BinaryIO,
        filename: str,
        content_type: str
    ) -> dict:
        """
        Upload file to S3 or local storage
        
        Returns:
            dict with 's3_key' or 'local_path' and 'file_id'
        """
        file_id = str(uuid.uuid4())
        safe_filename = self._sanitize_filename(filename)
        
        if self.use_s3:
            return await self._upload_to_s3(file_content, file_id, safe_filename, content_type)
        else:
            return await self._upload_to_local(file_content, file_id, safe_filename)
    
    async def _upload_to_s3(
        self,
        file_content: BinaryIO,
        file_id: str,
        filename: str,
        content_type: str
    ) -> dict:
        """Upload file to S3"""
        try:
            s3_key = f"procurement/{file_id}/{filename}"
            
            self.s3_client.upload_fileobj(
                file_content,
                self.bucket_name,
                s3_key,
                ExtraArgs={'ContentType': content_type}
            )
            
            logger.info(f"Uploaded file to S3: {s3_key}")
            return {
                "file_id": file_id,
                "s3_key": s3_key,
                "local_path": None
            }
        except Exception as e:
            logger.error(f"S3 upload failed: {e}")
            # Fallback to local storage
            return await self._upload_to_local(file_content, file_id, filename)
    
    async def _upload_to_local(
        self,
        file_content: BinaryIO,
        file_id: str,
        filename: str
    ) -> dict:
        """Upload file to local storage"""
        file_dir = self.local_storage_path / file_id
        file_dir.mkdir(parents=True, exist_ok=True)
        
        file_path = file_dir / filename
        
        with open(file_path, 'wb') as f:
            f.write(file_content.read())
        
        logger.info(f"Uploaded file to local storage: {file_path}")
        return {
            "file_id": file_id,
            "s3_key": None,
            "local_path": str(file_path)
        }
    
    async def download_file(self, s3_key: Optional[str] = None, local_path: Optional[str] = None) -> Optional[bytes]:
        """Download file from S3 or local storage"""
        if s3_key and self.use_s3:
            return await self._download_from_s3(s3_key)
        elif local_path:
            return await self._download_from_local(local_path)
        return None
    
    async def _download_from_s3(self, s3_key: str) -> Optional[bytes]:
        """Download file from S3"""
        try:
            response = self.s3_client.get_object(Bucket=self.bucket_name, Key=s3_key)
            return response['Body'].read()
        except ClientError as e:
            logger.error(f"S3 download failed: {e}")
            return None
    
    async def _download_from_local(self, local_path: str) -> Optional[bytes]:
        """Download file from local storage"""
        try:
            with open(local_path, 'rb') as f:
                return f.read()
        except Exception as e:
            logger.error(f"Local download failed: {e}")
            return None
    
    async def delete_file(self, s3_key: Optional[str] = None, local_path: Optional[str] = None) -> bool:
        """Delete file from S3 or local storage"""
        if s3_key and self.use_s3:
            return await self._delete_from_s3(s3_key)
        elif local_path:
            return await self._delete_from_local(local_path)
        return False
    
    async def _delete_from_s3(self, s3_key: str) -> bool:
        """Delete file from S3"""
        try:
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=s3_key)
            logger.info(f"Deleted file from S3: {s3_key}")
            return True
        except ClientError as e:
            logger.error(f"S3 delete failed: {e}")
            return False
    
    async def _delete_from_local(self, local_path: str) -> bool:
        """Delete file from local storage"""
        try:
            path = Path(local_path)
            if path.exists():
                path.unlink()
                # Try to remove parent directory if empty
                try:
                    path.parent.rmdir()
                except OSError:
                    pass  # Directory not empty
                logger.info(f"Deleted file from local storage: {local_path}")
                return True
        except Exception as e:
            logger.error(f"Local delete failed: {e}")
        return False
    
    def _sanitize_filename(self, filename: str) -> str:
        """Sanitize filename to prevent path traversal"""
        # Remove any path components
        filename = os.path.basename(filename)
        # Remove any potentially dangerous characters
        safe_chars = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._- ")
        filename = ''.join(c if c in safe_chars else '_' for c in filename)
        return filename[:255]  # Limit length
