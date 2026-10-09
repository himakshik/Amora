const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error('EXPO_PUBLIC_API_URL is not configured');
}

export type PersonalizedPlanInput = {
  profile: {
    age: number;
    gender: 'female' | 'male' | 'other';
    height_cm: number;
    current_weight_kg: number;
    average_daily_steps: number;
    exercise_days_per_week: number;
  };

  goal: {
    goal_type: 'lose_weight' | 'maintain_weight' | 'gain_weight';
    target_weight_kg: number;
    target_days: number;
    activity_level:
      | 'sedentary'
      | 'light'
      | 'moderate'
      | 'very_active';
  };
};

export type PersonalizedPlan = {
  daily_calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  water_ml: number;
  steps_target: number;
  exercise_minutes_target: number;
  sleep_hours_target: number;
  plan_note: string;
};

type PersonalizedPlanResponse = {
  success: boolean;
  data: PersonalizedPlan;
};

export async function generatePersonalizedPlan(
  input: PersonalizedPlanInput
): Promise<PersonalizedPlan> {
  const response = await fetch(
    `${API_URL}/api/personalized-plan/generate`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    }
  );

  if (!response.ok) {
    let errorMessage =
      'Unable to generate personalized plan.';

    try {
      const errorData = await response.json();

      if (errorData?.detail) {
        errorMessage = errorData.detail;
      }
    } catch {
      // Keep the default error message.
    }

    throw new Error(errorMessage);
  }

  const result =
    (await response.json()) as PersonalizedPlanResponse;

  if (!result.success || !result.data) {
    throw new Error(
      'Personalized plan was not returned by the server.'
    );
  }

  return result.data;
}