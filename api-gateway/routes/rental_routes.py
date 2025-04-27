import os
import logging
from fastapi import APIRouter, Request
from utils.proxy_request import proxy_request

# Configure logging
logger = logging.getLogger("api_gateway")

# Load environment variables
RENTAL_SERVICE_URL = os.getenv("RENTAL_SERVICE_URL", "http://rental-service:3003")

router = APIRouter(prefix="/api", tags=["Rentals"])

# Rental Routes
@router.api_route("/rentals/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def rental_service_routes(request: Request, path: str):
    logger.info(f"Routing rental request to: {path}")
    return await proxy_request(request, f"{RENTAL_SERVICE_URL}/api/rentals/{path}") 