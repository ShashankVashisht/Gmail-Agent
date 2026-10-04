from fastapi import APIRouter

from app.api.v1.routes import health
from app.auth.router import router as auth_router
from app.chat.router import router as chat_router
from app.gmail.router import router as gmail_router

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth_router)
api_router.include_router(chat_router)
api_router.include_router(gmail_router)