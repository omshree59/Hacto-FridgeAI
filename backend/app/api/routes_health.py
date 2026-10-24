from fastapi import APIRouter
from backend.app.core.config import settings
from backend.app.services.ollama_service import ollama_service

router = APIRouter()


@router.get("/health", tags=["Health"])
async def get_health():
    return {
        "status": "healthy",
        "app_name": settings.PROJECT_NAME,
        "version": settings.VERSION,
    }


@router.get("/ai/status", tags=["AI"])
async def get_ai_status():
    status_info = await ollama_service.check_health()
    # Check vision capability if model is listed
    if status_info.get("vision_model_installed"):
        cap = await ollama_service.verify_model_capability(settings.OLLAMA_VISION_MODEL)
        status_info["vision_capability"] = cap
    else:
        status_info["vision_capability"] = {
            "model": settings.OLLAMA_VISION_MODEL,
            "supports_vision": False,
            "error": "Model not installed or verified",
            "verified": False
        }
    return status_info
