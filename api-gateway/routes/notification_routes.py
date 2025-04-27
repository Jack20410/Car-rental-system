import os
import logging
from fastapi import APIRouter, Request
from utils.proxy_request import proxy_request

# Configure logging
logger = logging.getLogger("api_gateway")

# Load environment variables
NOTIFICATION_SERVICE_URL = os.getenv("NOTIFICATION_SERVICE_URL", "http://notification-service:3005")

router = APIRouter(prefix="/api", tags=["Notifications"])

# Notification Routes
@router.api_route("/notifications/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def notification_service_routes(request: Request, path: str):
    logger.info(f"Routing notification request to: {path}")
    return await proxy_request(request, f"{NOTIFICATION_SERVICE_URL}/api/notifications/{path}") 