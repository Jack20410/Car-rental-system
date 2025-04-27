import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

# Import middleware
from middleware import RequestLoggingMiddleware, AuthMiddleware, RateLimitMiddleware

# Import route modules
from routes import (
    user_router,
    vehicle_router,
    health_router
)

# Import utility functions
from utils.proxy_request import close_http_client

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("api_gateway")

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Car Rental API Gateway",
    description="API Gateway for Car Rental Microservices",
    version="1.0.0"
)

# Configure CORS
origins = [os.getenv("FRONTEND_URL", "http://frontend:4000")]
if "ADDITIONAL_CORS_ORIGINS" in os.environ:
    origins.extend(os.getenv("ADDITIONAL_CORS_ORIGINS").split(","))

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for static files
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add custom middleware
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(AuthMiddleware)
app.add_middleware(RateLimitMiddleware, max_requests=100, window_size=60)

# Check if uploads directory exists
uploads_dir = "/app/uploads"
if os.path.exists(uploads_dir):
    logger.info(f"Mounting uploads directory: {uploads_dir}")
    # List contents for debugging
    logger.info(f"Contents of {uploads_dir}: {os.listdir(uploads_dir)}")
    # Serve static files from uploads directory
    app.mount("/uploads", StaticFiles(directory=uploads_dir, html=True), name="uploads")
else:
    logger.error(f"Uploads directory {uploads_dir} not found!")

# Include routers
app.include_router(health_router)
app.include_router(user_router)
app.include_router(vehicle_router)

@app.on_event("shutdown")
async def shutdown_event():
    await close_http_client()

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "3000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True) 