from fastapi import FastAPI

from app.api.routes.health import router as health_router


app = FastAPI(
    title="AMORA API",
    description="Backend API for the AMORA wellness application",
    version="0.1.0",
)

app.include_router(health_router)


@app.get("/")
def root():
    return {
        "message": "AMORA API is running",
        "status": "healthy",
    }