import os
import logging
from fastapi import APIRouter
from fastapi.responses import JSONResponse, FileResponse
from datetime import datetime

# Configure logging
logger = logging.getLogger("api_gateway")

router = APIRouter(tags=["Health"])

@router.get("/api/health")
async def health_check():
    """
    Health check endpoint to verify the API gateway is running.
    """
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "service": "api-gateway"
    }

@router.get("/api/check-file/{file_path:path}")
async def check_file(file_path: str):
    """
    Check if a file exists and return its information.
    """
    # Check for directory traversal attacks
    if '..' in file_path:
        return JSONResponse(
            status_code=400,
            content={"error": "Invalid file path"}
        )
    
    # Construct the full path
    full_path = f"/app/{file_path}"
    
    logger.info(f"Checking file: {full_path}")
    
    if os.path.exists(full_path):
        file_info = {
            "exists": True,
            "path": full_path,
            "size": os.path.getsize(full_path),
            "is_file": os.path.isfile(full_path),
            "is_directory": os.path.isdir(full_path)
        }
        
        # If it's a directory, list contents
        if os.path.isdir(full_path):
            file_info["contents"] = os.listdir(full_path)
            
        return file_info
    else:
        return {"exists": False, "path": full_path}

@router.get("/api/serve-file/{file_path:path}")
async def serve_file(file_path: str):
    """
    Directly serve a file from the filesystem.
    """
    # Check for directory traversal attacks
    if '..' in file_path:
        return JSONResponse(
            status_code=400,
            content={"error": "Invalid file path"}
        )
    
    # Construct the full path
    full_path = f"/app/{file_path}"
    
    logger.info(f"Serving file: {full_path}")
    
    if os.path.exists(full_path) and os.path.isfile(full_path):
        return FileResponse(path=full_path)
    else:
        return JSONResponse(
            status_code=404,
            content={"error": f"File not found: {file_path}"}
        ) 