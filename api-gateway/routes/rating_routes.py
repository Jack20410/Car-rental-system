import os
import logging
from fastapi import APIRouter, Request
from utils.proxy_request import proxy_request

logger = logging.getLogger("api_gateway")

RATING_SERVICE_URL = os.getenv("RATING_SERVICE_URL", "http://rating-service:3008")

router = APIRouter(tags=["Ratings"])

@router.api_route("/ratings", methods=["GET", "POST"])
async def rating_service_root(request: Request):
    logger.info("Routing rating root request")
    return await proxy_request(request, f"{RATING_SERVICE_URL}/")

# Add specific route for user ratings
@router.api_route("/ratings/user/{user_id}", methods=["GET"])
async def rating_service_user_ratings(request: Request, user_id: str):
    logger.info(f"Routing rating request for user: {user_id}")
    return await proxy_request(request, f"{RATING_SERVICE_URL}/user/{user_id}")

@router.api_route("/ratings/{path:path}", methods=["GET", "DELETE"])
@router.api_route("/ratings/{path:path}", methods=["GET", "PUT", "DELETE"])
async def rating_service_routes(request: Request, path: str):
    logger.info(f"Routing rating request to: {path}")
    return await proxy_request(request, f"{RATING_SERVICE_URL}/{path}")