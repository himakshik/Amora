from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.food_ai import analyze_food


router = APIRouter(
    prefix="/api/food",
    tags=["Food AI"],
)


class FoodAnalysisRequest(BaseModel):
    meal_text: str


@router.post("/analyze")
def analyze_food_endpoint(request: FoodAnalysisRequest):
    meal_text = request.meal_text.strip()

    if not meal_text:
        raise HTTPException(
            status_code=400,
            detail="Meal description cannot be empty.",
        )

    try:
        result = analyze_food(meal_text)

        return {
            "success": True,
            "data": result,
        }

    except Exception as error:
        print("FOOD AI ERROR:", repr(error))

        raise HTTPException(
            status_code=500,
            detail="Unable to analyze the meal.",
        ) from error