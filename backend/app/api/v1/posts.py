"""
API routes for post management.
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends, Query
from typing import List, Optional
from datetime import datetime

from app.models.post import (
    PostCreate, PostUpdate, PostResponse, PostFilter, 
    PaginationParams, SchedulePostRequest, FacebookPostRequest, ApiResponse
)
from app.services.post_service import PostService
from app.services.scheduler_service import scheduler_service
from app.services.external.facebook_service import FacebookService

router = APIRouter(prefix="/posts", tags=["posts"])

# Initialize services
post_service = PostService()
facebook_service = FacebookService()


@router.post("", response_model=PostResponse)
async def create_post(post_data: PostCreate):
    """Create a new post."""
    try:
        print(f"Received post data: {post_data.model_dump()}")
        result = await post_service.create_post(post_data)
        return result
    except ValueError as e:
        print(f"Validation error: {str(e)}")
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        import traceback
        print(f"Exception creating post: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=dict)
async def get_posts(
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100)
):
    """Get posts with filtering and pagination."""
    try:
        # Create filter and pagination objects
        filters = PostFilter(
            category=category,
            status=status,
            location=location,
            min_price=min_price,
            max_price=max_price
        )
        pagination = PaginationParams(skip=skip, limit=limit)
        
        result = await post_service.get_posts(filters, pagination)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{post_id}", response_model=PostResponse)
async def get_post(post_id: str):
    """Get a specific post by ID."""
    try:
        result = await post_service.get_post_by_id(post_id)
        if not result:
            raise HTTPException(status_code=404, detail="Post not found")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{post_id}", response_model=PostResponse)
async def update_post(post_id: str, update_data: PostUpdate):
    """Update a post."""
    try:
        result = await post_service.update_post(post_id, update_data)
        if not result:
            raise HTTPException(status_code=404, detail="Post not found")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{post_id}", response_model=ApiResponse)
async def delete_post(post_id: str):
    """Delete a post."""
    try:
        # Cancel any scheduled jobs for this post
        await scheduler_service.cancel_scheduled_post(post_id)
        
        # Delete the post
        success = await post_service.delete_post(post_id)
        if not success:
            raise HTTPException(status_code=404, detail="Post not found")
        
        return ApiResponse(
            success=True,
            message="Post deleted successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{post_id}/images", response_model=PostResponse)
async def upload_images(
    post_id: str,
    files: List[UploadFile] = File(...)
):
    """Upload images to a post."""
    try:
        # Validate file count
        if len(files) > 5:
            raise HTTPException(status_code=400, detail="Maximum 5 images allowed")
        
        # Prepare file data
        image_files = []
        for file in files:
            content = await file.read()
            image_files.append({
                "filename": file.filename,
                "content": content
            })
        
        result = await post_service.add_images_to_post(post_id, image_files)
        if not result:
            raise HTTPException(status_code=404, detail="Post not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{post_id}/images/{image_filename}", response_model=PostResponse)
async def remove_image(post_id: str, image_filename: str):
    """Remove an image from a post."""
    try:
        result = await post_service.remove_image_from_post(post_id, image_filename)
        if not result:
            raise HTTPException(status_code=404, detail="Post or image not found")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{post_id}/schedule", response_model=ApiResponse)
async def schedule_post(post_id: str, schedule_data: SchedulePostRequest):
    """Schedule a post for publication."""
    try:
        # Schedule the post
        result = await post_service.schedule_post(post_id, schedule_data.scheduled_at)
        if not result:
            raise HTTPException(status_code=404, detail="Post not found")
        
        # Add to scheduler
        success = await scheduler_service.schedule_post_publication(
            post_id=post_id,
            scheduled_at=schedule_data.scheduled_at,
            facebook_access_token=schedule_data.facebook_access_token
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to schedule post")
        
        return ApiResponse(
            success=True,
            message=f"Post scheduled for {schedule_data.scheduled_at}",
            data={"post_id": post_id, "scheduled_at": schedule_data.scheduled_at.isoformat()}
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{post_id}/schedule", response_model=ApiResponse)
async def cancel_scheduled_post(post_id: str):
    """Cancel a scheduled post."""
    try:
        # Cancel scheduler job
        success = await scheduler_service.cancel_scheduled_post(post_id)
        
        # Update post status
        from app.models.post import PostStatus, PostUpdate
        update_data = PostUpdate(status=PostStatus.DRAFT, scheduled_at=None)
        await post_service.update_post(post_id, update_data)
        
        return ApiResponse(
            success=True,
            message="Scheduled post cancelled successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/scheduled/jobs")
async def get_scheduled_jobs():
    """Get list of scheduled posting jobs."""
    try:
        jobs = scheduler_service.get_scheduled_jobs()
        return {"jobs": jobs}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{post_id}/facebook/page", response_model=ApiResponse)
async def post_to_facebook_page(
    post_id: str, 
    facebook_data: FacebookPostRequest,
    page_id: str = Query(..., description="Facebook page ID")
):
    """Post to a Facebook page."""
    try:
        # Get the post
        post = await post_service.get_post_by_id(post_id)
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        # Get image URLs if any
        image_urls = [f"/uploads/{img.filename}" for img in post.images] if post.images else []
        
        # Post to Facebook
        result = await facebook_service.create_page_post(
            page_id=page_id,
            page_access_token=facebook_data.access_token,
            post_data=post,
            image_urls=image_urls
        )
        
        if result.get("success"):
            # Update post with Facebook post ID
            update_data = PostUpdate(facebook_post_id=result.get("post_id"))
            await post_service.update_post(post_id, update_data)
            
            return ApiResponse(
                success=True,
                message="Posted to Facebook page successfully",
                data={"facebook_post_id": result.get("post_id")}
            )
        else:
            raise HTTPException(status_code=400, detail=result.get("error"))
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{post_id}/facebook/marketplace", response_model=ApiResponse)
async def post_to_facebook_marketplace(post_id: str, facebook_data: FacebookPostRequest):
    """Post to Facebook Marketplace."""
    try:
        # Get the post
        post = await post_service.get_post_by_id(post_id)
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        # Get image URLs if any
        image_urls = [f"/uploads/{img.filename}" for img in post.images] if post.images else []
        
        # Post to Facebook Marketplace
        result = await facebook_service.create_marketplace_listing(
            access_token=facebook_data.access_token,
            post_data=post,
            image_urls=image_urls
        )
        
        if result.get("success"):
            # Update post with Facebook listing ID
            update_data = PostUpdate(facebook_post_id=result.get("listing_id"))
            await post_service.update_post(post_id, update_data)
            
            return ApiResponse(
                success=True,
                message="Posted to Facebook Marketplace successfully",
                data={"facebook_listing_id": result.get("listing_id")}
            )
        else:
            raise HTTPException(status_code=400, detail=result.get("error"))
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/facebook/{facebook_post_id}", response_model=ApiResponse)
async def delete_facebook_post(
    facebook_post_id: str,
    access_token: str = Query(..., description="Facebook access token")
):
    """Delete a Facebook post."""
    try:
        result = await facebook_service.delete_facebook_post(facebook_post_id, access_token)
        
        if result.get("success"):
            return ApiResponse(
                success=True,
                message="Facebook post deleted successfully"
            )
        else:
            raise HTTPException(status_code=400, detail=result.get("error"))
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))