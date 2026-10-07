-- ============================================================
-- AMORA INITIAL DATABASE SCHEMA
-- Migration: 0001_initial_schema
-- ============================================================
-- ============================================================
-- PROFILES
-- ============================================================
create table public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text,
    date_of_birth date,
    height_cm numeric(5,2),
    weight_kg numeric(5,2),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
-- ============================================================
-- GOALS
-- ============================================================
create table public.goals (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    goal_type text not null default 'weight_loss',
    target_weight_kg numeric(5,2),
    target_days integer,
    activity_level text,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint goals_target_weight_positive
        check (target_weight_kg is null or target_weight_kg > 0),
    constraint goals_target_days_positive
        check (target_days is null or target_days > 0),
    constraint goals_activity_level_valid
        check (
            activity_level is null
            or activity_level in (
                'sedentary',
                'light',
                'moderate',
                'high'
            )
        )
);
-- ============================================================
-- DAILY LOGS
-- ============================================================
create table public.daily_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    log_date date not null,
    weight_kg numeric(5,2),
    daily_score numeric(5,2),
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint daily_logs_weight_positive
        check (weight_kg is null or weight_kg > 0),
    constraint daily_logs_score_valid
        check (
            daily_score is null
            or (daily_score >= 0 and daily_score <= 100)
        ),
    constraint daily_logs_user_date_unique
        unique (user_id, log_date)
);
-- ============================================================
-- MEALS
-- ============================================================
create table public.meals (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    meal_date date not null,
    meal_type text not null,
    meal_name text,
    calories numeric(7,2),
    protein_g numeric(7,2),
    carbs_g numeric(7,2),
    fat_g numeric(7,2),
    fiber_g numeric(7,2),
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint meals_meal_type_valid
        check (
            meal_type in (
                'breakfast',
                'lunch',
                'dinner',
                'snack'
            )
        ),
    constraint meals_calories_positive
        check (calories is null or calories >= 0),
    constraint meals_protein_positive
        check (protein_g is null or protein_g >= 0),
    constraint meals_carbs_positive
        check (carbs_g is null or carbs_g >= 0),
    constraint meals_fat_positive
        check (fat_g is null or fat_g >= 0),
    constraint meals_fiber_positive
        check (fiber_g is null or fiber_g >= 0)
);
-- ============================================================
-- MEAL ITEMS
-- ============================================================
create table public.meal_items (
    id uuid primary key default gen_random_uuid(),
    meal_id uuid not null references public.meals(id) on delete cascade,
    food_name text not null,
    quantity numeric(8,2),
    unit text,
    calories numeric(7,2),
    protein_g numeric(7,2),
    carbs_g numeric(7,2),
    fat_g numeric(7,2),
    fiber_g numeric(7,2),
    created_at timestamptz not null default now(),
    constraint meal_items_quantity_positive
        check (quantity is null or quantity > 0),
    constraint meal_items_calories_positive
        check (calories is null or calories >= 0),
    constraint meal_items_protein_positive
        check (protein_g is null or protein_g >= 0),
    constraint meal_items_carbs_positive
        check (carbs_g is null or carbs_g >= 0),
    constraint meal_items_fat_positive
        check (fat_g is null or fat_g >= 0),
    constraint meal_items_fiber_positive
        check (fiber_g is null or fiber_g >= 0)
);
-- ============================================================
-- FOOD LOGS
-- ============================================================
create table public.food_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    log_date date not null,
    food_name text not null,
    quantity numeric(8,2),
    unit text,
    calories numeric(7,2),
    protein_g numeric(7,2),
    carbs_g numeric(7,2),
    fat_g numeric(7,2),
    fiber_g numeric(7,2),
    source text,
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint food_logs_quantity_positive
        check (quantity is null or quantity > 0),
    constraint food_logs_calories_positive
        check (calories is null or calories >= 0),
    constraint food_logs_protein_positive
        check (protein_g is null or protein_g >= 0),
    constraint food_logs_carbs_positive
        check (carbs_g is null or carbs_g >= 0),
    constraint food_logs_fat_positive
        check (fat_g is null or fat_g >= 0),
    constraint food_logs_fiber_positive
        check (fiber_g is null or fiber_g >= 0)
);
-- ============================================================
-- INDEXES
-- ============================================================
create index goals_user_id_idx
on public.goals(user_id);
create index daily_logs_user_id_idx
on public.daily_logs(user_id);
create index meals_user_id_idx
on public.meals(user_id);
create index meal_items_meal_id_idx
on public.meal_items(meal_id);
create index food_logs_user_id_idx
on public.food_logs(user_id);
-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.goals enable row level security;
alter table public.daily_logs enable row level security;
alter table public.meals enable row level security;
alter table public.meal_items enable row level security;
alter table public.food_logs enable row level security;
-- ============================================================
-- PROFILES POLICIES
-- ============================================================
create policy "Users can view their own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);
create policy "Users can create their own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);
create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);
-- ============================================================
-- GOALS POLICIES
-- ============================================================
create policy "Users can view their own goals"
on public.goals
for select
to authenticated
using (auth.uid() = user_id);
create policy "Users can create their own goals"
on public.goals
for insert
to authenticated
with check (auth.uid() = user_id);
create policy "Users can update their own goals"
on public.goals
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
-- ============================================================
-- DAILY LOGS POLICIES
-- ============================================================
create policy "Users can view their own daily logs"
on public.daily_logs
for select
to authenticated
using (auth.uid() = user_id);
create policy "Users can create their own daily logs"
on public.daily_logs
for insert
to authenticated
with check (auth.uid() = user_id);
create policy "Users can update their own daily logs"
on public.daily_logs
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
create policy "Users can delete their own daily logs"
on public.daily_logs
for delete
to authenticated
using (auth.uid() = user_id);
-- ============================================================
-- MEALS POLICIES
-- ============================================================
create policy "Users can view their own meals"
on public.meals
for select
to authenticated
using (auth.uid() = user_id);
create policy "Users can create their own meals"
on public.meals
for insert
to authenticated
with check (auth.uid() = user_id);
create policy "Users can update their own meals"
on public.meals
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
create policy "Users can delete their own meals"
on public.meals
for delete
to authenticated
using (auth.uid() = user_id);
-- ============================================================
-- MEAL ITEMS POLICIES
-- ============================================================
create policy "Users can view their own meal items"
on public.meal_items
for select
to authenticated
using (
    exists (
        select 1
        from public.meals
        where meals.id = meal_items.meal_id
        and meals.user_id = auth.uid()
    )
);
create policy "Users can create their own meal items"
on public.meal_items
for insert
to authenticated
with check (
    exists (
        select 1
        from public.meals
        where meals.id = meal_items.meal_id
        and meals.user_id = auth.uid()
    )
);
create policy "Users can update their own meal items"
on public.meal_items
for update
to authenticated
using (
    exists (
        select 1
        from public.meals
        where meals.id = meal_items.meal_id
        and meals.user_id = auth.uid()
    )
)
with check (
    exists (
        select 1
        from public.meals
        where meals.id = meal_items.meal_id
        and meals.user_id = auth.uid()
    )
);
create policy "Users can delete their own meal items"
on public.meal_items
for delete
to authenticated
using (
    exists (
        select 1
        from public.meals
        where meals.id = meal_items.meal_id
        and meals.user_id = auth.uid()
    )
);
-- ============================================================
-- FOOD LOGS POLICIES
-- ============================================================
create policy "Users can view their own food logs"
on public.food_logs
for select
to authenticated
using (auth.uid() = user_id);
create policy "Users can create their own food logs"
on public.food_logs
for insert
to authenticated
with check (auth.uid() = user_id);
create policy "Users can update their own food logs"
on public.food_logs
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
create policy "Users can delete their own food logs"
on public.food_logs
for delete
to authenticated
using (auth.uid() = user_id);
-- ============================================================
-- NUTRITION TARGETS
-- ============================================================
create table public.nutrition_targets (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    daily_calories numeric(7,2),
    protein_g numeric(7,2),
    carbs_g numeric(7,2),
    fat_g numeric(7,2),
    fiber_g numeric(7,2),
    water_ml numeric(8,2),
    effective_date date not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint nutrition_targets_calories_positive
        check (daily_calories is null or daily_calories > 0),
    constraint nutrition_targets_protein_positive
        check (protein_g is null or protein_g >= 0),
    constraint nutrition_targets_carbs_positive
        check (carbs_g is null or carbs_g >= 0),
    constraint nutrition_targets_fat_positive
        check (fat_g is null or fat_g >= 0),
    constraint nutrition_targets_fiber_positive
        check (fiber_g is null or fiber_g >= 0),
    constraint nutrition_targets_water_positive
        check (water_ml is null or water_ml > 0),
    constraint nutrition_targets_user_date_unique
        unique (user_id, effective_date)
);
create index nutrition_targets_user_id_idx
on public.nutrition_targets(user_id);
alter table public.nutrition_targets enable row level security;
create policy "Users can view their own nutrition targets"
on public.nutrition_targets
for select
to authenticated
using (auth.uid() = user_id);
create policy "Users can create their own nutrition targets"
on public.nutrition_targets
for insert
to authenticated
with check (auth.uid() = user_id);
create policy "Users can update their own nutrition targets"
on public.nutrition_targets
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
create policy "Users can delete their own nutrition targets"
on public.nutrition_targets
for delete
to authenticated
using (auth.uid() = user_id);
-- ============================================================
-- EXERCISE PLANS
-- ============================================================
create table public.exercise_plans (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    plan_name text not null,
    description text,
    day_of_week integer,
    workout_type text,
    duration_minutes integer,
    difficulty text,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint exercise_plans_day_valid
        check (
            day_of_week is null
            or (day_of_week >= 0 and day_of_week <= 6)
        ),
    constraint exercise_plans_duration_positive
        check (
            duration_minutes is null
            or duration_minutes > 0
        ),
    constraint exercise_plans_difficulty_valid
        check (
            difficulty is null
            or difficulty in (
                'beginner',
                'intermediate',
                'advanced'
            )
        )
);
create index exercise_plans_user_id_idx
on public.exercise_plans(user_id);
alter table public.exercise_plans enable row level security;
create policy "Users can view their own exercise plans"
on public.exercise_plans
for select
to authenticated
using (auth.uid() = user_id);
create policy "Users can create their own exercise plans"
on public.exercise_plans
for insert
to authenticated
with check (auth.uid() = user_id);
create policy "Users can update their own exercise plans"
on public.exercise_plans
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
create policy "Users can delete their own exercise plans"
on public.exercise_plans
for delete
to authenticated
using (auth.uid() = user_id);
-- ============================================================
-- EXERCISE LOGS
-- ============================================================
create table public.exercise_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    log_date date not null,
    exercise_name text not null,
    exercise_type text,
    duration_minutes integer,
    calories_burned numeric(7,2),
    completed boolean not null default true,
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint exercise_logs_duration_positive
        check (
            duration_minutes is null
            or duration_minutes > 0
        ),
    constraint exercise_logs_calories_positive
        check (
            calories_burned is null
            or calories_burned >= 0
        )
);
create index exercise_logs_user_id_idx
on public.exercise_logs(user_id);
alter table public.exercise_logs enable row level security;
create policy "Users can view their own exercise logs"
on public.exercise_logs
for select
to authenticated
using (auth.uid() = user_id);
create policy "Users can create their own exercise logs"
on public.exercise_logs
for insert
to authenticated
with check (auth.uid() = user_id);
create policy "Users can update their own exercise logs"
on public.exercise_logs
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
create policy "Users can delete their own exercise logs"
on public.exercise_logs
for delete
to authenticated
using (auth.uid() = user_id);
-- ============================================================
-- WATER LOGS
-- ============================================================
create table public.water_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    log_date date not null,
    amount_ml numeric(8,2) not null,
    created_at timestamptz not null default now(),
    constraint water_logs_amount_positive
        check (amount_ml > 0)
);
create index water_logs_user_id_idx
on public.water_logs(user_id);
alter table public.water_logs enable row level security;
create policy "Users can view their own water logs"
on public.water_logs
for select
to authenticated
using (auth.uid() = user_id);
create policy "Users can create their own water logs"
on public.water_logs
for insert
to authenticated
with check (auth.uid() = user_id);
create policy "Users can update their own water logs"
on public.water_logs
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
create policy "Users can delete their own water logs"
on public.water_logs
for delete
to authenticated
using (auth.uid() = user_id);
-- ============================================================
-- SLEEP LOGS
-- ============================================================
create table public.sleep_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    sleep_date date not null,
    bedtime timestamptz,
    wake_time timestamptz,
    duration_minutes integer,
    sleep_quality integer,
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint sleep_logs_duration_positive
        check (
            duration_minutes is null
            or duration_minutes > 0
        ),
    constraint sleep_logs_quality_valid
        check (
            sleep_quality is null
            or (sleep_quality >= 1 and sleep_quality <= 5)
        ),
    constraint sleep_logs_wake_after_bedtime
        check (
            bedtime is null
            or wake_time is null
            or wake_time > bedtime
        )
);
create index sleep_logs_user_id_idx
on public.sleep_logs(user_id);
alter table public.sleep_logs enable row level security;
create policy "Users can view their own sleep logs"
on public.sleep_logs
for select
to authenticated
using (auth.uid() = user_id);
create policy "Users can create their own sleep logs"
on public.sleep_logs
for insert
to authenticated
with check (auth.uid() = user_id);
create policy "Users can update their own sleep logs"
on public.sleep_logs
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
create policy "Users can delete their own sleep logs"
on public.sleep_logs
for delete
to authenticated
using (auth.uid() = user_id);
-- ============================================================
-- MEDICATIONS
-- ============================================================
create table public.medications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    medication_name text not null,
    dosage_text text,
    frequency text,
    start_date date,
    end_date date,
    is_active boolean not null default true,
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint medications_dates_valid
        check (
            start_date is null
            or end_date is null
            or end_date >= start_date
        )
);
create index medications_user_id_idx
on public.medications(user_id);
alter table public.medications enable row level security;
create policy "Users can view their own medications"
on public.medications
for select
to authenticated
using (auth.uid() = user_id);
create policy "Users can create their own medications"
on public.medications
for insert
to authenticated
with check (auth.uid() = user_id);
create policy "Users can update their own medications"
on public.medications
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
create policy "Users can delete their own medications"
on public.medications
for delete
to authenticated
using (auth.uid() = user_id);
-- ============================================================
-- MEDICATION LOGS
-- ============================================================
create table public.medication_logs (
    id uuid primary key default gen_random_uuid(),
    medication_id uuid not null
        references public.medications(id)
        on delete cascade,
    user_id uuid not null
        references auth.users(id)
        on delete cascade,
    log_date date not null,
    taken_at timestamptz,
    status text not null default 'taken',
    notes text,
    created_at timestamptz not null default now(),
    constraint medication_logs_status_valid
        check (
            status in (
                'taken',
                'skipped'
            )
        )
);
create index medication_logs_user_id_idx
on public.medication_logs(user_id);
alter table public.medication_logs enable row level security;
create policy "Users can view their own medication logs"
on public.medication_logs
for select
to authenticated
using (auth.uid() = user_id);
create policy "Users can create their own medication logs"
on public.medication_logs
for insert
to authenticated
with check (auth.uid() = user_id);
create policy "Users can update their own medication logs"
on public.medication_logs
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
create policy "Users can delete their own medication logs"
on public.medication_logs
for delete
to authenticated
using (auth.uid() = user_id);
-- ============================================================
-- REMINDERS
-- ============================================================
create table public.reminders (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    reminder_type text not null,
    title text not null,
    description text,
    reminder_time time,
    days_of_week integer[],
    is_enabled boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint reminders_type_valid
        check (
            reminder_type in (
                'water',
                'workout',
                'sleep',
                'medication',
                'meal',
                'other'
            )
        ),
    constraint reminders_days_valid
        check (
            days_of_week is null
            or (
                array_length(days_of_week, 1) is not null
                and days_of_week <@ array[0,1,2,3,4,5,6]
            )
        )
);
create index reminders_user_id_idx
on public.reminders(user_id);
alter table public.reminders enable row level security;
create policy "Users can view their own reminders"
on public.reminders
for select
to authenticated
using (auth.uid() = user_id);
create policy "Users can create their own reminders"
on public.reminders
for insert
to authenticated
with check (auth.uid() = user_id);
create policy "Users can update their own reminders"
on public.reminders
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
create policy "Users can delete their own reminders"
on public.reminders
for delete
to authenticated
using (auth.uid() = user_id);
-- ============================================================
-- WEEKLY INGREDIENTS
-- ============================================================
create table public.weekly_ingredients (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    week_start_date date not null,
    ingredient_name text not null,
    quantity numeric(10,2),
    unit text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint weekly_ingredients_quantity_positive
        check (quantity is null or quantity > 0),
    constraint weekly_ingredients_user_week_unique
        unique (user_id, week_start_date, ingredient_name)
);
create index weekly_ingredients_user_id_idx
on public.weekly_ingredients(user_id);
alter table public.weekly_ingredients enable row level security;
create policy "Users can view their own weekly ingredients"
on public.weekly_ingredients
for select
to authenticated
using (auth.uid() = user_id);
create policy "Users can create their own weekly ingredients"
on public.weekly_ingredients
for insert
to authenticated
with check (auth.uid() = user_id);
create policy "Users can update their own weekly ingredients"
on public.weekly_ingredients
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
create policy "Users can delete their own weekly ingredients"
on public.weekly_ingredients
for delete
to authenticated
using (auth.uid() = user_id);
-- ============================================================
-- INGREDIENT ITEMS
-- ============================================================
create table public.ingredient_items (
    id uuid primary key default gen_random_uuid(),
    weekly_ingredient_id uuid not null
        references public.weekly_ingredients(id)
        on delete cascade,
    item_name text not null,
    quantity numeric(10,2),
    unit text,
    is_purchased boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint ingredient_items_quantity_positive
        check (quantity is null or quantity > 0)
);
create index ingredient_items_weekly_ingredient_id_idx
on public.ingredient_items(weekly_ingredient_id);
alter table public.ingredient_items enable row level security;
create policy "Users can view their own ingredient items"
on public.ingredient_items
for select
to authenticated
using (
    exists (
        select 1
        from public.weekly_ingredients
        where weekly_ingredients.id = ingredient_items.weekly_ingredient_id
        and weekly_ingredients.user_id = auth.uid()
    )
);
create policy "Users can create their own ingredient items"
on public.ingredient_items
for insert
to authenticated
with check (
    exists (
        select 1
        from public.weekly_ingredients
        where weekly_ingredients.id = ingredient_items.weekly_ingredient_id
        and weekly_ingredients.user_id = auth.uid()
    )
);
create policy "Users can update their own ingredient items"
on public.ingredient_items
for update
to authenticated
using (
    exists (
        select 1
        from public.weekly_ingredients
        where weekly_ingredients.id = ingredient_items.weekly_ingredient_id
        and weekly_ingredients.user_id = auth.uid()
    )
)
with check (
    exists (
        select 1
        from public.weekly_ingredients
        where weekly_ingredients.id = ingredient_items.weekly_ingredient_id
        and weekly_ingredients.user_id = auth.uid()
    )
);
create policy "Users can delete their own ingredient items"
on public.ingredient_items
for delete
to authenticated
using (
    exists (
        select 1
        from public.weekly_ingredients
        where weekly_ingredients.id = ingredient_items.weekly_ingredient_id
        and weekly_ingredients.user_id = auth.uid()
    )
);
-- ============================================================
-- USER PREFERENCES
-- ============================================================
create table public.user_preferences (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null unique references auth.users(id) on delete cascade,
    unit_system text not null default 'metric',
    theme text not null default 'system',
    language text not null default 'en',
    notifications_enabled boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint user_preferences_unit_valid
        check (
            unit_system in ('metric', 'imperial')
        ),
    constraint user_preferences_theme_valid
        check (
            theme in ('light', 'dark', 'system')
        )
);
create index user_preferences_user_id_idx
on public.user_preferences(user_id);
alter table public.user_preferences enable row level security;
create policy "Users can view their own preferences"
on public.user_preferences
for select
to authenticated
using (auth.uid() = user_id);
create policy "Users can create their own preferences"
on public.user_preferences
for insert
to authenticated
with check (auth.uid() = user_id);
create policy "Users can update their own preferences"
on public.user_preferences
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
create policy "Users can delete their own preferences"
on public.user_preferences
for delete
to authenticated
using (auth.uid() = user_id);
-- ============================================================
-- CHAT SESSIONS
-- ============================================================
create table public.chat_sessions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    title text,
    context_type text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint chat_sessions_context_type_valid
        check (
            context_type is null
            or context_type in (
                'nutrition',
                'exercise',
                'wellness',
                'general'
            )
        )
);
create index chat_sessions_user_id_idx
on public.chat_sessions(user_id);
alter table public.chat_sessions enable row level security;
create policy "Users can view their own chat sessions"
on public.chat_sessions
for select
to authenticated
using (auth.uid() = user_id);
create policy "Users can create their own chat sessions"
on public.chat_sessions
for insert
to authenticated
with check (auth.uid() = user_id);
create policy "Users can update their own chat sessions"
on public.chat_sessions
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
create policy "Users can delete their own chat sessions"
on public.chat_sessions
for delete
to authenticated
using (auth.uid() = user_id);
-- ============================================================
-- CHAT MESSAGES
-- ============================================================
create table public.chat_messages (
    id uuid primary key default gen_random_uuid(),
    session_id uuid not null
        references public.chat_sessions(id)
        on delete cascade,
    user_id uuid not null
        references auth.users(id)
        on delete cascade,
    role text not null,
    message text not null,
    created_at timestamptz not null default now(),
    constraint chat_messages_role_valid
        check (
            role in ('user', 'assistant')
        )
);
create index chat_messages_user_id_idx
on public.chat_messages(user_id);
create index chat_messages_session_id_idx
on public.chat_messages(session_id);
alter table public.chat_messages enable row level security;
create policy "Users can view their own chat messages"
on public.chat_messages
for select
to authenticated
using (auth.uid() = user_id);
create policy "Users can create their own chat messages"
on public.chat_messages
for insert
to authenticated
with check (auth.uid() = user_id);
create policy "Users can update their own chat messages"
on public.chat_messages
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
create policy "Users can delete their own chat messages"
on public.chat_messages
for delete
to authenticated
using (auth.uid() = user_id);