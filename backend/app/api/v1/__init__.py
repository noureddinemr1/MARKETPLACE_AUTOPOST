"""
API v1 router configuration.
"""
from fastapi import APIRouter

from .posts import router as posts_router
from .dashboard import router as dashboard_router
from .analytics import router as analytics_router

# Create v1 API router
api_v1_router = APIRouter(prefix="/api/v1")

# Include all v1 routers
api_v1_router.include_router(posts_router, tags=["Posts"])
api_v1_router.include_router(dashboard_router, tags=["Dashboard"])
api_v1_router.include_router(analytics_router, tags=["Analytics"])