"""
Service layer for post business logic.
"""
import os
import uuid
import asyncio
from typing import List, Optional, Dict, Any
from datetime import datetime
from PIL import Image
import logging

from app.models.post import (
    PostInDB, PostCreate, PostUpdate, PostResponse, PostFilter, 
    PaginationParams, ImageModel, PostStatus
)
from app.repositories.post_repository import PostRepository
from app.core.config import settings

logger = logging.getLogger(__name__)


class PostService:
    """Service class for post business logic."""
    
    def __init__(self):
        self.repository = PostRepository()
        self.upload_folder = settings.UPLOAD_FOLDER
        
        # Ensure upload directory exists
        os.makedirs(self.upload_folder, exist_ok=True)
    
    def _convert_to_response(self, post: PostInDB) -> PostResponse:
        """Convert PostInDB to PostResponse."""
        return PostResponse(
            id=str(post.id),
            title=post.title,
            description=post.description,
            price=post.price,
            category=post.category,
            location=post.location,
            status=post.status,
            images=post.images,
            created_at=post.created_at,
            updated_at=post.updated_at,
            scheduled_at=post.scheduled_at,
            facebook_post_id=post.facebook_post_id
        )
    
    async def create_post(self, post_data: PostCreate) -> PostResponse:
        """Create a new post."""
        try:
            # Create post in database
            created_post = await self.repository.create_post(post_data)
            return self._convert_to_response(created_post)
            
        except Exception as e:
            logger.error(f"Error in create_post service: {str(e)}")
            raise Exception(f"Failed to create post: {str(e)}")
    
    async def get_post_by_id(self, post_id: str) -> Optional[PostResponse]:
        """Retrieve a post by ID."""
        try:
            post = await self.repository.get_post_by_id(post_id)
            return self._convert_to_response(post) if post else None
            
        except Exception as e:
            logger.error(f"Error in get_post_by_id service: {str(e)}")
            raise Exception(f"Failed to retrieve post: {str(e)}")
    
    async def get_posts(
        self, 
        filters: Optional[PostFilter] = None, 
        pagination: Optional[PaginationParams] = None
    ) -> Dict[str, Any]:
        """Retrieve posts with filtering and pagination."""
        try:
            # Get posts and total count
            posts_task = self.repository.get_posts(filters, pagination)
            count_task = self.repository.count_posts(filters)
            
            posts, total_count = await asyncio.gather(posts_task, count_task)
            
            # Convert to response format
            post_responses = [self._convert_to_response(post) for post in posts]
            
            return {
                "posts": post_responses,
                "total": total_count,
                "page": (pagination.skip // pagination.limit) + 1 if pagination else 1,
                "per_page": pagination.limit if pagination else len(post_responses),
                "total_pages": (total_count + (pagination.limit - 1)) // pagination.limit if pagination else 1
            }
            
        except Exception as e:
            logger.error(f"Error in get_posts service: {str(e)}")
            raise Exception(f"Failed to retrieve posts: {str(e)}")
    
    async def update_post(self, post_id: str, update_data: PostUpdate) -> Optional[PostResponse]:
        """Update a post."""
        try:
            # Check if post exists
            existing_post = await self.repository.get_post_by_id(post_id)
            if not existing_post:
                return None
            
            # Update post
            updated_post = await self.repository.update_post(post_id, update_data)
            return self._convert_to_response(updated_post) if updated_post else None
            
        except Exception as e:
            logger.error(f"Error in update_post service: {str(e)}")
            raise Exception(f"Failed to update post: {str(e)}")
    
    async def delete_post(self, post_id: str) -> bool:
        """Delete a post and its associated images."""
        try:
            # Get post to retrieve image information
            post = await self.repository.get_post_by_id(post_id)
            if not post:
                return False
            
            # Delete associated image files
            for image in post.images:
                image_path = os.path.join(self.upload_folder, image.filename)
                if os.path.exists(image_path):
                    try:
                        os.remove(image_path)
                        logger.info(f"Deleted image file: {image_path}")
                    except OSError as e:
                        logger.warning(f"Failed to delete image file {image_path}: {str(e)}")
            
            # Delete post from database
            return await self.repository.delete_post(post_id)
            
        except Exception as e:
            logger.error(f"Error in delete_post service: {str(e)}")
            raise Exception(f"Failed to delete post: {str(e)}")
    
    def _validate_image(self, file_content: bytes, filename: str) -> Dict[str, Any]:
        """Validate image file."""
        # Check file size
        if len(file_content) > settings.MAX_FILE_SIZE:
            raise ValueError(f"File size exceeds maximum limit of {settings.MAX_FILE_SIZE} bytes")
        
        # Check file extension
        file_extension = filename.lower().split('.')[-1] if '.' in filename else ''
        if file_extension not in settings.ALLOWED_EXTENSIONS:
            raise ValueError(f"File extension '{file_extension}' not allowed. Allowed: {settings.ALLOWED_EXTENSIONS}")
        
        # Validate image format using PIL
        try:
            image = Image.open(io.BytesIO(file_content))
            image.verify()  # Verify it's a valid image
            return {
                "format": image.format,
                "size": image.size,
                "mode": image.mode
            }
        except Exception as e:
            raise ValueError(f"Invalid image file: {str(e)}")
    
    async def add_images_to_post(self, post_id: str, image_files: List[Dict[str, Any]]) -> Optional[PostResponse]:
        """Add images to a post."""
        try:
            # Check if post exists
            post = await self.repository.get_post_by_id(post_id)
            if not post:
                return None
            
            # Check image count limit
            current_image_count = len(post.images)
            new_image_count = len(image_files)
            
            if current_image_count + new_image_count > 5:
                raise ValueError("Maximum 5 images allowed per post")
            
            processed_images = []
            
            for file_data in image_files:
                filename = file_data.get("filename")
                content = file_data.get("content")
                
                # Validate image
                self._validate_image(content, filename)
                
                # Generate unique filename
                file_extension = filename.lower().split('.')[-1]
                unique_filename = f"{uuid.uuid4()}.{file_extension}"
                file_path = os.path.join(self.upload_folder, unique_filename)
                
                # Save file
                with open(file_path, "wb") as f:
                    f.write(content)
                
                # Create image model
                image_model = ImageModel(
                    filename=unique_filename,
                    url=f"/uploads/{unique_filename}",
                    size=len(content),
                    uploaded_at=datetime.utcnow()
                )
                
                processed_images.append(image_model.dict())
            
            # Add images to post
            success = await self.repository.add_images_to_post(post_id, processed_images)
            
            if success:
                # Return updated post
                updated_post = await self.repository.get_post_by_id(post_id)
                return self._convert_to_response(updated_post)
            
            return None
            
        except Exception as e:
            logger.error(f"Error in add_images_to_post service: {str(e)}")
            # Clean up any uploaded files on error
            for file_data in image_files:
                try:
                    filename = file_data.get("filename")
                    file_extension = filename.lower().split('.')[-1]
                    unique_filename = f"{uuid.uuid4()}.{file_extension}"
                    file_path = os.path.join(self.upload_folder, unique_filename)
                    if os.path.exists(file_path):
                        os.remove(file_path)
                except:
                    pass
            raise Exception(f"Failed to add images: {str(e)}")
    
    async def remove_image_from_post(self, post_id: str, image_filename: str) -> Optional[PostResponse]:
        """Remove an image from a post."""
        try:
            # Remove image from database
            success = await self.repository.remove_image_from_post(post_id, image_filename)
            
            if success:
                # Delete physical file
                file_path = os.path.join(self.upload_folder, image_filename)
                if os.path.exists(file_path):
                    try:
                        os.remove(file_path)
                        logger.info(f"Deleted image file: {file_path}")
                    except OSError as e:
                        logger.warning(f"Failed to delete image file {file_path}: {str(e)}")
                
                # Return updated post
                updated_post = await self.repository.get_post_by_id(post_id)
                return self._convert_to_response(updated_post) if updated_post else None
            
            return None
            
        except Exception as e:
            logger.error(f"Error in remove_image_from_post service: {str(e)}")
            raise Exception(f"Failed to remove image: {str(e)}")
    
    async def schedule_post(self, post_id: str, scheduled_at: datetime) -> Optional[PostResponse]:
        """Schedule a post for publication."""
        try:
            # Update post status and scheduled time
            update_data = PostUpdate(
                status=PostStatus.SCHEDULED,
                scheduled_at=scheduled_at
            )
            
            return await self.update_post(post_id, update_data)
            
        except Exception as e:
            logger.error(f"Error in schedule_post service: {str(e)}")
            raise Exception(f"Failed to schedule post: {str(e)}")
    
    async def get_scheduled_posts(self) -> List[PostResponse]:
        """Get posts ready for publication."""
        try:
            posts = await self.repository.get_scheduled_posts()
            return [self._convert_to_response(post) for post in posts]
            
        except Exception as e:
            logger.error(f"Error in get_scheduled_posts service: {str(e)}")
            raise Exception(f"Failed to retrieve scheduled posts: {str(e)}")


# Add missing import
import io