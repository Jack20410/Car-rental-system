import httpx
import logging
import os
from fastapi import Request, HTTPException
from starlette.responses import Response

# Configure logging
logger = logging.getLogger("api_gateway")

# HTTP client for making requests to microservices
http_client = httpx.AsyncClient(timeout=30.0)

async def close_http_client():
    await http_client.aclose()

async def proxy_request(request: Request, destination_url: str):
    """
    Forward a request to a microservice and return the response.
    
    Args:
        request: The original FastAPI request
        destination_url: The URL of the microservice to forward the request to
        
    Returns:
        The response from the microservice
    """
    # Get the request method
    method = request.method
    
    # Get origin from request headers
    origin = request.headers.get("origin", "*")
    
    # Get the request headers
    headers = dict(request.headers)
    headers.pop("host", None)  # Remove host header to avoid conflicts
    
    # Get the request body
    body = await request.body()
    
    # Get the query parameters
    params = dict(request.query_params)
    
    logger.debug(f"Proxying request to: {destination_url}, origin: {origin}")
    
    try:
        # Forward the request to the appropriate microservice
        response = await http_client.request(
            method=method,
            url=destination_url,
            headers=headers,
            params=params,
            content=body
        )
        
        # Copy response headers, excluding ones that would cause issues
        response_headers = {}
        for name, value in response.headers.items():
            if name.lower() not in ("content-encoding", "transfer-encoding", "content-length"):
                response_headers[name] = value
        
        # Add CORS headers to the response
        # Get configured origins from environment
        origins = [
            "http://localhost:4000",
            "http://127.0.0.1:4000",
        ]
        
        # Add frontend URL if available
        if "FRONTEND_URL" in os.environ:
            origins.append(os.environ.get("FRONTEND_URL"))
            
        # Add additional origins if available
        if "ADDITIONAL_CORS_ORIGINS" in os.environ:
            additional_origins = os.environ.get("ADDITIONAL_CORS_ORIGINS").split(",")
            origins.extend([o.strip() for o in additional_origins])
        
        # Check if the origin is in allowed origins, otherwise use wildcard
        if origin in origins:
            response_headers["Access-Control-Allow-Origin"] = origin
        else:
            # In development, we're more permissive
            if os.environ.get("ENVIRONMENT", "development").lower() == "development":
                response_headers["Access-Control-Allow-Origin"] = origin
            else:
                response_headers["Access-Control-Allow-Origin"] = origins[0]  # Default to first origin
        
        # Add other CORS headers
        response_headers["Access-Control-Allow-Credentials"] = "true"
        response_headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, PATCH, OPTIONS"
        response_headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Accept, Origin, X-Requested-With"
        response_headers["Access-Control-Expose-Headers"] = "Content-Length"
        
        logger.debug(f"Response from {destination_url}: Status {response.status_code}")
        
        # Return the response from the microservice
        return Response(
            content=response.content,
            status_code=response.status_code,
            headers=response_headers,
            media_type=response.headers.get("content-type")
        )
    except httpx.RequestError as exc:
        logger.error(f"Request error when connecting to {destination_url}: {str(exc)}")
        
        # Return error response with CORS headers
        error_headers = {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept, Origin, X-Requested-With"
        }
        
        return Response(
            content={"detail": f"Service unavailable: {str(exc)}"}.encode("utf-8"),
            status_code=503,
            headers=error_headers,
            media_type="application/json"
        )
    except Exception as exc:
        logger.error(f"Unexpected error when proxying to {destination_url}: {str(exc)}", exc_info=True)
        
        # Return error response with CORS headers
        error_headers = {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept, Origin, X-Requested-With"
        }
        
        return Response(
            content={"detail": f"Internal server error: {str(exc)}"}.encode("utf-8"),
            status_code=500,
            headers=error_headers,
            media_type="application/json"
        ) 