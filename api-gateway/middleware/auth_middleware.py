import os
import logging
import re
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.responses import JSONResponse

logger = logging.getLogger("api_gateway")


class AuthMiddleware(BaseHTTPMiddleware):
    """Middleware for token validation and authentication."""
    
    def __init__(self, app):
        super().__init__(app)
        # Public paths that don't require authentication, can be extended with env var
        self.public_paths = [
            "/",
            "/health",
            "/info",
            "/auth/login",
            "/auth/register",
            "/auth/forgot-password",
            "/vehicles",
            "/rentals/availability",
            "/uploads",
            "/api/health",
            "/api/check-file",
            "/api/serve-file",
        ]
        
        # Add additional public paths from environment variable if defined
        additional_paths = os.getenv("PUBLIC_API_PATHS", "")
        if additional_paths:
            self.public_paths.extend(additional_paths.split(","))
            
        logger.info(f"Auth middleware initialized with {len(self.public_paths)} public paths")
    
    def is_public_path(self, path):
        """Check if a path is public (doesn't require auth)"""
        # Exact matches
        if path in self.public_paths:
            return True
            
        # Path prefixes (for /vehicles/*, /uploads/*, etc.)
        for public_path in self.public_paths:
            if path.startswith(public_path + "/") or path.startswith(public_path):
                return True
                
        # Specific path patterns with regex
        vehicle_pattern = r"^/vehicles/\d+$"
        if re.match(vehicle_pattern, path):
            return True
            
        return False
    
    async def dispatch(self, request: Request, call_next):
        # Get the complete request path
        path = request.url.path
        
        # Skip auth for OPTIONS requests (CORS preflight)
        if request.method == "OPTIONS":
            return await call_next(request)
        
        # Check if the path is public
        if self.is_public_path(path):
            return await call_next(request)
        
        # Get the authorization header
        auth_header = request.headers.get("Authorization")
        
        # If no authorization header is present for protected routes, return 401
        if not auth_header:
            logger.warning(f"Unauthorized access attempt: {path}")
            return JSONResponse(
                status_code=401,
                content={"detail": "Authentication required"}
            )
        
        # Pass the auth header to the microservice for validation
        # The actual token validation will be done by the user service
        return await call_next(request) 