from fastapi import APIRouter

from database.connection import db

router = APIRouter()


@router.get("/api/health")
async def health_check():
    result = await db.command("ping")

    return {
        "status": "healthy",
        "database": "connected" if result["ok"] == 1 else "disconnected"
    }