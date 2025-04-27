from fastapi import APIRouter

from .user_routes import router as user_router
from .vehicle_routes import router as vehicle_router
from .rental_routes import router as rental_router
from .payment_routes import router as payment_router
from .notification_routes import router as notification_router
from .admin_routes import router as admin_router
from .support_routes import router as support_router
from .health_routes import router as health_router

__all__ = [
    "user_router",
    "vehicle_router",
    "rental_router",
    "payment_router",
    "notification_router",
    "admin_router",
    "support_router",
    "health_router"
] 