"""
Tests for S3Service.
Covers AWS S3 standard endpoint initialization, custom S3 endpoint initialization, and local fallback logic.
"""
import pytest
from unittest.mock import MagicMock, patch
import os
from pathlib import Path

from app.services.s3_service import S3Service
from app.config import settings

class TestS3Service:

    @pytest.fixture
    def mock_boto3(self):
        with patch('app.services.s3_service.boto3') as mock_boto:
            mock_client = MagicMock()
            mock_boto.client.return_value = mock_client
            # Also patch BOTO3_AVAILABLE
            with patch('app.services.s3_service.BOTO3_AVAILABLE', True):
                yield mock_boto, mock_client

    def test_s3_initialization_with_custom_endpoint(self, mock_boto3):
        """Test that S3 service configures correctly with custom endpoint."""
        boto3_module, mock_client = mock_boto3

        with patch.object(settings, 'USE_S3', True), \
             patch.object(settings, 'S3_ENDPOINT_URL', 'http://localhost:9000'), \
             patch.object(settings, 'S3_ACCESS_KEY', 'minioadmin'), \
             patch.object(settings, 'S3_SECRET_KEY', 'minioadmin'), \
             patch.object(settings, 'S3_REGION', 'us-east-1'):
             
            service = S3Service()
            assert service.use_s3 is True
            boto3_module.client.assert_called_with(
                's3',
                aws_access_key_id='minioadmin',
                aws_secret_access_key='minioadmin',
                region_name='us-east-1',
                endpoint_url='http://localhost:9000'
            )

    def test_s3_initialization_without_endpoint(self, mock_boto3):
        """Test default AWS initialization when no endpoint_url is passed."""
        boto3_module, mock_client = mock_boto3

        with patch.object(settings, 'USE_S3', True), \
             patch.object(settings, 'S3_ENDPOINT_URL', ''), \
             patch.object(settings, 'S3_REGION', 'eu-west-1'):
             
            service = S3Service()
            assert service.use_s3 is True
            boto3_module.client.assert_called_with(
                's3',
                aws_access_key_id=settings.S3_ACCESS_KEY,
                aws_secret_access_key=settings.S3_SECRET_KEY,
                region_name='eu-west-1',
                endpoint_url=None
            )

    @pytest.mark.asyncio
    async def test_s3_upload_file(self, mock_boto3):
        """Test uploading a file using mocked S3."""
        boto3_module, mock_client = mock_boto3

        with patch.object(settings, 'USE_S3', True), \
             patch.object(settings, 'S3_BUCKET_NAME', 'test-bucket'):
             
            service = S3Service()
            
            result = await service.upload_file(b"content", "test.txt", "text/plain")
            
            assert result["s3_key"] is not None
            assert result["local_path"] is None
            
            mock_client.put_object.assert_called_once()
            call_kwargs = mock_client.put_object.call_args[1]
            assert call_kwargs["Bucket"] == "test-bucket"
            assert "procurement/" in call_kwargs["Key"]
            assert call_kwargs["Body"] == b"content"

    @pytest.mark.asyncio
    async def test_local_upload_fallback(self):
        """Test local storage fallback when S3 is disabled."""
        with patch.object(settings, 'USE_S3', False):
            service = S3Service()
            
            # Use a temp directory for patches if we wanted to be perfectly clean, 
            # but testing logic using patch
            with patch('builtins.open', new_callable=MagicMock()) as mock_open:
                result = await service.upload_file(b"data", "test.pdf", "application/pdf")
                
                assert result["s3_key"] is None
                assert "test.pdf" in result["local_path"]
                assert mock_open.called
