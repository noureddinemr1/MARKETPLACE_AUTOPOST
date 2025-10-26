"""
API routes for analytics data and statistics.
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from datetime import datetime, timedelta
from collections import defaultdict

from app.services.post_service import PostService
from app.models.post import PostStatus

router = APIRouter(prefix="/analytics", tags=["analytics"])

# Initialize services
post_service = PostService()


@router.get("/overview", response_model=Dict[str, Any])
async def get_analytics_overview():
    """Get comprehensive analytics overview."""
    try:
        # Get all posts
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
        
        # Facebook posting stats
        facebook_posted_count = sum(1 for p in posts if p.facebook_post_id)
        pending_facebook_count = published_count - facebook_posted_count
        
        # Calculate success rate
        success_rate = 0.0
        if published_count > 0:
            success_rate = round((facebook_posted_count / published_count) * 100, 1)
        
        # Total images
        total_images = sum(len(p.images) for p in posts if p.images)
        
        # Average price
        prices = [p.price for p in posts if p.price > 0]
        avg_price = round(sum(prices) / len(prices), 2) if prices else 0
        
        return {
            "total_posts": total_posts,
            "published": published_count,
            "scheduled": scheduled_count,
            "drafts": draft_count,
            "archived": archived_count,
            "facebook_posted": facebook_posted_count,
            "pending_facebook": pending_facebook_count,
            "success_rate": success_rate,
            "total_images": total_images,
            "average_price": avg_price
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/posts-over-time", response_model=List[Dict[str, Any]])
async def get_posts_over_time(days: int = 30):
    """Get posts created over time (configurable days)."""
    try:
        all_posts_result = await post_service.get_posts(
            filters=None,
            pagination=None
        )
        
        posts = all_posts_result.get('posts', [])
        
        # Group posts by date for the specified days
        n_days_ago = datetime.utcnow() - timedelta(days=days)
        date_counts = defaultdict(int)
        
        for post in posts:
            post_date = post.created_at
            if post_date >= n_days_ago:
                date_key = post_date.strftime('%Y-%m-%d')
                date_counts[date_key] += 1
        
        # Fill in missing dates with 0
        result = []
        for i in range(days):
            date = datetime.utcnow() - timedelta(days=(days-1)-i)
            date_key = date.strftime('%Y-%m-%d')
            result.append({
                "date": date_key,
                "count": date_counts.get(date_key, 0)
            })
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/category-distribution", response_model=List[Dict[str, Any]])
async def get_category_distribution():
    """Get post distribution by category."""
    try:
        all_posts_result = await post_service.get_posts(
            filters=None,
            pagination=None
        )
        
        posts = all_posts_result.get('posts', [])
        
        # Count posts by category
        category_counts = defaultdict(int)
        for post in posts:
            category_counts[post.category] += 1
        
        # Convert to list and sort by count
        result = [
            {
                "category": category,
                "count": count,
                "percentage": round((count / len(posts)) * 100, 1) if posts else 0
            }
            for category, count in category_counts.items()
        ]
        
        result.sort(key=lambda x: x['count'], reverse=True)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status-distribution", response_model=List[Dict[str, Any]])
async def get_status_distribution():
    """Get post distribution by status."""
    try:
        all_posts_result = await post_service.get_posts(
            filters=None,
            pagination=None
        )
        
        posts = all_posts_result.get('posts', [])
        
        # Count posts by status
        status_counts = {
            "published": sum(1 for p in posts if p.status == PostStatus.PUBLISHED),
            "scheduled": sum(1 for p in posts if p.status == PostStatus.SCHEDULED),
            "draft": sum(1 for p in posts if p.status == PostStatus.DRAFT),
            "archived": sum(1 for p in posts if p.status == PostStatus.ARCHIVED)
        }
        
        total = len(posts)
        result = [
            {
                "status": status,
                "count": count,
                "percentage": round((count / total) * 100, 1) if total > 0 else 0
            }
            for status, count in status_counts.items()
            if count > 0
        ]
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/price-distribution", response_model=Dict[str, Any])
async def get_price_distribution():
    """Get price distribution statistics."""
    try:
        all_posts_result = await post_service.get_posts(
            filters=None,
            pagination=None
        )
        
        posts = all_posts_result.get('posts', [])
        prices = [p.price for p in posts if p.price > 0]
        
        if not prices:
            return {
                "min": 0,
                "max": 0,
                "average": 0,
                "median": 0,
                "ranges": []
            }
        
        prices.sort()
        
        # Calculate statistics
        min_price = min(prices)
        max_price = max(prices)
        avg_price = sum(prices) / len(prices)
        median_price = prices[len(prices) // 2]
        
        # Create price ranges
        ranges = [
            {"range": "$0-$50", "count": sum(1 for p in prices if 0 <= p < 50)},
            {"range": "$50-$100", "count": sum(1 for p in prices if 50 <= p < 100)},
            {"range": "$100-$250", "count": sum(1 for p in prices if 100 <= p < 250)},
            {"range": "$250-$500", "count": sum(1 for p in prices if 250 <= p < 500)},
            {"range": "$500+", "count": sum(1 for p in prices if p >= 500)}
        ]
        
        return {
            "min": round(min_price, 2),
            "max": round(max_price, 2),
            "average": round(avg_price, 2),
            "median": round(median_price, 2),
            "ranges": ranges
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/location-distribution", response_model=List[Dict[str, Any]])
async def get_location_distribution():
    """Get top locations by post count."""
    try:
        all_posts_result = await post_service.get_posts(
            filters=None,
            pagination=None
        )
        
        posts = all_posts_result.get('posts', [])
        
        # Count posts by location
        location_counts = defaultdict(int)
        for post in posts:
            if post.location:
                location_counts[post.location] += 1
        
        # Convert to list and sort by count
        result = [
            {
                "location": location,
                "count": count,
                "percentage": round((count / len(posts)) * 100, 1) if posts else 0
            }
            for location, count in location_counts.items()
        ]
        
        result.sort(key=lambda x: x['count'], reverse=True)
        
        # Return top 10
        return result[:10]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recent-activity", response_model=List[Dict[str, Any]])
async def get_recent_activity(days: int = 7):
    """Get recent posts activity (configurable days)."""
    try:
        all_posts_result = await post_service.get_posts(
            filters=None,
            pagination=None
        )
        
        posts = all_posts_result.get('posts', [])
        
        # Group by day for specified days
        n_days_ago = datetime.utcnow() - timedelta(days=days)
        activity_data = []
        
        for i in range(days):
            date = datetime.utcnow() - timedelta(days=(days-1)-i)
            date_key = date.strftime('%Y-%m-%d')
            day_name = date.strftime('%a')  # Short day name (Mon, Tue, etc)
            
            # Count posts created on this day
            created_count = sum(
                1 for p in posts 
                if p.created_at.date() == date.date()
            )
            
            # Count posts updated on this day
            updated_count = sum(
                1 for p in posts 
                if p.updated_at.date() == date.date() and p.created_at.date() != date.date()
            )
            
            activity_data.append({
                "date": date_key,
                "day": day_name,
                "created": created_count,
                "updated": updated_count,
                "total": created_count + updated_count
            })
        
        return activity_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
