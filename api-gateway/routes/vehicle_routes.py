import os
import logging
from fastapi import APIRouter, Request
from utils.proxy_request import proxy_request

# Configure logging
logger = logging.getLogger("api_gateway")

# Load environment variables
VEHICLE_SERVICE_URL = os.getenv("VEHICLE_SERVICE_URL", "http://vehicle-service:3002")

router = APIRouter(tags=["Vehicles"])

# Vehicle Routes
@router.api_route("/vehicles/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def vehicle_service_routes(request: Request, path: str):
    """
    Proxy all vehicle-related requests to the vehicle service.
    
    Args:
        request: The original FastAPI request
        path: The path parameter that will be appended to the base endpoint
        
    Returns:
        Response from the vehicle service
    """
    logger.info(f"Routing vehicle request to: {path}")
    return await proxy_request(request, f"{VEHICLE_SERVICE_URL}/api/vehicles/{path}")