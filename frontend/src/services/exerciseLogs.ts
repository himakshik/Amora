import { supabase } from '../lib/supabase';

export type ExerciseLog = {
  id: string;
  user_id: string;
  log_date: string;
  exercise_name: string;
  exercise_type: string | null;
  duration_minutes: number | null;
  calories_burned: number | null;
  completed: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateExerciseLogInput = {
  exercise_name: string;
  exercise_type?: string;
  duration_minutes?: number;
  calories_burned?: number;
  completed?: boolean;
  notes?: string;
};

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export async function createExerciseLog(
  input: CreateExerciseLogInput
): Promise<ExerciseLog> {
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

  const { data, error } = await supabase
    .from('exercise_logs')
    .insert({
      user_id: user.id,
      log_date: getTodayDate(),
      exercise_name: input.exercise_name,
      exercise_type: input.exercise_type ?? null,
      duration_minutes:
        input.duration_minutes ?? null,
      calories_burned:
        input.calories_burned ?? null,
      completed:
        input.completed ?? true,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as ExerciseLog;
}

export async function getTodayExerciseLogs(): Promise<
  ExerciseLog[]
> {
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

  const { data, error } = await supabase
    .from('exercise_logs')
    .select('*')
    .eq('user_id', user.id)
    .eq('log_date', getTodayDate())
    .order('created_at', {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return (data ?? []) as ExerciseLog[];
}   