"""
Main pytest configuration with MongoDB fixtures for testing.
Uses real MongoDB with temporary collections (prefixed with 'test_').
All test collections are cleaned up after the test session.
"""
import os
import sys
import asyncio
import pytest
import pytest_asyncio
from typing import AsyncGenerator, Generator
from datetime import datetime
from unittest.mock import MagicMock, AsyncMock

# Add app to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorCollection
from httpx import AsyncClient, ASGITransport
from fastapi.testclient import TestClient

from app.config import settings
from app.db.mongodb import MongoDB
from app.main import app
from app.core.constants import UserRole, Permission


# ========== Test Configuration ==========

TEST_COLLECTION_PREFIX = "test_"

# Collection name mappings for tests
TEST_COLLECTIONS = {
    "items": f"{TEST_COLLECTION_PREFIX}items",
    "procurement_orders": f"{TEST_COLLECTION_PREFIX}procurement_orders",
    "warehouse-audit-logs": f"{TEST_COLLECTION_PREFIX}warehouse_audit_logs",
    "users": f"{TEST_COLLECTION_PREFIX}users",
    "groups": f"{TEST_COLLECTION_PREFIX}groups",
}


# ========== MongoDB Connection ==========

@pytest_asyncio.fixture(scope="function")
async def mongo_client() -> AsyncGenerator[AsyncIOMotorClient, None]:
    """Create MongoDB client for each test to avoid loop mismatch."""
    client = AsyncIOMotorClient(
        settings.MONGODB_URL,
        maxPoolSize=10,
        minPoolSize=1,
        serverSelectionTimeoutMS=5000,
    )
    # Test connection
    await client.admin.command('ping')
    yield client
    client.close()


@pytest_asyncio.fixture(scope="function")
async def test_db(mongo_client: AsyncIOMotorClient):
    """Get test database instance."""
    return mongo_client[settings.DB_NAME]


# ========== Test Collection Factories ==========

@pytest_asyncio.fixture(scope="function")
async def test_items_collection(test_db) -> AsyncGenerator[AsyncIOMotorCollection, None]:
    """Get items test collection, cleaned after each test."""
    collection = test_db[TEST_COLLECTIONS["items"]]
    yield collection
    await collection.delete_many({})


@pytest_asyncio.fixture(scope="function")
async def test_procurement_collection(test_db) -> AsyncGenerator[AsyncIOMotorCollection, None]:
    """Get procurement test collection, cleaned after each test."""
    collection = test_db[TEST_COLLECTIONS["procurement_orders"]]
    yield collection
    await collection.delete_many({})


@pytest_asyncio.fixture(scope="function")
async def test_audit_collection(test_db) -> AsyncGenerator[AsyncIOMotorCollection, None]:
    """Get audit logs test collection, cleaned after each test."""
    collection = test_db[TEST_COLLECTIONS["warehouse-audit-logs"]]
    yield collection
    await collection.delete_many({})


@pytest_asyncio.fixture(scope="function")
async def test_users_collection(test_db) -> AsyncGenerator[AsyncIOMotorCollection, None]:
    """Get users test collection, cleaned after each test."""
    collection = test_db[TEST_COLLECTIONS["users"]]
    yield collection
    await collection.delete_many({})


@pytest_asyncio.fixture(scope="function")
async def test_groups_collection(test_db) -> AsyncGenerator[AsyncIOMotorCollection, None]:
    """Get groups test collection, cleaned after each test."""
    collection = test_db[TEST_COLLECTIONS["groups"]]
    yield collection
    await collection.delete_many({})


# ========== Session Cleanup ==========

@pytest_asyncio.fixture(scope="session", autouse=True)
async def cleanup_test_collections():
    """
    Cleanup all test collections after the entire test session.
    This runs automatically at end of session.
    """
    yield
    # Drop all test collections after session
    try:
        client = AsyncIOMotorClient(settings.MONGODB_URL)
        db = client[settings.DB_NAME]
        collection_names = await db.list_collection_names()
        for name in collection_names:
            if name.startswith(TEST_COLLECTION_PREFIX):
                await db.drop_collection(name)
                print(f"Dropped test collection: {name}")
        client.close()
    except Exception as e:
        print(f"Cleanup error: {e}")


# ========== MongoDB Mock for Services ==========

@pytest.fixture(autouse=True)
def mock_mongodb(test_db, monkeypatch):
    """
    Patch MongoDB class to use test collections.
    This is now autouse=True to ensure all tests use test collections.
    """
    # Patch the class attributes directly
    monkeypatch.setattr(MongoDB, "db", test_db)
    monkeypatch.setattr(MongoDB, "client", test_db.client)

    # Patch get_db to return our test_db
    monkeypatch.setattr(MongoDB, "get_db", classmethod(lambda cls: test_db))

    # Patch collection getters
    def get_test_collection(cls, name: str):
        test_name = TEST_COLLECTIONS.get(name, f"{TEST_COLLECTION_PREFIX}{name}")
        return test_db[test_name]

    monkeypatch.setattr(MongoDB, "get_collection", classmethod(get_test_collection))
    monkeypatch.setattr(MongoDB, "get_permissions_collection", classmethod(get_test_collection))

    yield test_db



# ========== Mock User Fixtures ==========

@pytest.fixture
def mock_admin_user() -> dict:
    """Mock admin user for authentication."""
    return {
        "sub": "admin",
        "username": "admin",
        "role": UserRole.ADMIN,
        "permissions": [Permission.ADMIN, Permission.INVENTORY_RW, Permission.PROCUREMENT_RW],
        "user_id": "admin_123"
    }


@pytest.fixture
def mock_superadmin_user() -> dict:
    """Mock superadmin user for authentication."""
    return {
        "sub": "superadmin",
        "username": "superadmin",
        "role": UserRole.SUPERADMIN,
        "user_id": "superadmin_123"
    }


@pytest.fixture
def mock_regular_user() -> dict:
    """Mock regular user for authentication."""
    return {
        "sub": "user1",
        "username": "user1",
        "role": UserRole.USER,
        "permissions": [],
        "user_id": "user_123"
    }


# ========== FastAPI Test Client ==========

@pytest_asyncio.fixture
async def async_client(mock_mongodb) -> AsyncGenerator[AsyncClient, None]:
    """
    Async HTTP client for testing FastAPI routes.
    Patches MongoDB to use test collections.
    """
    from app.core.security import get_current_user
    
    # Override authentication dependency
    async def mock_get_current_user():
        return {
            "sub": "test_user",
            "username": "test_user",
            "role": UserRole.ADMIN,
            "permissions": [Permission.ADMIN, Permission.INVENTORY_RW, Permission.PROCUREMENT_RW],
            "user_id": "test_user_123"
        }
    
    app.dependency_overrides[get_current_user] = mock_get_current_user
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
    
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def async_client_superadmin(mock_mongodb) -> AsyncGenerator[AsyncClient, None]:
    """Async client with superadmin authentication."""
    from app.core.security import get_current_user
    
    async def mock_get_current_user():
        return {
            "sub": "superadmin",
            "username": "superadmin",
            "role": UserRole.SUPERADMIN,
            "user_id": "superadmin_123"
        }
    
    app.dependency_overrides[get_current_user] = mock_get_current_user
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
    
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def async_client_user(mock_mongodb) -> AsyncGenerator[AsyncClient, None]:
    """Async client with regular user authentication."""
    from app.core.security import get_current_user
    
    async def mock_get_current_user():
        return {
            "sub": "regular_user",
            "username": "regular_user", 
            "role": UserRole.USER,
            "user_id": "user_123"
        }
    
    app.dependency_overrides[get_current_user] = mock_get_current_user
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
    
    app.dependency_overrides.clear()


# ========== Sample Data Factories ==========

@pytest.fixture
def sample_item_data() -> dict:
    """Sample item data for tests."""
    return {
        "catalog_number": "TEST-001",
        "description": "Test Item Description",
        "manufacturer": "Test Manufacturer | Brand",
        "location": "A1-B2",
        "serial": "SN123456",
        "current_stock": "10",
        "warranty_expiry": "2025-12-31",
        "reserved_stock": "",
        "project_allocations": {},
        "purpose": "Testing",
        "target_site": "Lab",
        "notes": "Test notes",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }


@pytest.fixture
def sample_procurement_data() -> dict:
    """Sample procurement order data for tests."""
    return {
        "catalog_number": "PROC-001",
        "manufacturer": "Test Vendor",
        "description": "Test Procurement Item",
        "quantity": 5,
        "order_date": datetime.utcnow(),
        "amount": 1000.00,
        "status": "waiting_emf",
        "received_emf": False,
        "received_bom": False,
        "created_by": "test_user",
        "files": [],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }


@pytest.fixture
def sample_user_data() -> dict:
    """Sample user data for tests."""
    from app.core.password import hash_password
    return {
        "username": "testuser",
        "password_hash": hash_password("testpassword123"),
        "role": UserRole.USER,
        "is_active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }


@pytest.fixture
def sample_audit_data() -> dict:
    """Sample audit log data for tests."""
    return {
        "action": "item_create",
        "actor": "test_user",
        "actor_role": UserRole.ADMIN,
        "target_resource": "item",
        "resource_id": "item_123",
        "details": "Created test item",
        "timestamp": datetime.utcnow()
    }
