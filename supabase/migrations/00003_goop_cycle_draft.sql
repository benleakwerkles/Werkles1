-- DRAFT: Goop Cycle PvP — DO NOT APPLY without human gate.
-- Preview uses localStorage + API sim until approved.

create type public.goop_religion as enum (
  'ember_covenant',
  'tide_canticle',
  'copper_veil',
  'root_compact',
  'spark_choir'
);

create type public.goop_life_skill as enum (
  'foraging',
  'smithing',
  'lore',
  'rhetoric',
  'beastkeeping',
  'alchemy'
);

create type public.goop_quest_status as enum ('locked', 'active', 'complete', 'claimed');

create table public.goop_cycles (
  id text primary key,
  cycle_index integer not null,
  goop_theme text not null,
  goop_prize text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.goop_religion_standings (
  cycle_id text not null references public.goop_cycles(id) on delete cascade,
  religion public.goop_religion not null,
  points integer not null default 0 check (points >= 0),
  duels_won integer not null default 0 check (duels_won >= 0),
  quests_claimed integer not null default 0 check (quests_claimed >= 0),
  primary key (cycle_id, religion)
);

create table public.goop_player_state (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  religion public.goop_religion,
  fusion_catalysts integer not null default 0 check (fusion_catalysts >= 0),
  war_points_contributed integer not null default 0 check (war_points_contributed >= 0),
  skills jsonb not null default '{}',
  quests jsonb not null default '[]',
  updated_at timestamptz not null default now()
);

create table public.goop_summons (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  essence text not null,
  generation integer not null default 0 check (generation >= 0),
  stats jsonb not null,
  traits text[] not null default '{}',
  parent_a_id uuid references public.goop_summons(id),
  parent_b_id uuid references public.goop_summons(id),
  level integer not null default 1 check (level >= 1),
  xp integer not null default 0 check (xp >= 0),
  religion_affinity public.goop_religion,
  created_at timestamptz not null default now()
);

create table public.goop_duels (
  id uuid primary key default gen_random_uuid(),
  cycle_id text not null references public.goop_cycles(id),
  summon_a_id uuid not null references public.goop_summons(id),
  summon_b_id uuid not null references public.goop_summons(id),
  winner_id uuid not null references public.goop_summons(id),
  religion_a public.goop_religion not null,
  religion_b public.goop_religion not null,
  war_points integer not null check (war_points >= 0),
  log jsonb not null default '[]',
  created_at timestamptz not null default now()
);

alter table public.goop_cycles enable row level security;
alter table public.goop_religion_standings enable row level security;
alter table public.goop_player_state enable row level security;
alter table public.goop_summons enable row level security;
alter table public.goop_duels enable row level security;

-- RLS policies to be defined when lane opens for schema apply.
