from datetime import datetime, timezone

import time

import httpx
from bson import ObjectId

from fastapi import APIRouter, HTTPException

from database.connection import db
from models.monitor import MonitorCreate

from models.health_check import HealthCheckResponse

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

        status = "healthy" if response.is_success else "unhealthy"

        health_check = {
            "monitor_id": monitor["_id"],
            "status": status,
            "status_code": response.status_code,
            "response_time_ms": response_time_ms,
            "checked_at": datetime.now(timezone.utc),
        }

        await db.health_checks.insert_one(health_check)

        return {
            "monitor": monitor["name"],
            "status": status,
            "status_code": response.status_code,
            "response_time_ms": response_time_ms,
        }

    except httpx.RequestError:
        response_time_ms = round(
            (time.perf_counter() - start_time) * 1000,
            2
        )

        health_check = {
            "monitor_id": monitor["_id"],
            "status": "unreachable",
            "status_code": None,
            "response_time_ms": response_time_ms,
            "checked_at": datetime.now(timezone.utc),
        }

        await db.health_checks.insert_one(health_check)

        return {
            "monitor": monitor["name"],
            "status": "unreachable",
            "status_code": None,
            "response_time_ms": response_time_ms,
        }


@router.get(
    "/api/monitors/{monitor_id}/history",
    response_model=list[HealthCheckResponse],
)
async def get_monitor_history(monitor_id: str):
    if not ObjectId.is_valid(monitor_id):
        raise HTTPException(status_code=400, detail="Invalid monitor ID")

    monitor = await db.monitors.find_one({
        "_id": ObjectId(monitor_id)
    })

    if not monitor:
        raise HTTPException(status_code=404, detail="Monitor not found")

    history = await (
        db.health_checks
        .find({"monitor_id": ObjectId(monitor_id)})
        .sort("checked_at", -1)
        .to_list(length=50)
    )

    for check in history:
        check.pop("_id", None)
        check.pop("monitor_id", None)

    return history