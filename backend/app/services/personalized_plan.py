import json

from google import genai
from google.genai import types

from app.core.config import GEMINI_API_KEY


client = genai.Client(api_key=GEMINI_API_KEY)


def generate_personalized_plan(profile: dict, goal: dict) -> dict:
    prompt = f"""
You are AMORA, an AI wellness planning assistant.

Create a personalized daily wellness target plan based on the user's
profile and active goal.

IMPORTANT SAFETY RULES:
- This is a wellness application, not a medical diagnosis system.
- Do not provide medical diagnosis or treatment.
- Do not recommend crash diets or extreme calorie restriction.
- Do not blindly promise that the user's requested weight-loss timeline
  is achievable.
- If the requested timeline is aggressive, provide safer realistic daily
  targets while still supporting the user's goal.
- Nutrition values are estimates.
- Use practical targets that a normal person can realistically follow.
- Protein should be adequate for the user's body weight and activity.
- Include fiber, hydration, movement, exercise and sleep targets.
- Avoid unnecessarily restrictive targets.
- Return only the requested JSON structure.

USER PROFILE:
Age: {profile["age"]}
Gender: {profile["gender"]}
Height: {profile["height_cm"]} cm
Current weight: {profile["current_weight_kg"]} kg
Average daily steps: {profile["average_daily_steps"]}
Exercise days per week: {profile["exercise_days_per_week"]}

USER GOAL:
Goal type: {goal["goal_type"]}
Target weight: {goal["target_weight_kg"]} kg
Requested target timeline: {goal["target_days"]} days
Activity level: {goal["activity_level"]}

Generate the user's recommended daily targets.
"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[prompt],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema={
                "type": "OBJECT",
                "properties": {
                    "daily_calories": {
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
                    "water_ml": {
                        "type": "NUMBER",
                    },
                    "steps_target": {
                        "type": "INTEGER",
                    },
                    "exercise_minutes_target": {
                        "type": "INTEGER",
                    },
                    "sleep_hours_target": {
                        "type": "NUMBER",
                    },
                    "plan_note": {
                        "type": "STRING",
                    },
                },
                "required": [
                    "daily_calories",
                    "protein_g",
                    "carbs_g",
                    "fat_g",
                    "fiber_g",
                    "sugar_g",
                    "water_ml",
                    "steps_target",
                    "exercise_minutes_target",
                    "sleep_hours_target",
                    "plan_note",
                ],
            },
        ),
    )

    if not response.text:
        raise ValueError("Gemini returned an empty response.")

    return json.loads(response.text)