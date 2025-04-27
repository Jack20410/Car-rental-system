import os
import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.responses import JSONResponse
from collections import defaultdict
from datetime import datetime, timedelta

logger = logging.getLogger("api_gateway")


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Middleware for rate limiting requests by IP address."""
    
    def __init__(
        self, 
        app, 
        max_requests=None, 
        window_size=None
    ):
        """
        Initialize the rate limiter.
        
        Args:
            app: FastAPI application
            max_requests: Maximum number of requests allowed in the window
            window_size: Time window in seconds
        """
        super().__init__(app)
        # Use env vars if available, otherwise use defaults or passed values
        self.max_requests = max_requests or int(os.getenv("RATE_LIMIT_MAX_REQUESTS", 100))
        self.window_size = window_size or int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", 60))
        
        logger.info(f"Rate limit configured: {self.max_requests} requests per {self.window_size} seconds")
        
        self.request_counts = defaultdict(list)
        # Dictionary to track when we last warned about an IP exceeding the rate limit
        # to prevent log spam
        self.last_warning = {}
    
    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for certain paths, like health checks
        if request.url.path in ["/api/health", "/"]:
            return await call_next(request)
            
        # Get client IP
        client_ip = request.client.host if request.client else "unknown"
        
        # Get current time
        now = datetime.now()
        
        # Clean up old entries from the window
        self.request_counts[client_ip] = [
            timestamp for timestamp in self.request_counts[client_ip]
            if timestamp > now - timedelta(seconds=self.window_size)
        ]
        
        # Check if the IP has exceeded the rate limit
        if len(self.request_counts[client_ip]) >= self.max_requests:
            # Only log a warning once per minute per IP to avoid log spam
            if (client_ip not in self.last_warning or 
                now - self.last_warning[client_ip] > timedelta(minutes=1)):
                logger.warning(f"Rate limit exceeded for IP: {client_ip}")
                self.last_warning[client_ip] = now
                
            # Return a 429 response with Retry-After header
            headers = {"Retry-After": str(self.window_size)}
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Too many requests. Please try again later.",
                    "limit": self.max_requests,
                    "window_seconds": self.window_size
                },
                headers=headers
            )
        
        # Add current timestamp to the request counts
        self.request_counts[client_ip].append(now)
        
        # Process the request
        return await call_next(request) 