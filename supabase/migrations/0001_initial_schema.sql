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