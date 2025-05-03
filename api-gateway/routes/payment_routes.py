import os
import logging
from fastapi import APIRouter, Request
from utils.proxy_request import proxy_request

# Configure logging
logger = logging.getLogger("api_gateway")

# Load environment variables
PAYMENT_SERVICE_URL = os.getenv("PAYMENT_SERVICE_URL", "http://payment-service:3004")

router = APIRouter(tags=["Payments"])

# Payment Routes
@router.api_route("/payments/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def payment_service_routes(request: Request, path: str):
    logger.info(f"Routing payment request to: {path}")
    return await proxy_request(request, f"{PAYMENT_SERVICE_URL}/payments/{path}") 