import { supabase } from '../lib/supabase';
import type { PersonalizedPlan } from './personalizedPlan';

export async function saveNutritionTargets(
  plan: PersonalizedPlan,
  effectiveDate: string
): Promise<void> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error(
      'No authenticated user found.'
    );
  }

  const { error } = await supabase
    .from('nutrition_targets')
    .upsert(
      {
        user_id: user.id,
        daily_calories:
          plan.daily_calories,
        protein_g:
          plan.protein_g,
        carbs_g:
          plan.carbs_g,
        fat_g:
          plan.fat_g,
        fiber_g:
          plan.fiber_g,
        sugar_g:
          plan.sugar_g,
        water_ml:
          plan.water_ml,
        steps_target:
          plan.steps_target,
        exercise_minutes_target:
          plan.exercise_minutes_target,
        sleep_hours_target:
          plan.sleep_hours_target,
        effective_date:
          effectiveDate,
      },
      {
        onConflict:
          'user_id,effective_date',
      }
    );

  if (error) {
    throw error;
  }
}