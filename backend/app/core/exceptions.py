"""
Custom exceptions for the application.
"""
from fastapi import HTTPException, status
from typing import Any, Dict, Optional


class BaseHTTPException(HTTPException):
    """Base HTTP exception class."""
    def __init__(self, detail: Any = None, headers: Optional[Dict[str, Any]] = None):
        super().__init__(self.status_code, detail, headers)


class AuthenticationException(BaseHTTPException):
    """Raised when authentication fails."""
    status_code = status.HTTP_401_UNAUTHORIZED
    detail = "Authentication failed"


class AuthorizationException(BaseHTTPException):
    """Raised when user lacks required permissions."""
    status_code = status.HTTP_403_FORBIDDEN
    detail = "Insufficient permissions"


class ValidationException(BaseHTTPException):
    """Raised when data validation fails."""
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    detail = "Validation error"


class NotFoundError(BaseHTTPException):
    """Raised when a resource is not found."""
    status_code = status.HTTP_404_NOT_FOUND
    detail = "Resource not found"


class ConflictError(BaseHTTPException):
    """Raised when a resource conflict occurs."""
    status_code = status.HTTP_409_CONFLICT
    detail = "Resource conflict"


class DatabaseError(BaseHTTPException):
    """Raised when database operation fails."""
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    detail = "Database operation failed"


class ExternalServiceError(BaseHTTPException):
    """Raised when external service call fails."""
    status_code = status.HTTP_502_BAD_GATEWAY
    detail = "External service unavailable"