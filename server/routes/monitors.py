import time

import httpx
from bson import ObjectId

from fastapi import APIRouter, HTTPException

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

@router.get("/api/monitors/{monitor_id}/check")
async def check_monitor(monitor_id: str):
    if not ObjectId.is_valid(monitor_id):
        raise HTTPException(status_code=400, detail="Invalid monitor ID")

    monitor = await db.monitors.find_one({
        "_id": ObjectId(monitor_id)
    })

    if not monitor:
        raise HTTPException(status_code=404, detail="Monitor not found")

    start_time = time.perf_counter()

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(str(monitor["url"]))

        response_time_ms = round(
            (time.perf_counter() - start_time) * 1000,
            2
        )

        return {
            "monitor": monitor["name"],
            "status": "healthy" if response.is_success else "unhealthy",
            "status_code": response.status_code,
            "response_time_ms": response_time_ms
        }

    except httpx.RequestError:
        response_time_ms = round(
            (time.perf_counter() - start_time) * 1000,
            2
        )

        return {
            "monitor": monitor["name"],
            "status": "unreachable",
            "status_code": None,
            "response_time_ms": response_time_ms
        }