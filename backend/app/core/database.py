"""
Database connection and configuration with proper error handling.
"""
import asyncio
import logging
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from .config import settings

logger = logging.getLogger(__name__)


class DatabaseConnection:
    """Singleton database connection manager."""
    
    _instance: Optional['DatabaseConnection'] = None
    _client: Optional[AsyncIOMotorClient] = None
    _database: Optional[AsyncIOMotorDatabase] = None
    _connected: bool = False
    
    def __new__(cls) -> 'DatabaseConnection':
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    async def connect(self) -> None:
        """Establish database connection with retry logic."""
        if self._client is not None:
            return
        
        try:
            logger.info("Connecting to MongoDB...")
            self._client = AsyncIOMotorClient(
                settings.MONGODB_URL,
                serverSelectionTimeoutMS=2000,  # 2 second timeout for faster testing
                connectTimeoutMS=3000,  # 3 second connection timeout
                maxPoolSize=10,
                minPoolSize=1,
                retryWrites=True,
                retryReads=True
            )
            
            # Test the connection
            await self._client.admin.command('ping')
            self._database = self._client[settings.DATABASE_NAME]
            
            # Create indexes for better performance
            await self._create_indexes()
            
            logger.info(f"Successfully connected to MongoDB database: {settings.DATABASE_NAME}")
            self._connected = True
            
        except (ConnectionFailure, ServerSelectionTimeoutError) as e:
            logger.warning(f"MongoDB connection failed: {e}")
            logger.info("Running in development mode without database")
            self._connected = False
            self._client = None
            self._database = None
        except Exception as e:
            logger.warning(f"Unexpected error during database connection: {e}")
            logger.info("Running in development mode without database")
            self._connected = False
            self._client = None
            self._database = None
    
    async def _create_indexes(self) -> None:
        """Create database indexes for optimal performance."""
        try:
            # Posts collection indexes
            posts_collection = self._database.posts
            await posts_collection.create_index("title")
            await posts_collection.create_index("category")
            await posts_collection.create_index("created_at")
            await posts_collection.create_index([("title", "text"), ("description", "text")])
            
            # Users collection indexes
            users_collection = self._database.users
            await users_collection.create_index("email", unique=True)
            await users_collection.create_index("username", unique=True)
            
            logger.info("Database indexes created successfully")
            
        except Exception as e:
            logger.error(f"Error creating database indexes: {e}")
            # Don't raise here, indexes are optimization
    
    async def disconnect(self) -> None:
        """Close database connection."""
        if self._client:
            logger.info("Disconnecting from MongoDB...")
            self._client.close()
            self._client = None
            self._database = None
            logger.info("Disconnected from MongoDB")
    
    @property
    def database(self) -> Optional[AsyncIOMotorDatabase]:
        """Get database instance."""
        return self._database
    
    @property
    def client(self) -> Optional[AsyncIOMotorClient]:
        """Get client instance."""
        return self._client
    
    @property
    def is_connected(self) -> bool:
        """Check if database is connected."""
        return self._connected
    
    async def health_check(self) -> dict:
        """Check database health status."""
        if not self._connected or not self._client:
            return {"status": "disconnected", "mode": "development", "error": "Database not connected"}
        
        try:
            # Ping the database
            await self._client.admin.command('ping')
            
            # Get server info
            server_info = await self._client.server_info()
            
            return {
                "status": "healthy",
                "database": settings.DATABASE_NAME,
                "mongodb_version": server_info.get("version"),
                "connection_pool_size": self._client.max_pool_size
            }
        except Exception as e:
            return {"status": "unhealthy", "error": str(e)}
    
    async def close(self) -> None:
        """Close database connection."""
        if self._client:
            self._client.close()
            self._client = None
            self._database = None
            logger.info("Database connection closed")


# Global database instance
db_connection = DatabaseConnection()


async def get_database() -> Optional[AsyncIOMotorDatabase]:
    """Dependency to get database instance."""
    return db_connection.database


async def get_db_client() -> Optional[AsyncIOMotorClient]:
    """Dependency to get database client."""
    return db_connection.client