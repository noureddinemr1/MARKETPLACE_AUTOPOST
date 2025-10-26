"""
API routes for dashboard statistics and analytics.
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from datetime import datetime, timedelta

from app.services.post_service import PostService
from app.models.post import PostStatus, PaginationParams

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

# Initialize services
post_service = PostService()


@router.get("/stats", response_model=Dict[str, Any])
async def get_dashboard_stats():
    """Get dashboard statistics."""
    try:
        # Get all posts without pagination to calculate stats
        all_posts_result = await post_service.get_posts(
            filters=None,
            pagination=None
        )
        
        posts = all_posts_result.get('posts', [])
        total_posts = len(posts)
        
        # Count by status
        published_count = sum(1 for p in posts if p.status == PostStatus.PUBLISHED)
        scheduled_count = sum(1 for p in posts if p.status == PostStatus.SCHEDULED)
        draft_count = sum(1 for p in posts if p.status == PostStatus.DRAFT)
        archived_count = sum(1 for p in posts if p.status == PostStatus.ARCHIVED)
        
        # Count posts with Facebook ID (successfully posted)
        facebook_posted_count = sum(1 for p in posts if p.facebook_post_id)
        
        # Calculate success rate (posts with Facebook ID / total published posts)
        success_rate = 0.0
        if published_count > 0:
            success_rate = round((facebook_posted_count / published_count) * 100, 1)
        
        # Count images
        total_images = sum(len(p.images) for p in posts if p.images)
        
        # Posts in last 7 days
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        recent_posts_count = 0
        for p in posts:
            try:
                # Handle different date formats
                if isinstance(p.created_at, str):
                    created_at = datetime.fromisoformat(p.created_at.replace('Z', '+00:00'))
                elif isinstance(p.created_at, datetime):
                    created_at = p.created_at
                else:
                    continue
                
                if created_at.replace(tzinfo=None) > seven_days_ago:
                    recent_posts_count += 1
            except:
                continue
        
        # Calculate average price
        prices = [float(p.price) for p in posts if p.price and float(p.price) > 0]
        avg_price = round(sum(prices) / len(prices), 2) if prices else 0.0
        
        return {
            "total_posts": total_posts,
            "published_posts": published_count,
            "scheduled_posts": scheduled_count,
            "draft_posts": draft_count,
            "archived_posts": archived_count,
            "success_rate": success_rate,
            "total_images": total_images,
            "recent_posts_7_days": recent_posts_count,
            "facebook_posted_count": facebook_posted_count,
            "average_price": avg_price,
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get dashboard stats: {str(e)}")


@router.get("/recent-activity", response_model=List[Dict[str, Any]])
async def get_recent_activity(limit: int = 10):
    """Get recent activity/posts."""
    try:
        # Get recent posts sorted by updated_at
        pagination = PaginationParams(skip=0, limit=limit)
        result = await post_service.get_posts(
            filters=None,
            pagination=pagination
        )
        
        posts = result.get('posts', [])
        
        # Transform to activity items
        activities = []
        for post in posts:
            # Determine action based on status
            action = "Unknown action"
            status_label = "unknown"
            
            if post.status == PostStatus.PUBLISHED:
                action = "Post published"
                status_label = "success"
            elif post.status == PostStatus.SCHEDULED:
                action = "Post scheduled"
                status_label = "pending"
            elif post.status == PostStatus.DRAFT:
                action = "Draft saved"
                status_label = "draft"
            elif post.status == PostStatus.ARCHIVED:
                action = "Post archived"
                status_label = "archived"
            
            # Calculate time ago
            try:
                if isinstance(post.updated_at, str):
                    updated_at = datetime.fromisoformat(post.updated_at.replace('Z', '+00:00'))
                elif isinstance(post.updated_at, datetime):
                    updated_at = post.updated_at
                else:
                    updated_at = datetime.utcnow()
                
                time_diff = datetime.utcnow() - updated_at.replace(tzinfo=None)
                
                if time_diff.days > 0:
                    time_ago = f"{time_diff.days} day{'s' if time_diff.days > 1 else ''} ago"
                elif time_diff.seconds >= 3600:
                    hours = time_diff.seconds // 3600
                    time_ago = f"{hours} hour{'s' if hours > 1 else ''} ago"
                elif time_diff.seconds >= 60:
                    minutes = time_diff.seconds // 60
                    time_ago = f"{minutes} minute{'s' if minutes > 1 else ''} ago"
                else:
                    time_ago = "Just now"
            except:
                time_ago = "Recently"
            
            activities.append({
                "id": post.id,
                "action": action,
                "post_title": post.title,
                "time": time_ago,
                "status": status_label,
                "created_at": post.created_at if isinstance(post.created_at, str) else post.created_at.isoformat(),
                "updated_at": post.updated_at if isinstance(post.updated_at, str) else post.updated_at.isoformat(),
            })
        
        return activities
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get recent activity: {str(e)}")


@router.get("/category-distribution", response_model=List[Dict[str, Any]])
async def get_category_distribution():
    """Get distribution of posts by category."""
    try:
        # Get all posts
        result = await post_service.get_posts(filters=None, pagination=None)
        posts = result.get('posts', [])
        
        # Count by category
        category_counts = {}
        for post in posts:
            category = post.category.value if hasattr(post.category, 'value') else post.category
            category_counts[category] = category_counts.get(category, 0) + 1
        
        # Transform to array for charting
        distribution = [
            {"category": cat, "count": count}
            for cat, count in sorted(category_counts.items(), key=lambda x: x[1], reverse=True)
        ]
        
        return distribution
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get category distribution: {str(e)}")


@router.get("/status-distribution", response_model=List[Dict[str, Any]])
async def get_status_distribution():
    """Get distribution of posts by status."""
    try:
        # Get all posts
        result = await post_service.get_posts(filters=None, pagination=None)
        posts = result.get('posts', [])
        
        # Count by status
        status_counts = {
            'published': 0,
            'scheduled': 0,
            'draft': 0,
            'archived': 0
        }
        
        for post in posts:
            status = post.status.value if hasattr(post.status, 'value') else post.status
            if status in status_counts:
                status_counts[status] += 1
        
        # Transform to array for charting
        distribution = [
            {"status": status, "count": count}
            for status, count in status_counts.items()
        ]
        
        return distribution
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get status distribution: {str(e)}")


@router.get("/posting-trend", response_model=List[Dict[str, Any]])
async def get_posting_trend(days: int = 7):
    """Get posting trend over the last N days."""
    try:
        # Get all posts
        result = await post_service.get_posts(filters=None, pagination=None)
        posts = result.get('posts', [])
        
        # Initialize daily counts
        daily_counts = {}
        for i in range(days):
            date = (datetime.utcnow() - timedelta(days=i)).date()
            daily_counts[date.isoformat()] = 0
        
        # Count posts by day
        for post in posts:
            try:
                if isinstance(post.created_at, str):
                    created_date = datetime.fromisoformat(post.created_at.replace('Z', '+00:00')).date()
                elif isinstance(post.created_at, datetime):
                    created_date = post.created_at.date()
                else:
                    continue
                
                date_str = created_date.isoformat()
                
                if date_str in daily_counts:
                    daily_counts[date_str] += 1
            except:
                continue
        
        # Transform to array for charting (sorted by date)
        trend = [
            {"date": date, "count": count}
            for date, count in sorted(daily_counts.items())
        ]
        
        return trend
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get posting trend: {str(e)}")
