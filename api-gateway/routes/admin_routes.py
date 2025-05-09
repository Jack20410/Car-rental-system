import os
import logging
from fastapi import APIRouter, Request
from utils.proxy_request import proxy_request

# Configure logging
logger = logging.getLogger("api_gateway")

# Load environment variables
ADMIN_SERVICE_URL = os.getenv("ADMIN_SERVICE_URL", "http://admin-service:3006")

router = APIRouter(prefix="/api", tags=["Admin"])

# Debug route
@router.get("/admin/debug")
async def admin_debug(request: Request):
    logger.info(f"Routing to admin debug endpoint")
    return await proxy_request(request, f"{ADMIN_SERVICE_URL}/debug")

# Admin Routes
@router.api_route("/admin/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def admin_service_routes(request: Request, path: str):
    logger.info(f"Routing admin request to: {path}")
    return await proxy_request(request, f"{ADMIN_SERVICE_URL}/api/admin/{path}") 