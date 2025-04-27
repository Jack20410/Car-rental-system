import os
import time
import logging
import json
import uuid
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

# Get log level from environment with default to INFO
log_level_name = os.getenv("LOG_LEVEL", "INFO").upper()
log_level = getattr(logging, log_level_name, logging.INFO)

# Configure logger
logging.basicConfig(
    level=log_level,
    format="%(asctime)s - %(levelname)s - [%(name)s] %(message)s",
)
logger = logging.getLogger("api_gateway")
logger.setLevel(log_level)
logger.info(f"Logger initialized with level: {log_level_name}")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for logging requests and their processing time."""
    
    def __init__(self, app):
        super().__init__(app)
        # Define paths that should have minimal logging to reduce noise
        self.minimal_logging_paths = ["/api/health", "/"]
    
    async def dispatch(self, request: Request, call_next):
        # Generate a unique request ID
        request_id = str(uuid.uuid4())
        
        # Add the request ID to the request state
        request.state.request_id = request_id
        
        start_time = time.time()
        
        # Get client IP and request details
        client_host = request.client.host if request.client else "unknown"
        request_details = f"{request.method} {request.url.path}"
        path = request.url.path
        
        # Determine log level based on path
        is_health_check = any(path.startswith(p) for p in self.minimal_logging_paths)
        log_func = logger.debug if is_health_check else logger.info
        
        # Create structured log entry
        log_data = {
            "request_id": request_id,
            "method": request.method,
            "path": path,
            "client_ip": client_host,
            "client_agent": request.headers.get("user-agent", "unknown")
        }
        
        # Log the incoming request
        log_func(f"Request started: {request_details} from {client_host} [{request_id}]")
        
        try:
            # Process the request
            response = await call_next(request)
            
            # Calculate processing time
            process_time = (time.time() - start_time) * 1000
            
            # Update log data with response info
            log_data.update({
                "status_code": response.status_code,
                "processing_time_ms": round(process_time, 2)
            })
            
            # Log based on status code
            if response.status_code >= 500:
                logger.error(f"Request failed: {request_details} - Status: {response.status_code} - [{request_id}] - {process_time:.2f}ms")
            elif response.status_code >= 400:
                logger.warning(f"Request error: {request_details} - Status: {response.status_code} - [{request_id}] - {process_time:.2f}ms")
            else:
                log_func(f"Request completed: {request_details} - Status: {response.status_code} - [{request_id}] - {process_time:.2f}ms")
            
            # Add request ID to response headers for tracking
            response.headers["X-Request-ID"] = request_id
            
            return response
            
        except Exception as e:
            # Log exceptions
            process_time = (time.time() - start_time) * 1000
            logger.error(f"Request exception: {request_details} - {str(e)} - [{request_id}] - {process_time:.2f}ms", exc_info=True)
            raise 