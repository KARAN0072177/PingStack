from fastapi import APIRouter

from database.connection import db
from models.monitor import MonitorCreate

router = APIRouter()


@router.post("/api/monitors")
async def create_monitor(monitor: MonitorCreate):
    monitor_data = monitor.model_dump(mode="json")

    result = await db.monitors.insert_one(monitor_data)
    monitor_data["_id"] = str(result.inserted_id)

    return {
        "message": "Monitor created",
        "id": str(result.inserted_id),
        "monitor": monitor_data,
    }

@router.get("/api/monitors")
async def get_monitors():
    monitors = await db.monitors.find().to_list(length=None)

    for monitor in monitors:
        monitor["_id"] = str(monitor["_id"])

    return monitors