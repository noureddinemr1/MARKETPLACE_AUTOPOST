"""
FastAPI application with proper startup/shutdown handling.
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import uvicorn
from pathlib import Path

from app.core.config import settings
from app.core.database import db_connection
from app.api.v1 import api_v1_router
from app.services.scheduler_service import scheduler_service

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format=settings.LOG_FORMAT,
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("app.log") if settings.is_production else logging.NullHandler()
    ]
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan events."""
    # Startup
    logger.info("Starting up Facebook Auto-Post Bot API...")
    
    try:
        # Connect to database (graceful fallback if fails)
        await db_connection.connect()
        
        # Start scheduler
        await scheduler_service.start_scheduler()
        
        # Create upload directory
        upload_path = Path(settings.UPLOAD_FOLDER)
        upload_path.mkdir(parents=True, exist_ok=True)
        
        logger.info("Application startup completed successfully")
        
    except Exception as e:
        logger.error(f"Non-critical startup error: {e}")
        logger.info("Application will continue in development mode")
    
    yield
    
    # Shutdown
    logger.info("Shutting down application...")
    
    try:
        # Stop scheduler
        await scheduler_service.stop_scheduler()
        
        # Disconnect from database
        await db_connection.disconnect()
        
        logger.info("Application shutdown completed")
        
    except Exception as e:
        logger.error(f"Error during shutdown: {e}")


# Create FastAPI application
app = FastAPI(
    title="Facebook Auto-Post Bot API",
    description="A comprehensive dashboard for managing Facebook automated posts",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan
)

# Add security middleware
if settings.is_production:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["yourdomain.com", "*.yourdomain.com"]
    )

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_FOLDER), name="uploads")

# Include API v1 router
app.include_router(api_v1_router)


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Custom HTTP exception handler."""
    logger.error(f"HTTP {exc.status_code} error on {request.url}: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code,
            "path": str(request.url)
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions."""
    logger.error(f"Unexpected error on {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal server error" if settings.is_production else str(exc),
            "status_code": 500,
            "path": str(request.url)
        }
    )


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    try:
        db_health = await db_connection.health_check()
        scheduler_running = bool(scheduler_service.scheduler and scheduler_service.scheduler.running)
        
        return {
            "status": "healthy",
            "environment": settings.ENVIRONMENT,
            "database": db_health,
            "scheduler": {"status": "running" if scheduler_running else "stopped"},
            "version": "1.0.0"
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "unhealthy",
                "error": str(e)
            }
        )


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Facebook Auto-Post Bot API",
        "version": "1.0.0",
        "docs": "/docs" if settings.DEBUG else "Documentation not available in production"
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
        access_log=settings.DEBUG
    )