from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.personalized_plan import (
    generate_personalized_plan,
)


router = APIRouter(
    prefix="/api/personalized-plan",
    tags=["Personalized Plan"],
)


class ProfileInput(BaseModel):
    age: int = Field(gt=0, lt=120)
    gender: str
    height_cm: float = Field(gt=50, lt=250)
    current_weight_kg: float = Field(gt=20, lt=500)
    average_daily_steps: int = Field(ge=0)
    exercise_days_per_week: int = Field(ge=0, le=7)


class GoalInput(BaseModel):
    goal_type: str
    target_weight_kg: float = Field(gt=20, lt=500)
    target_days: int = Field(gt=0)
    activity_level: str


class PersonalizedPlanRequest(BaseModel):
    profile: ProfileInput
    goal: GoalInput


@router.post("/generate")
def generate_plan(request: PersonalizedPlanRequest):
    try:
        plan = generate_personalized_plan(
            profile=request.profile.model_dump(),
            goal=request.goal.model_dump(),
        )

        return {
            "success": True,
            "data": plan,
        }

    except Exception as error:
        print("PERSONALIZED PLAN ERROR:", repr(error))

        raise HTTPException(
            status_code=500,
            detail="Unable to generate personalized plan.",
        ) from error