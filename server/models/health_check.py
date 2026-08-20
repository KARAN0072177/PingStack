from datetime import datetime

from pydantic import BaseModel


class HealthCheckResponse(BaseModel):
    status: str
    status_code: int | None
    response_time_ms: float
    checked_at: datetime