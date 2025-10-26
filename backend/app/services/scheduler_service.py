"""
Scheduling service using APScheduler for post automation.
"""
import asyncio
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.date import DateTrigger
from apscheduler.jobstores.memory import MemoryJobStore
from apscheduler.executors.asyncio import AsyncIOExecutor
import logging

from app.services.post_service import PostService
from app.services.external.facebook_service import FacebookService
from app.models.post import PostStatus

logger = logging.getLogger(__name__)


class SchedulerService:
    """Service for managing post scheduling."""
    
    def __init__(self):
        self.scheduler: AsyncIOScheduler = None
        self.post_service = PostService()
        self.facebook_service = FacebookService()
        self._setup_scheduler()
    
    def _setup_scheduler(self):
        """Initialize the APScheduler."""
        jobstores = {
            'default': MemoryJobStore()
        }
        executors = {
            'default': AsyncIOExecutor()
        }
        job_defaults = {
            'coalesce': False,
            'max_instances': 3
        }
        
        self.scheduler = AsyncIOScheduler(
            jobstores=jobstores,
            executors=executors,
            job_defaults=job_defaults,
            timezone='UTC'
        )
    
    async def start_scheduler(self):
        """Start the scheduler."""
        try:
            self.scheduler.start()
            logger.info("Scheduler started successfully")
            
            # Schedule recurring job to check for ready posts
            self.scheduler.add_job(
                self._process_scheduled_posts,
                'interval',
                minutes=1,  # Check every minute
                id='process_scheduled_posts',
                replace_existing=True
            )
            
        except Exception as e:
            logger.error(f"Failed to start scheduler: {str(e)}")
            raise
    
    async def stop_scheduler(self):
        """Stop the scheduler."""
        try:
            if self.scheduler and self.scheduler.running:
                self.scheduler.shutdown(wait=True)
                logger.info("Scheduler stopped successfully")
        except Exception as e:
            logger.error(f"Error stopping scheduler: {str(e)}")
    
    async def schedule_post_publication(
        self, 
        post_id: str, 
        scheduled_at: datetime,
        facebook_access_token: str = None
    ) -> bool:
        """Schedule a post for publication."""
        try:
            # Create job ID
            job_id = f"publish_post_{post_id}"
            
            # Remove existing job if it exists
            if self.scheduler.get_job(job_id):
                self.scheduler.remove_job(job_id)
            
            # Schedule new job
            self.scheduler.add_job(
                self._publish_post,
                DateTrigger(run_date=scheduled_at),
                args=[post_id, facebook_access_token],
                id=job_id,
                replace_existing=True
            )
            
            logger.info(f"Scheduled post {post_id} for publication at {scheduled_at}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to schedule post {post_id}: {str(e)}")
            return False
    
    async def cancel_scheduled_post(self, post_id: str) -> bool:
        """Cancel a scheduled post."""
        try:
            job_id = f"publish_post_{post_id}"
            
            if self.scheduler.get_job(job_id):
                self.scheduler.remove_job(job_id)
                logger.info(f"Cancelled scheduled post {post_id}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Failed to cancel scheduled post {post_id}: {str(e)}")
            return False
    
    async def _publish_post(self, post_id: str, facebook_access_token: str = None):
        """Publish a scheduled post."""
        try:
            logger.info(f"Publishing scheduled post {post_id}")
            
            # Get the post
            post = await self.post_service.get_post_by_id(post_id)
            if not post:
                logger.error(f"Post {post_id} not found for publication")
                return
            
            # Post to Facebook first (before updating status)
            facebook_post_id = None
            if facebook_access_token:
                access_token = facebook_access_token
            else:
                # Try to get from settings/config
                from app.core.config import settings
                access_token = settings.FACEBOOK_ACCESS_TOKEN
            
            if access_token:
                try:
                    facebook_result = await self._post_to_facebook(post, access_token)
                    if facebook_result:
                        facebook_post_id = facebook_result.get('id')
                        logger.info(f"Posted to Facebook successfully: {facebook_post_id}")
                    else:
                        logger.warning(f"Failed to post to Facebook for post {post_id}")
                except Exception as e:
                    logger.error(f"Facebook posting failed for post {post_id}: {str(e)}")
            else:
                logger.warning(f"No Facebook access token available for post {post_id}")
            
            # Update post status to published and set facebook_post_id if available
            from app.models.post import PostUpdate
            update_data = PostUpdate(
                status=PostStatus.PUBLISHED,
                facebook_post_id=facebook_post_id
            )
            await self.post_service.update_post(post_id, update_data)
            
            logger.info(f"Successfully published post {post_id}")
            
        except Exception as e:
            logger.error(f"Failed to publish post {post_id}: {str(e)}")
    
    async def _post_to_facebook(self, post, access_token: str):
        """Post content to Facebook."""
        try:
            # Prepare Facebook post content
            message = f"{post.title}\n\n{post.description}\n\nPrice: ${post.price}\nLocation: {post.location}"
            
            # Post to Facebook
            result = await self.facebook_service.create_post(
                message=message,
                access_token=access_token
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Error posting to Facebook: {str(e)}")
            return None
    
    async def _process_scheduled_posts(self):
        """Process posts that are ready for publication (fallback mechanism)."""
        try:
            # Get scheduled posts that are due
            scheduled_posts = await self.post_service.get_scheduled_posts()
            
            for post in scheduled_posts:
                # Check if there's already a scheduled job for this post
                job_id = f"publish_post_{post.id}"
                if not self.scheduler.get_job(job_id):
                    # No scheduled job found, publish immediately
                    await self._publish_post(post.id)
            
        except Exception as e:
            logger.error(f"Error processing scheduled posts: {str(e)}")
    
    def get_scheduled_jobs(self) -> list:
        """Get list of scheduled jobs."""
        try:
            jobs = []
            for job in self.scheduler.get_jobs():
                if job.id.startswith('publish_post_'):
                    post_id = job.id.replace('publish_post_', '')
                    jobs.append({
                        'post_id': post_id,
                        'scheduled_at': job.next_run_time,
                        'job_id': job.id
                    })
            return jobs
        except Exception as e:
            logger.error(f"Error getting scheduled jobs: {str(e)}")
            return []


# Global scheduler instance
scheduler_service = SchedulerService()