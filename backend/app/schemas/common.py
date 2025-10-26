"""
Common Pydantic schemas used across the application.
"""
from pydantic import BaseModel, Field
from typing import Any, Optional, Dict, List


class ApiResponse(BaseModel):
    """Standard API response schema."""
    success: bool = True
    message: str = "Operation completed successfully"
    data: Optional[Any] = None
    errors: Optional[List[str]] = None


class PaginationMeta(BaseModel):
    """Pagination metadata schema."""
    page: int = Field(..., ge=1)
    per_page: int = Field(..., ge=1, le=100)
    total_pages: int = Field(..., ge=0)
    total_items: int = Field(..., ge=0)
    has_next: bool
    has_prev: bool


class PaginatedResponse(BaseModel):
    """Paginated response schema."""
    items: List[Any]
    meta: PaginationMeta


class HealthCheckResponse(BaseModel):
    """Health check response schema."""
    status: str
    environment: str
    database: Dict[str, Any]
    scheduler: Dict[str, str]
    version: str


class ErrorResponse(BaseModel):
    """Error response schema."""
    error: str
    status_code: int
    path: str
    timestamp: Optional[str] = None