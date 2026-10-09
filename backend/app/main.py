from fastapi import FastAPI

from app.api.routes.food_ai import router as food_ai_router
from app.api.routes.health import router as health_router
from app.api.routes.personalized_plan import router as personalized_plan_router


app = FastAPI(
    title="AMORA API",
    description="Backend API for the AMORA wellness application",
    version="0.1.0",
)


app.include_router(health_router)
app.include_router(food_ai_router)
app.include_router(personalized_plan_router)


@app.get("/")
def root():
    return {
        "message": "AMORA API is running",
        "status": "healthy",
    }