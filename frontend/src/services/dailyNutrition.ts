import { supabase } from '../lib/supabase';

export type DailyNutrition = {
  calories: number;
  protein: number;
  fiber: number;
  sugar: number;

  calorieTarget: number | null;
  proteinTarget: number | null;
  fiberTarget: number | null;
  sugarTarget: number | null;
  waterTargetMl: number | null;
  stepsTarget: number | null;
  exerciseMinutesTarget: number | null;
  sleepHoursTarget: number | null;
};

export async function getDailyNutrition(
  date: string
): Promise<DailyNutrition> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error('No authenticated user found.');
  }

  const [
    foodLogsResult,
    nutritionTargetResult,
  ] = await Promise.all([
    supabase
      .from('food_logs')
      .select(
        'calories, protein_g, fiber_g, sugar_g'
      )
      .eq('user_id', user.id)
      .eq('log_date', date),

    supabase
      .from('nutrition_targets')
      .select(
        `
          daily_calories,
          protein_g,
          fiber_g,
          sugar_g,
          water_ml,
          steps_target,
          exercise_minutes_target,
          sleep_hours_target,
          effective_date
        `
      )
      .eq('user_id', user.id)
      .lte('effective_date', date)
      .order('effective_date', {
        ascending: false,
      })
      .limit(1)
      .maybeSingle(),
  ]);

  if (foodLogsResult.error) {
    throw foodLogsResult.error;
  }

  if (nutritionTargetResult.error) {
    throw nutritionTargetResult.error;
  }

  const foodLogs =
    foodLogsResult.data ?? [];

  const calories = foodLogs.reduce(
    (total, item) =>
      total + Number(item.calories ?? 0),
    0
  );

  const protein = foodLogs.reduce(
    (total, item) =>
      total + Number(item.protein_g ?? 0),
    0
  );

  const fiber = foodLogs.reduce(
    (total, item) =>
      total + Number(item.fiber_g ?? 0),
    0
  );

  const sugar = foodLogs.reduce(
    (total, item) =>
      total + Number(item.sugar_g ?? 0),
    0
  );

  const target =
    nutritionTargetResult.data;

  return {
    calories,
    protein,
    fiber,
    sugar,

    calorieTarget:
      target?.daily_calories != null
        ? Number(target.daily_calories)
        : null,

    proteinTarget:
      target?.protein_g != null
        ? Number(target.protein_g)
        : null,

    fiberTarget:
      target?.fiber_g != null
        ? Number(target.fiber_g)
        : null,

    sugarTarget:
      target?.sugar_g != null
        ? Number(target.sugar_g)
        : null,

    waterTargetMl:
      target?.water_ml != null
        ? Number(target.water_ml)
        : null,

    stepsTarget:
      target?.steps_target != null
        ? Number(target.steps_target)
        : null,

    exerciseMinutesTarget:
      target?.exercise_minutes_target != null
        ? Number(
            target.exercise_minutes_target
          )
        : null,

    sleepHoursTarget:
      target?.sleep_hours_target != null
        ? Number(
            target.sleep_hours_target
          )
        : null,
  };
}