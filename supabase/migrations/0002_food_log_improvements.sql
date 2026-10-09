-- AMORA: improve food logging
-- Adds meal category and sugar tracking to food_logs.

ALTER TABLE public.food_logs
ADD COLUMN IF NOT EXISTS meal_type TEXT;

ALTER TABLE public.food_logs
ADD COLUMN IF NOT EXISTS sugar_g NUMERIC(8, 2);

-- Allow the five meal categories used by AMORA.
ALTER TABLE public.food_logs
ADD CONSTRAINT food_logs_meal_type_check
CHECK (
    meal_type IS NULL
    OR meal_type IN (
        'breakfast',
        'lunch',
        'snack',
        'dinner',
        'miscellaneous'
    )
);

-- Prevent negative nutrition values.
ALTER TABLE public.food_logs
ADD CONSTRAINT food_logs_sugar_non_negative
CHECK (
    sugar_g IS NULL
    OR sugar_g >= 0
);

-- Helpful index for the Meals screen.
CREATE INDEX IF NOT EXISTS idx_food_logs_user_date_meal_type
ON public.food_logs (user_id, log_date, meal_type);