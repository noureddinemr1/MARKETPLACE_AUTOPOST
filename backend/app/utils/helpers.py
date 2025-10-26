"""
Utility functions and helpers.
"""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import re
import hashlib
import secrets


def generate_uuid() -> str:
    """Generate a random UUID string."""
    return secrets.token_urlsafe(16)


def generate_hash(data: str) -> str:
    """Generate SHA256 hash of input data."""
    return hashlib.sha256(data.encode()).hexdigest()


def clean_string(text: str) -> str:
    """Clean and normalize text string."""
    if not text:
        return ""
    # Remove extra whitespace and normalize
    return re.sub(r'\s+', ' ', text.strip())


def validate_email(email: str) -> bool:
    """Validate email address format."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def format_price(price: float) -> str:
    """Format price with proper currency formatting."""
    return f"${price:,.2f}"


def utc_now() -> datetime:
    """Get current UTC datetime."""
    return datetime.now(timezone.utc)


def paginate_query_params(skip: int = 0, limit: int = 10) -> Dict[str, int]:
    """Validate and normalize pagination parameters."""
    skip = max(0, skip)
    limit = max(1, min(100, limit))  # Limit between 1-100
    return {"skip": skip, "limit": limit}


def extract_filename_from_path(file_path: str) -> str:
    """Extract filename from file path."""
    return file_path.split('/')[-1].split('\\')[-1]


def safe_dict_get(dictionary: Dict[str, Any], key: str, default: Any = None) -> Any:
    """Safely get value from dictionary with fallback."""
    return dictionary.get(key, default) if isinstance(dictionary, dict) else default