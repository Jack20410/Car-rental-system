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
@router.api_route("/vehicles", methods=["GET", "POST", "PATCH"])
async def vehicle_service_root(request: Request):
    logger.info("Routing vehicle root request")
    return await proxy_request(request, f"{VEHICLE_SERVICE_URL}/vehicles")

@router.api_route("/vehicles/{path:path}", methods=["GET", "POST", "DELETE", "PATCH"])
async def vehicle_service_routes(request: Request, path: str):
    logger.info(f"Routing vehicle request to: {path}")
    return await proxy_request(request, f"{VEHICLE_SERVICE_URL}/vehicles/{path}")