from typing import Optional

from pydantic import BaseModel, HttpUrl


class MonitorCreate(BaseModel):
    name: str
    url: HttpUrl
    interval: int = 60
    enabled: bool = True


class MonitorUpdate(BaseModel):
    name: Optional[str] = None
    url: Optional[HttpUrl] = None
    interval: Optional[int] = None
    enabled: Optional[bool] = None