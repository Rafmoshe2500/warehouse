from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
import logging

from app.config import settings

logger = logging.getLogger(__name__)


class MongoDB:
    """MongoDB connection manager with connection pooling and health checks."""
    
    client: Optional[AsyncIOMotorClient] = None
    db = None

    @classmethod
    async def connect(cls) -> None:
        """
        Connect to MongoDB with optimized connection pool settings.
        
        Connection pool configuration:
        - maxPoolSize: Maximum number of connections (default: 100)
        - minPoolSize: Minimum number of connections (default: 10)
        - maxIdleTimeMS: Close connections after idle time (default: 45000ms)
        - serverSelectionTimeoutMS: Timeout for server selection (default: 5000ms)
        """
        try:
            cls.client = AsyncIOMotorClient(
                settings.MONGODB_URL,
                maxPoolSize=100,  # Maximum connections in pool
                minPoolSize=10,   # Minimum connections to maintain
                maxIdleTimeMS=45000,  # Close idle connections after 45s
                serverSelectionTimeoutMS=5000,  # 5s timeout for server selection
                retryWrites=True,  # Retry write operations on failure
                retryReads=True,    # Retry read operations on failure
                tz_aware=True       # Return timezone-aware datetimes
            )
            cls.db = cls.client[settings.DB_NAME]
            
            # Test connection with ping
            await cls.client.admin.command('ping')
            
            logger.info(f"✅ Connected to MongoDB at {settings.MONGODB_URL}")
            logger.info(f"   Database: {settings.DB_NAME}")
            logger.info(f"   Connection pool: min={10}, max={100}")
            
        except Exception as e:
            logger.error(f"❌ Failed to connect to MongoDB: {e}")
            raise

    @classmethod
    async def disconnect(cls) -> None:
        """Close MongoDB connection and cleanup resources."""
        if cls.client:
            cls.client.close()
            logger.info("❌ Disconnected from MongoDB")

    @classmethod
    def get_db(cls):
        """
        Get database instance.
        
        Returns:
            Database instance
            
        Raises:
            RuntimeError: If not connected to MongoDB
        """
        if cls.db is None:
            raise RuntimeError("MongoDB Client is not connected. Ensure startup_db_client has run.")
        return cls.db

    @classmethod
    def get_collection(cls, name: str):
        """
        Get collection from main database.
        
        Args:
            name: Collection name
            
        Returns:
            Collection instance
        """
        db = cls.get_db()
        return db[name]

    @classmethod
    def get_permissions_collection(cls, name: str):
        """
        Get collection for permissions (uses same DB).
        
        Args:
            name: Collection name
            
        Returns:
            Collection instance
        """
        db = cls.get_db()
        return db[name]
        
    @classmethod
    async def health_check(cls) -> bool:
        """
        Check MongoDB connection health.
        
        Returns:
            True if healthy, False otherwise
        """
        try:
            if cls.client is None:
                return False
            await cls.client.admin.command('ping')
            return True
        except Exception as e:
            logger.error(f"MongoDB health check failed: {e}")
            return False

    @classmethod
    async def create_indexes(cls) -> None:
        """Create database indexes."""
        if cls.db is None:
             return
             
        try:
            # Items indexes
            items = cls.get_collection("items")
            await items.create_index("catalog_number")  # Not unique based on user feedback
            await items.create_index("serial", unique=True, sparse=True) # Unique but can be missing
            await items.create_index([("updated_at", 1)])
            
            # Procurement indexes
            procurement = cls.get_collection("procurement_orders")
            await procurement.create_index("bom_items.catalog_number")
            await procurement.create_index("bom_items.manufacturer")
            await procurement.create_index([("updated_at", -1)])
            await procurement.create_index("status")
            
            # Audit indexes
            audit = cls.get_collection("warehouse-audit-logs")
            await audit.create_index([("timestamp", -1)])
            await audit.create_index("action")
            await audit.create_index("actor")
            await audit.create_index("target_resource")
            
            # User/Group indexes
            users = cls.get_permissions_collection("users")
            await users.create_index("username", unique=True)
            await users.create_index("email", sparse=True)
            
            
            groups = cls.get_permissions_collection("groups")
            await groups.create_index("name", unique=True)

            # Collection Items indexes
            collection_items = cls.get_collection("collection_items")
            await collection_items.create_index("collection_id")
            await collection_items.create_index("item_id")
            # Compound index for uniqueness if needed, but at least these for performance
            await collection_items.create_index([("collection_id", 1), ("item_id", 1)], unique=True)

            # BOM Templates
            bom_templates = cls.get_collection("bom_templates")
            await bom_templates.create_index("format_id", unique=True)
            await bom_templates.create_index("vendor_name")
            await bom_templates.create_index("is_active")
            
            logger.info("✅ Database indexes created/verified")
            
        except Exception as e:
            logger.error(f"❌ Failed to create indexes: {e}")

