-- AMORA: add personalization data to user profiles
-- Stores the information required for personalized wellness targets.

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS gender TEXT;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS average_daily_steps INTEGER;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS exercise_days_per_week INTEGER;

-- Validate gender when provided.
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_gender_valid
CHECK (
    gender IS NULL
    OR gender IN ('female', 'male', 'other')
);

-- Validate activity inputs when provided.
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_steps_non_negative
CHECK (
    average_daily_steps IS NULL
    OR average_daily_steps >= 0
);

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_exercise_days_valid
CHECK (
    exercise_days_per_week IS NULL
    OR (
        exercise_days_per_week >= 0
        AND exercise_days_per_week <= 7
    )
);

-- Standardize the activity level used by AMORA.
ALTER TABLE public.goals
DROP CONSTRAINT IF EXISTS goals_activity_level_valid;

ALTER TABLE public.goals
ADD CONSTRAINT goals_activity_level_valid
CHECK (
    activity_level IS NULL
    OR activity_level IN (
        'sedentary',
        'light',
        'moderate',
        'very_active'
    )
);