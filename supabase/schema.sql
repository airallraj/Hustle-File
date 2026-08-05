-- ============================================================
-- THE HUSTLE FILE — SUPABASE SCHEMA
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================================

-- ---------- PROFILES ----------
-- One row per signed-up user. Auto-created on signup via trigger below.
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  name text not null default 'Operator',
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Users can view their own profile"
  on profiles for select using (auth.uid() = id);
create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = id);

-- Auto-create a profile row whenever someone signs up via Supabase Auth.
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', 'Operator'));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ---------- SUBSCRIPTIONS ----------
-- Keyed by email, not user_id, because Stripe fires the webhook the moment
-- someone pays — which can happen before they've ever created an account here.
-- Written ONLY by the Stripe webhook function (using the service role key,
-- which bypasses RLS). No insert/update policy is granted to normal users.
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text not null default 'inactive', -- active | canceled | past_due | inactive
  plan text,                                -- monthly | annual
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table subscriptions enable row level security;

create policy "Users can view their own subscription"
  on subscriptions for select
  using (email = (auth.jwt() ->> 'email'));

-- ---------- PROJECTS (saved case files) ----------
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  case_id text not null,
  opp_id text not null,
  name text not null,
  tagline text,
  category text,
  offer text,
  pricing_text text,
  tools jsonb default '[]',
  checklist jsonb default '[]',
  find_customers jsonb default '[]',
  risks jsonb default '[]',
  answers jsonb default '{}',
  renamed boolean not null default false,
  archived boolean not null default false,
  pinned boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table projects enable row level security;

create policy "Users can manage their own projects"
  on projects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------- GOALS ----------
create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects on delete cascade not null,
  text text not null,
  done boolean not null default false,
  source text not null default 'custom', -- 'auto' | 'custom'
  group_name text not null default 'custom', -- '7day' | '30day' | 'custom'
  due_date timestamptz,
  created_at timestamptz not null default now()
);

alter table goals enable row level security;

create policy "Users can manage goals on their own projects"
  on goals for all
  using (exists (select 1 from projects where projects.id = goals.project_id and projects.user_id = auth.uid()))
  with check (exists (select 1 from projects where projects.id = goals.project_id and projects.user_id = auth.uid()));

-- ---------- NOTES (Key Decisions Log) ----------
create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects on delete cascade not null,
  coach text not null,
  text text not null,
  created_at timestamptz not null default now()
);

alter table notes enable row level security;

create policy "Users can manage notes on their own projects"
  on notes for all
  using (exists (select 1 from projects where projects.id = notes.project_id and projects.user_id = auth.uid()))
  with check (exists (select 1 from projects where projects.id = notes.project_id and projects.user_id = auth.uid()));

-- ---------- COACH MESSAGES ----------
create table if not exists coach_messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects on delete cascade not null,
  coach text not null, -- business | marketing | sales | content | branding
  role text not null,  -- user | assistant
  content text not null,
  created_at timestamptz not null default now()
);

alter table coach_messages enable row level security;

create policy "Users can manage coach messages on their own projects"
  on coach_messages for all
  using (exists (select 1 from projects where projects.id = coach_messages.project_id and projects.user_id = auth.uid()))
  with check (exists (select 1 from projects where projects.id = coach_messages.project_id and projects.user_id = auth.uid()));

-- ---------- ACTIVITY FEED ----------
create table if not exists activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  text text not null,
  created_at timestamptz not null default now()
);

alter table activity enable row level security;

create policy "Users can manage their own activity"
  on activity for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Helpful index for the dashboard's "recent activity" query
create index if not exists activity_user_created_idx on activity (user_id, created_at desc);
create index if not exists goals_project_idx on goals (project_id);
create index if not exists coach_messages_project_coach_idx on coach_messages (project_id, coach);
