import httpx
import logging
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
    
    # Get the request headers
    headers = dict(request.headers)
    headers.pop("host", None)  # Remove host header to avoid conflicts
    
    # Get the request body
    body = await request.body()
    
    # Get the query parameters
    params = dict(request.query_params)
    
    logger.debug(f"Proxying request to: {destination_url}")
    
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
        raise HTTPException(status_code=503, detail=f"Service unavailable: {str(exc)}")
    except Exception as exc:
        logger.error(f"Unexpected error when proxying to {destination_url}: {str(exc)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(exc)}") 