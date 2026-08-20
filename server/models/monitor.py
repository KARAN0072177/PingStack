from pydantic import BaseModel, HttpUrl


class MonitorCreate(BaseModel):
    name: str
    url: HttpUrl
    interval: int = 60
    enabled: bool = True