from fastapi import APIRouter

from models.monitor import MonitorCreate

router = APIRouter()


@router.post("/api/monitors")
async def create_monitor(monitor: MonitorCreate):
    return {
        "message": "Monitor received",
        "monitor": monitor
    }