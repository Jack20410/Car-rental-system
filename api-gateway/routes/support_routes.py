import os
import logging
from fastapi import APIRouter, Request
from utils.proxy_request import proxy_request

# Configure logging
logger = logging.getLogger("api_gateway")

# Load environment variables
SUPPORT_SERVICE_URL = os.getenv("SUPPORT_SERVICE_URL", "http://support-service:3007")

router = APIRouter(prefix="/api", tags=["Support"])

# Support Routes
@router.api_route("/support/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def support_service_routes(request: Request, path: str):
    logger.info(f"Routing support request to: {path}")
    return await proxy_request(request, f"{SUPPORT_SERVICE_URL}/api/support/{path}")