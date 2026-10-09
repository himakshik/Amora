import json

from google import genai
from google.genai import types

from app.core.config import GEMINI_API_KEY


client = genai.Client(api_key=GEMINI_API_KEY)


def analyze_food(meal_text: str) -> dict:
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[
            (
                "You are AMORA, an AI wellness nutrition assistant. "
                "Analyze the food described by the user and estimate "
                "nutrition for the entire meal. "
                "Nutrition values are estimates, not exact measurements. "
                "Use realistic portions and typical Indian food nutrition "
                "when appropriate. "
                "Estimate total sugar in the meal, including naturally "
                "occurring sugar and added sugar when the information "
                "allows it. "
                "Do not provide medical diagnosis, medical treatment, "
                "or medication advice.\n\n"
                f"Meal: {meal_text}"
            )
        ],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema={
                "type": "OBJECT",
                "properties": {
                    "food_name": {
                        "type": "STRING",
                    },
                    "quantity": {
                        "type": "NUMBER",
                    },
                    "unit": {
                        "type": "STRING",
                    },
                    "calories": {
                        "type": "NUMBER",
                    },
                    "protein_g": {
                        "type": "NUMBER",
                    },
                    "carbs_g": {
                        "type": "NUMBER",
                    },
                    "fat_g": {
                        "type": "NUMBER",
                    },
                    "fiber_g": {
                        "type": "NUMBER",
                    },
                    "sugar_g": {
                        "type": "NUMBER",
                    },
                    "confidence": {
                        "type": "STRING",
                    },
                    "notes": {
                        "type": "STRING",
                    },
                },
                "required": [
                    "food_name",
                    "quantity",
                    "unit",
                    "calories",
                    "protein_g",
                    "carbs_g",
                    "fat_g",
                    "fiber_g",
                    "sugar_g",
                    "confidence",
                    "notes",
                ],
            },
        ),
    )

    return json.loads(response.text)