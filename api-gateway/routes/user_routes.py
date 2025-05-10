import os
import logging
from fastapi import APIRouter, Request
from utils.proxy_request import proxy_request

# Configure logging
logger = logging.getLogger("api_gateway")

# Load environment variables
USER_SERVICE_URL = os.getenv("USER_SERVICE_URL", "http://user-service:3001")

router = APIRouter(tags=["Users"])

# Special Routes
@router.get("/users/profile")
async def get_user_profile(request: Request):
    """
    Route profile requests to the user service endpoint.
    """
    logger.info("Routing user profile request to user service")
    return await proxy_request(request, f"{USER_SERVICE_URL}/users/profile")

# User Routes
@router.api_route("/users/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def user_service_routes(request: Request, path: str):
    """
    Proxy all user-related requests to the user service.
    
    Args:
        request: The original FastAPI request
        path: The path parameter that will be appended to the base endpoint
        
    Returns:
        Response from the user service
    """
    logger.info(f"Routing user request to: {path}")
    return await proxy_request(request, f"{USER_SERVICE_URL}/users/{path}")

# Auth Routes - Map to the correct endpoints in user service
@router.post("/auth/login")
async def auth_login(request: Request):
    """
    Route login requests to the user service login endpoint.
    """
    logger.info("Routing login request to user service")
    return await proxy_request(request, f"{USER_SERVICE_URL}/users/login")

@router.post("/auth/register")
async def auth_register(request: Request):
    """
    Route register requests to the user service register endpoint.
    """
    logger.info("Routing register request to user service")
    return await proxy_request(request, f"{USER_SERVICE_URL}/users/register")

@router.post("/auth/forgot-password")
async def auth_forgot_password(request: Request):
    """
    Route forgot-password requests to the user service endpoint.
    """
    logger.info("Routing forgot-password request to user service")
    return await proxy_request(request, f"{USER_SERVICE_URL}/users/forgot-password")

# Fallback for other auth routes
@router.api_route("/auth/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def auth_routes(request: Request, path: str):
    """
    Proxy all other authentication-related requests to the user service.
    
    Args:
        request: The original FastAPI request
        path: The path parameter that will be appended to the base endpoint
        
    Returns:
        Response from the user service
    """
    logger.info(f"Routing auth request to: {path}")
    return await proxy_request(request, f"{USER_SERVICE_URL}/users/{path}") 