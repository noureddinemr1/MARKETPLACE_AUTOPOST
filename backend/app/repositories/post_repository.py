"""
Repository layer for post data access.
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId
from pymongo.errors import DuplicateKeyError
from motor.motor_asyncio import AsyncIOMotorDatabase
import logging

from app.models.post import PostInDB, PostCreate, PostUpdate, PostFilter, PaginationParams
from app.core.database import get_database

logger = logging.getLogger(__name__)


class PostRepository:
    """Repository for post data operations."""
    
    def __init__(self):
        self.collection_name = "posts"
    
    async def get_collection(self):
        """Get the posts collection with proper error handling."""
        database = await get_database()
        if database is None:
            raise RuntimeError("Database not available. Please ensure MongoDB is running.")
        return database[self.collection_name]
    
    async def create_post(self, post_data: PostCreate) -> PostInDB:
        """Create a new post in the database."""
        try:
            collection = await self.get_collection()
            
            # Convert to PostInDB
            post_dict = post_data.dict()
            post_in_db = PostInDB(**post_dict)
            
            # Insert into database
            result = await collection.insert_one(post_in_db.dict(by_alias=True, exclude={'id'}))
            
            if result.inserted_id:
                # Retrieve and return the created post
                created_post = await collection.find_one({"_id": result.inserted_id})
                return PostInDB(**created_post)
            
            raise Exception("Failed to create post")
            
        except Exception as e:
            logger.error(f"Error creating post: {str(e)}")
            raise
    
    async def get_post_by_id(self, post_id: str) -> Optional[PostInDB]:
        """Retrieve a post by its ID."""
        try:
            if not ObjectId.is_valid(post_id):
                return None
                
            collection = await self.get_collection()
            post_data = await collection.find_one({"_id": ObjectId(post_id)})
            
            if post_data:
                return PostInDB(**post_data)
            return None
            
        except Exception as e:
            logger.error(f"Error retrieving post {post_id}: {str(e)}")
            raise
    
    async def get_posts(
        self, 
        filters: Optional[PostFilter] = None, 
        pagination: Optional[PaginationParams] = None
    ) -> List[PostInDB]:
        """Retrieve posts with optional filtering and pagination."""
        try:
            collection = await self.get_collection()
            
            # Build query
            query = {}
            if filters:
                if filters.category:
                    query["category"] = filters.category
                if filters.status:
                    query["status"] = filters.status
                if filters.location:
                    query["location"] = {"$regex": filters.location, "$options": "i"}
                if filters.min_price is not None or filters.max_price is not None:
                    price_query = {}
                    if filters.min_price is not None:
                        price_query["$gte"] = filters.min_price
                    if filters.max_price is not None:
                        price_query["$lte"] = filters.max_price
                    query["price"] = price_query
            
            # Apply pagination
            skip = pagination.skip if pagination else 0
            limit = pagination.limit if pagination else 10
            
            # Execute query
            cursor = collection.find(query).sort("created_at", -1).skip(skip).limit(limit)
            posts = await cursor.to_list(length=limit)
            
            return [PostInDB(**post) for post in posts]
            
        except Exception as e:
            logger.error(f"Error retrieving posts: {str(e)}")
            raise
    
    async def update_post(self, post_id: str, update_data: PostUpdate) -> Optional[PostInDB]:
        """Update a post by its ID."""
        try:
            if not ObjectId.is_valid(post_id):
                return None
                
            collection = await self.get_collection()
            
            # Prepare update data
            update_dict = update_data.dict(exclude_unset=True)
            if update_dict:
                update_dict["updated_at"] = datetime.utcnow()
                
                result = await collection.update_one(
                    {"_id": ObjectId(post_id)},
                    {"$set": update_dict}
                )
                
                if result.modified_count > 0:
                    # Return updated post
                    updated_post = await collection.find_one({"_id": ObjectId(post_id)})
                    return PostInDB(**updated_post)
            
            return None
            
        except Exception as e:
            logger.error(f"Error updating post {post_id}: {str(e)}")
            raise
    
    async def delete_post(self, post_id: str) -> bool:
        """Delete a post by its ID."""
        try:
            if not ObjectId.is_valid(post_id):
                return False
                
            collection = await self.get_collection()
            result = await collection.delete_one({"_id": ObjectId(post_id)})
            
            return result.deleted_count > 0
            
        except Exception as e:
            logger.error(f"Error deleting post {post_id}: {str(e)}")
            raise
    
    async def count_posts(self, filters: Optional[PostFilter] = None) -> int:
        """Count posts with optional filtering."""
        try:
            collection = await self.get_collection()
            
            # Build query (same as get_posts)
            query = {}
            if filters:
                if filters.category:
                    query["category"] = filters.category
                if filters.status:
                    query["status"] = filters.status
                if filters.location:
                    query["location"] = {"$regex": filters.location, "$options": "i"}
                if filters.min_price is not None or filters.max_price is not None:
                    price_query = {}
                    if filters.min_price is not None:
                        price_query["$gte"] = filters.min_price
                    if filters.max_price is not None:
                        price_query["$lte"] = filters.max_price
                    query["price"] = price_query
            
            return await collection.count_documents(query)
            
        except Exception as e:
            logger.error(f"Error counting posts: {str(e)}")
            raise
    
    async def get_scheduled_posts(self) -> List[PostInDB]:
        """Retrieve posts that are scheduled for publication."""
        try:
            collection = await self.get_collection()
            
            query = {
                "status": "scheduled",
                "scheduled_at": {"$lte": datetime.utcnow()}
            }
            
            cursor = collection.find(query)
            posts = await cursor.to_list(length=None)
            
            return [PostInDB(**post) for post in posts]
            
        except Exception as e:
            logger.error(f"Error retrieving scheduled posts: {str(e)}")
            raise
    
    async def add_images_to_post(self, post_id: str, images: List[Dict[str, Any]]) -> bool:
        """Add images to a post."""
        try:
            if not ObjectId.is_valid(post_id):
                return False
                
            collection = await self.get_collection()
            
            result = await collection.update_one(
                {"_id": ObjectId(post_id)},
                {
                    "$push": {"images": {"$each": images}},
                    "$set": {"updated_at": datetime.utcnow()}
                }
            )
            
            return result.modified_count > 0
            
        except Exception as e:
            logger.error(f"Error adding images to post {post_id}: {str(e)}")
            raise
    
    async def remove_image_from_post(self, post_id: str, image_filename: str) -> bool:
        """Remove an image from a post."""
        try:
            if not ObjectId.is_valid(post_id):
                return False
                
            collection = await self.get_collection()
            
            result = await collection.update_one(
                {"_id": ObjectId(post_id)},
                {
                    "$pull": {"images": {"filename": image_filename}},
                    "$set": {"updated_at": datetime.utcnow()}
                }
            )
            
            return result.modified_count > 0
            
        except Exception as e:
            logger.error(f"Error removing image from post {post_id}: {str(e)}")
            raise


# Add missing import
from datetime import datetime