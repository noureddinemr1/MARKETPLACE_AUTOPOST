"""
Facebook Graph API service for posting to Marketplace and Pages.
"""
import aiohttp
import asyncio
import json
from typing import Dict, List, Optional, Any
from datetime import datetime
import logging

from app.core.config import settings
from app.models.post import PostResponse

logger = logging.getLogger(__name__)


class FacebookService:
    """Service for Facebook Graph API integration."""
    
    def __init__(self):
        self.base_url = "https://graph.facebook.com/v18.0"
        self.app_id = settings.FACEBOOK_APP_ID
        self.app_secret = settings.FACEBOOK_APP_SECRET
    
    async def validate_access_token(self, access_token: str) -> Dict[str, Any]:
        """Validate Facebook access token and get user/page info."""
        try:
            url = f"{self.base_url}/me"
            params = {
                "access_token": access_token,
                "fields": "id,name,email,accounts{id,name,access_token,category}"
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        return {
                            "valid": True,
                            "user_id": data.get("id"),
                            "user_name": data.get("name"),
                            "email": data.get("email"),
                            "pages": data.get("accounts", {}).get("data", [])
                        }
                    else:
                        error_data = await response.json()
                        return {
                            "valid": False,
                            "error": error_data.get("error", {}).get("message", "Invalid token")
                        }
        
        except Exception as e:
            logger.error(f"Error validating Facebook token: {str(e)}")
            return {"valid": False, "error": str(e)}
    
    async def get_user_pages(self, access_token: str) -> List[Dict[str, Any]]:
        """Get list of Facebook pages the user manages."""
        try:
            url = f"{self.base_url}/me/accounts"
            params = {
                "access_token": access_token,
                "fields": "id,name,access_token,category,tasks"
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get("data", [])
                    else:
                        logger.error(f"Failed to get user pages: {response.status}")
                        return []
        
        except Exception as e:
            logger.error(f"Error getting user pages: {str(e)}")
            return []
    
    async def create_page_post(
        self, 
        page_id: str, 
        page_access_token: str, 
        post_data: PostResponse,
        image_urls: List[str] = None
    ) -> Dict[str, Any]:
        """Create a post on a Facebook page."""
        try:
            url = f"{self.base_url}/{page_id}/feed"
            
            # Prepare post message
            message = f"{post_data.title}\n\n{post_data.description}"
            if post_data.price > 0:
                message += f"\n\nPrice: ${post_data.price:.2f}"
            if post_data.location:
                message += f"\nLocation: {post_data.location}"
            
            # Basic post data
            data = {
                "message": message,
                "access_token": page_access_token
            }
            
            # Add single image if available
            if image_urls and len(image_urls) > 0:
                data["link"] = image_urls[0]  # Facebook will auto-detect images from links
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, data=data) as response:
                    response_data = await response.json()
                    
                    if response.status == 200:
                        return {
                            "success": True,
                            "post_id": response_data.get("id"),
                            "message": "Post created successfully"
                        }
                    else:
                        return {
                            "success": False,
                            "error": response_data.get("error", {}).get("message", "Unknown error")
                        }
        
        except Exception as e:
            logger.error(f"Error creating Facebook page post: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def create_marketplace_listing(
        self, 
        access_token: str, 
        post_data: PostResponse,
        image_urls: List[str] = None
    ) -> Dict[str, Any]:
        """Create a listing on Facebook Marketplace."""
        try:
            # Note: Facebook Marketplace API has strict requirements and may need approval
            url = f"{self.base_url}/me/marketplace_listings"
            
            # Prepare marketplace listing data
            listing_data = {
                "retailer_id": f"listing_{post_data.id}",
                "name": post_data.title,
                "description": post_data.description,
                "price": int(post_data.price * 100),  # Price in cents
                "currency": "USD",
                "condition": "new",  # You might want to add this to your post model
                "category": self._map_category_to_facebook(post_data.category),
                "location": {
                    "city": post_data.location,
                    "country": "US"  # You might want to make this configurable
                },
                "access_token": access_token
            }
            
            # Add images if available
            if image_urls:
                listing_data["images"] = image_urls[:10]  # Marketplace allows up to 10 images
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, data=listing_data) as response:
                    response_data = await response.json()
                    
                    if response.status == 200:
                        return {
                            "success": True,
                            "listing_id": response_data.get("id"),
                            "message": "Marketplace listing created successfully"
                        }
                    else:
                        return {
                            "success": False,
                            "error": response_data.get("error", {}).get("message", "Unknown error")
                        }
        
        except Exception as e:
            logger.error(f"Error creating Facebook Marketplace listing: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def update_page_post(
        self, 
        post_id: str, 
        page_access_token: str, 
        message: str
    ) -> Dict[str, Any]:
        """Update a Facebook page post."""
        try:
            url = f"{self.base_url}/{post_id}"
            
            data = {
                "message": message,
                "access_token": page_access_token
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, data=data) as response:
                    response_data = await response.json()
                    
                    if response.status == 200:
                        return {
                            "success": True,
                            "message": "Post updated successfully"
                        }
                    else:
                        return {
                            "success": False,
                            "error": response_data.get("error", {}).get("message", "Unknown error")
                        }
        
        except Exception as e:
            logger.error(f"Error updating Facebook post: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def delete_facebook_post(
        self, 
        post_id: str, 
        access_token: str
    ) -> Dict[str, Any]:
        """Delete a Facebook post."""
        try:
            url = f"{self.base_url}/{post_id}"
            params = {"access_token": access_token}
            
            async with aiohttp.ClientSession() as session:
                async with session.delete(url, params=params) as response:
                    if response.status == 200:
                        return {
                            "success": True,
                            "message": "Post deleted successfully"
                        }
                    else:
                        response_data = await response.json()
                        return {
                            "success": False,
                            "error": response_data.get("error", {}).get("message", "Unknown error")
                        }
        
        except Exception as e:
            logger.error(f"Error deleting Facebook post: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def get_post_insights(
        self, 
        post_id: str, 
        access_token: str
    ) -> Dict[str, Any]:
        """Get insights/metrics for a Facebook post."""
        try:
            url = f"{self.base_url}/{post_id}/insights"
            params = {
                "access_token": access_token,
                "metric": "post_impressions,post_engaged_users,post_clicks"
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        return {
                            "success": True,
                            "insights": data.get("data", [])
                        }
                    else:
                        response_data = await response.json()
                        return {
                            "success": False,
                            "error": response_data.get("error", {}).get("message", "Unknown error")
                        }
        
        except Exception as e:
            logger.error(f"Error getting post insights: {str(e)}")
            return {"success": False, "error": str(e)}
    
    def _map_category_to_facebook(self, category: str) -> str:
        """Map internal categories to Facebook Marketplace categories."""
        mapping = {
            "electronics": "ELECTRONICS",
            "clothing": "APPAREL",
            "home": "HOME_GOODS",
            "automotive": "VEHICLES",
            "books": "ENTERTAINMENT",
            "sports": "SPORTING_GOODS",
            "other": "OTHER"
        }
        return mapping.get(category.lower(), "OTHER")
    
    async def get_page_conversations(
        self, 
        page_id: str, 
        page_access_token: str
    ) -> List[Dict[str, Any]]:
        """Get conversations for auto-reply feature."""
        try:
            url = f"{self.base_url}/{page_id}/conversations"
            params = {
                "access_token": page_access_token,
                "fields": "id,updated_time,message_count,participants"
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get("data", [])
                    else:
                        logger.error(f"Failed to get conversations: {response.status}")
                        return []
        
        except Exception as e:
            logger.error(f"Error getting conversations: {str(e)}")
            return []
    
    async def send_message(
        self, 
        conversation_id: str, 
        message: str, 
        page_access_token: str
    ) -> Dict[str, Any]:
        """Send a message in a conversation (auto-reply)."""
        try:
            url = f"{self.base_url}/{conversation_id}/messages"
            
            data = {
                "message": message,
                "access_token": page_access_token
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, data=data) as response:
                    response_data = await response.json()
                    
                    if response.status == 200:
                        return {
                            "success": True,
                            "message_id": response_data.get("id"),
                            "message": "Message sent successfully"
                        }
                    else:
                        return {
                            "success": False,
                            "error": response_data.get("error", {}).get("message", "Unknown error")
                        }
        
        except Exception as e:
            logger.error(f"Error sending message: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def create_post(self, message: str, access_token: str) -> Dict[str, Any]:
        """
        Simple method to create a post (mock implementation for testing).
        In production, this should post to a real Facebook page.
        """
        try:
            # For now, simulate a successful Facebook post
            # In production, you would:
            # 1. Get the user's pages
            # 2. Select the appropriate page
            # 3. Use create_page_post method
            
            logger.info(f"Simulating Facebook post: {message[:50]}...")
            
            # Generate a mock Facebook post ID
            import uuid
            mock_post_id = f"fb_{uuid.uuid4().hex[:16]}"
            
            return {
                "id": mock_post_id,
                "success": True,
                "message": "Post created successfully (simulated)"
            }
            
        except Exception as e:
            logger.error(f"Error creating post: {str(e)}")
            return None