from datetime import datetime, timezone

import time

import httpx
from bson import ObjectId

from fastapi import APIRouter, HTTPException

from database.connection import db
from models.monitor import MonitorCreate, MonitorUpdate

from services.checker import perform_health_check, last_checked_times
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

    monitor = await db.monitors.find_one({"_id": ObjectId(monitor_id)})

    if not monitor:
        raise HTTPException(status_code=404, detail="Monitor not found")

    last_checked_times[str(monitor["_id"])] = time.time()
    return await perform_health_check(monitor)



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


@router.patch("/api/monitors/{monitor_id}")
async def update_monitor(monitor_id: str, update_data: MonitorUpdate):
    if not ObjectId.is_valid(monitor_id):
        raise HTTPException(status_code=400, detail="Invalid monitor ID")

    fields_to_update = {
        k: v for k, v in update_data.model_dump(mode="json").items() if v is not None
    }

    if not fields_to_update:
        raise HTTPException(status_code=400, detail="No fields provided to update")

    result = await db.monitors.find_one_and_update(
        {"_id": ObjectId(monitor_id)},
        {"$set": fields_to_update},
        return_document=True,
    )

    if not result:
        raise HTTPException(status_code=404, detail="Monitor not found")

    result["_id"] = str(result["_id"])
    return {
        "message": "Monitor updated",
        "monitor": result,
    }


@router.delete("/api/monitors/{monitor_id}")
async def delete_monitor(monitor_id: str):
    if not ObjectId.is_valid(monitor_id):
        raise HTTPException(status_code=400, detail="Invalid monitor ID")

    result = await db.monitors.delete_one({"_id": ObjectId(monitor_id)})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Monitor not found")

    # Clean up associated health checks
    await db.health_checks.delete_many({"monitor_id": ObjectId(monitor_id)})
    last_checked_times.pop(monitor_id, None)

    return {
        "message": "Monitor deleted",
        "id": monitor_id,
    }
