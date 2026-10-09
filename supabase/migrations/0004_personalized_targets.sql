-- AMORA: add personalized daily wellness targets
-- These targets are generated from the user's profile and active goal.

ALTER TABLE public.nutrition_targets
ADD COLUMN IF NOT EXISTS sugar_g NUMERIC(8, 2);

ALTER TABLE public.nutrition_targets
ADD COLUMN IF NOT EXISTS steps_target INTEGER;

ALTER TABLE public.nutrition_targets
ADD COLUMN IF NOT EXISTS exercise_minutes_target INTEGER;

ALTER TABLE public.nutrition_targets
ADD COLUMN IF NOT EXISTS sleep_hours_target NUMERIC(4, 2);

ALTER TABLE public.nutrition_targets
ADD CONSTRAINT nutrition_targets_sugar_non_negative
CHECK (
    sugar_g IS NULL
    OR sugar_g >= 0
);

ALTER TABLE public.nutrition_targets
ADD CONSTRAINT nutrition_targets_steps_positive
CHECK (
    steps_target IS NULL
    OR steps_target > 0
);

ALTER TABLE public.nutrition_targets
ADD CONSTRAINT nutrition_targets_exercise_positive
CHECK (
    exercise_minutes_target IS NULL
    OR exercise_minutes_target > 0
);

ALTER TABLE public.nutrition_targets
ADD CONSTRAINT nutrition_targets_sleep_valid
CHECK (
    sleep_hours_target IS NULL
    OR (
        sleep_hours_target >= 0
        AND sleep_hours_target <= 24
    )
);