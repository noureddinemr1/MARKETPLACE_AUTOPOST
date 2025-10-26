"""
Pydantic models for data validation and serialization.
"""
from pydantic import BaseModel, Field, field_validator, HttpUrl
from typing import List, Optional, Dict, Any, Annotated
from datetime import datetime
from bson import ObjectId
import enum


class PyObjectId(ObjectId):
    """Custom ObjectId type for Pydantic v2."""
    
    @classmethod
    def __get_pydantic_core_schema__(cls, _source_type, _handler):
        from pydantic_core import core_schema
        return core_schema.json_or_python_schema(
            json_schema=core_schema.str_schema(),
            python_schema=core_schema.union_schema([
                core_schema.is_instance_schema(ObjectId),
                core_schema.chain_schema([
                    core_schema.str_schema(),
                    core_schema.no_info_plain_validator_function(cls.validate),
                ])
            ]),
            serialization=core_schema.plain_serializer_function_ser_schema(
                lambda x: str(x)
            ),
        )

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)


class CategoryEnum(str, enum.Enum):
    """Enumeration for post categories."""
    VEHICLES = "vehicles"
    PROPERTY_RENTALS = "property-rentals"
    APPAREL = "apparel"
    ELECTRONICS = "electronics"
    ENTERTAINMENT = "entertainment"
    FAMILY = "family"
    GARDEN_OUTDOOR = "garden-outdoor"
    HOBBIES = "hobbies"
    HOME_GOODS = "home-goods"
    HOME_IMPROVEMENT_SUPPLIES = "home-improvement-supplies"
    HOME_SALES = "home-sales"
    MUSICAL_INSTRUMENTS = "musical-instruments"
    OFFICE_SUPPLIES = "office-supplies"
    PET_SUPPLIES = "pet-supplies"
    SPORTING_GOODS = "sporting-goods"
    TOYS_GAMES = "toys-games"
    OTHER = "other"


class PostStatus(str, enum.Enum):
    """Enumeration for post status."""
    DRAFT = "draft"
    PUBLISHED = "published"
    SCHEDULED = "scheduled"
    ARCHIVED = "archived"


class ImageModel(BaseModel):
    """Model for image data."""
    filename: str = Field(..., description="Original filename of the image")
    url: str = Field(..., description="URL path to the stored image")
    size: int = Field(..., description="File size in bytes")
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {ObjectId: str}


class PostCreate(BaseModel):
    """Model for creating a new post."""
    title: str = Field(..., min_length=1, max_length=200, description="Post title")
    description: str = Field(..., min_length=1, max_length=2000, description="Post description")
    price: float = Field(..., ge=0, description="Post price (must be non-negative)")
    category: CategoryEnum = Field(..., description="Post category")
    location: str = Field(..., min_length=1, max_length=100, description="Post location")
    status: Optional[PostStatus] = Field(default=PostStatus.PUBLISHED, description="Post status")
    scheduled_at: Optional[datetime] = Field(None, description="When to publish the post (for scheduled posts)")
    
    @field_validator('title', 'description', 'location')
    @classmethod
    def strip_whitespace(cls, v):
        """Remove leading and trailing whitespace."""
        return v.strip() if v else v
    
    @field_validator('scheduled_at')
    @classmethod
    def validate_scheduled_status(cls, v, info):
        """Validate that scheduled_at is set when status is scheduled."""
        status = info.data.get('status')
        if status == PostStatus.SCHEDULED and v is None:
            raise ValueError("scheduled_at must be set when status is 'scheduled'")
        if status == PostStatus.SCHEDULED and v is not None:
            # Remove timezone info for comparison (make both naive)
            scheduled_time = v.replace(tzinfo=None) if v.tzinfo else v
            current_time = datetime.utcnow()
            if scheduled_time <= current_time:
                raise ValueError("scheduled_at must be in the future")
        return v


class PostUpdate(BaseModel):
    """Model for updating an existing post."""
    title: Optional[str] = Field(None, min_length=1, max_length=200, description="Post title")
    description: Optional[str] = Field(None, min_length=1, max_length=2000, description="Post description")
    price: Optional[float] = Field(None, ge=0, description="Post price (must be non-negative)")
    category: Optional[CategoryEnum] = Field(None, description="Post category")
    location: Optional[str] = Field(None, min_length=1, max_length=100, description="Post location")
    status: Optional[PostStatus] = Field(None, description="Post status")
    scheduled_at: Optional[datetime] = Field(None, description="When to publish the post (for scheduled posts)")
    
    @field_validator('title', 'description', 'location')
    @classmethod
    def strip_whitespace(cls, v):
        """Remove leading and trailing whitespace."""
        return v.strip() if v else v


class PostInDB(BaseModel):
    """Internal model representing a post in the database."""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    title: str
    description: str
    price: float
    category: CategoryEnum
    location: str
    status: PostStatus = Field(default=PostStatus.PUBLISHED)
    images: List[ImageModel] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Scheduling fields
    scheduled_at: Optional[datetime] = None
    facebook_post_id: Optional[str] = None
    
    class Config:
        validate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class PostResponse(BaseModel):
    """Model for post API responses."""
    id: str = Field(..., description="Post ID")
    title: str
    description: str
    price: float
    category: CategoryEnum
    location: str
    status: PostStatus
    images: List[ImageModel] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
    scheduled_at: Optional[datetime] = None
    facebook_post_id: Optional[str] = None

    class Config:
        json_encoders = {ObjectId: str}


class SchedulePostRequest(BaseModel):
    """Model for scheduling a post."""
    post_id: str = Field(..., description="ID of the post to schedule")
    scheduled_at: datetime = Field(..., description="When to publish the post")
    facebook_access_token: Optional[str] = Field(None, description="Facebook access token for posting")
    
    @field_validator('scheduled_at')
    @classmethod
    def validate_future_date(cls, v):
        """Ensure scheduled date is in the future."""
        if v <= datetime.utcnow():
            raise ValueError("Scheduled time must be in the future")
        return v


class FacebookPostRequest(BaseModel):
    """Model for Facebook post requests."""
    message: str = Field(..., min_length=1, description="Post message for Facebook")
    access_token: str = Field(..., description="Facebook access token")
    page_id: Optional[str] = Field(None, description="Facebook page ID (if posting to a page)")


class PaginationParams(BaseModel):
    """Model for pagination parameters."""
    skip: int = Field(0, ge=0, description="Number of items to skip")
    limit: int = Field(10, ge=1, le=100, description="Maximum number of items to return")


class PostFilter(BaseModel):
    """Model for filtering posts."""
    category: Optional[CategoryEnum] = None
    status: Optional[PostStatus] = None
    min_price: Optional[float] = Field(None, ge=0)
    max_price: Optional[float] = Field(None, ge=0)
    location: Optional[str] = None
    
    @field_validator('max_price')
    @classmethod
    def validate_price_range(cls, v, info):
        """Ensure max_price is greater than min_price."""
        if v is not None and info.data.get('min_price') is not None:
            if v < info.data['min_price']:
                raise ValueError("max_price must be greater than or equal to min_price")
        return v


class ApiResponse(BaseModel):
    """Generic API response model."""
    success: bool = Field(..., description="Whether the operation was successful")
    message: str = Field(..., description="Response message")
    data: Optional[Dict[str, Any]] = Field(None, description="Response data")