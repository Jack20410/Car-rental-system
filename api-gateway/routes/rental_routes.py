import os
import logging
from fastapi import APIRouter, Request
from utils.proxy_request import proxy_request

# Configure logging
logger = logging.getLogger("api_gateway")

# Load environment variables
RENTAL_SERVICE_URL = os.getenv("RENTAL_SERVICE_URL", "http://rental-service:3003")

# Create router without prefix
router = APIRouter(tags=["Rentals"])

# Availability endpoint
@router.get("/rentals/availability")
async def check_rental_availability(request: Request):
    """Handle rental availability check requests"""
    logger.info("Routing rental availability request")
    target_url = f"{RENTAL_SERVICE_URL}/rentals/availability"
    logger.info(f"Proxying to: {target_url}")
    return await proxy_request(request, target_url)

# General rental routes
@router.api_route("/rentals/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def rental_service_routes(request: Request, path: str):
    """Handle all other rental-related requests"""
    logger.info(f"Routing rental request to path: {path}")
    target_url = f"{RENTAL_SERVICE_URL}/rentals/{path}"
    logger.info(f"Proxying to: {target_url}")
    return await proxy_request(request, target_url) 