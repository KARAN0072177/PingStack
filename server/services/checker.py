import asyncio
from datetime import datetime, timezone
import time

import httpx
from bson import ObjectId

from database.connection import db

last_checked_times: dict[str, float] = {}
_is_running = False


async def perform_health_check(monitor: dict) -> dict:
    start_time = time.perf_counter()
    monitor_id = (
        monitor["_id"]
        if isinstance(monitor["_id"], ObjectId)
        else ObjectId(str(monitor["_id"]))
    )

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(str(monitor["url"]))

        response_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
        status = "healthy" if response.is_success else "unhealthy"

        health_check = {
            "monitor_id": monitor_id,
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
        response_time_ms = round((time.perf_counter() - start_time) * 1000, 2)

        health_check = {
            "monitor_id": monitor_id,
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


async def start_monitoring_worker():
    global _is_running
    _is_running = True
    print("🚀 Background monitoring worker started.")

    while _is_running:
        try:
            cursor = db.monitors.find({"enabled": True})
            monitors = await cursor.to_list(length=None)

            now = time.time()
            for monitor in monitors:
                monitor_id = str(monitor["_id"])
                interval = int(monitor.get("interval", 60))
                last_time = last_checked_times.get(monitor_id, 0)

                if now - last_time >= interval:
                    last_checked_times[monitor_id] = now
                    asyncio.create_task(perform_health_check(monitor))

        except Exception as e:
            print(f"Error in monitoring worker: {e}")

        await asyncio.sleep(1)


def stop_monitoring_worker():
    global _is_running
    _is_running = False
    print("🛑 Background monitoring worker stopped.")
