from fastapi import FastAPI

from routes.health import router as health_router
from routes.monitors import router as monitors_router

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(health_router)
app.include_router(monitors_router)


@app.get("/")
async def root():
    return {"message": "PingStack API is running"}