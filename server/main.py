from fastapi import FastAPI

from routes.health import router as health_router
from routes.monitors import router as monitors_router

app = FastAPI()


app.include_router(health_router)
app.include_router(monitors_router)


@app.get("/")
async def root():
    return {"message": "PingStack API is running"}