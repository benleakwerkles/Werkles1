-- Werkles initial Supabase schema.
-- Source of truth: docs/architecture.md and ADR-001.
-- Compliance boundary: store verification receipts/statuses, not raw sensitive documents.

create extension if not exists pgcrypto;

create type public.user_lane as enum ('Builder', 'Operator', 'Backer', 'Connector', 'Spark');
create type public.work_preference as enum ('Local Only', 'Remote Only', 'Open to Travel', 'Willing to Relocate');
create type public.account_status as enum ('Active', 'Quarantined', 'Banned');
create type public.profile_visibility_mode as enum ('full_name', 'first_name_only', 'alias');
create type public.proof_category as enum ('Capital', 'Network', 'Pedigree', 'Spark', 'Operator/Executor/Builder', 'Hybrid');
create type public.project_environment as enum ('Physical', 'Digital', 'Hybrid');
create type public.blueprint_status as enum ('Draft', 'Active', 'Completed', 'Archived');
create type public.intro_request_status as enum (
  'Pending Co-Sign',
  'Auto-Approved',
  'Co-Signed',
  'Declined',
  'Expired',
  'Locked'
);
create type public.flag_reason as enum ('Ghosting', 'Stolen Valor/Fake Proof', 'Bad Faith', 'Other');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  first_name text,
  last_name text,
  email text,
  phone text,
  location_city text not null,
  location_state text not null,
  location_lat double precision,
  location_lng double precision,
  linkedin_url text,
  lane public.user_lane not null,
  work_preference public.work_preference not null,
  current_employer text,
  past_roles jsonb,
  skills_offered text[] not null default '{}',
  skills_sought text[] not null default '{}',
  industry_tags text[] not null default '{}',
  timeline_to_launch text,
  primary_goal text,
  visibility_mode public.profile_visibility_mode not null default 'full_name',
  show_employer boolean not null default false,
  account_status public.account_status not null default 'Active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_not_blank check (length(trim(display_name)) > 0),
  constraint profiles_location_city_not_blank check (length(trim(location_city)) > 0),
  constraint profiles_location_state_not_blank check (length(trim(location_state)) > 0),
  constraint profiles_lat_lng_pair check (
    (location_lat is null and location_lng is null) or
    (location_lat between -90 and 90 and location_lng between -180 and 180)
  ),
  constraint profiles_past_roles_array check (past_roles is null or jsonb_typeof(past_roles) = 'array')
);

comment on column public.profiles.phone is
  'Store only an encrypted value, provider token, or verification receipt. Do not store raw phone values unless project-level encryption is configured.';

alter table public.profiles enable row level security;

create table public.admin_users (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  granted_at timestamptz not null default now(),
  granted_by uuid references public.profiles(id)
);

alter table public.admin_users enable row level security;

create table public.beta_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  lane public.user_lane,
  signed_up_at timestamptz not null default now(),
  constraint beta_signups_email_not_blank check (length(trim(email)) > 0),
  constraint beta_signups_email_shape check (position('@' in email) > 1)
);

alter table public.beta_signups enable row level security;

create or replace function public.is_admin(check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = check_user_id
  );
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

create or replace function public.prevent_profile_status_self_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.account_status <> old.account_status and not public.is_admin() then
    raise exception 'Only admins can change account status';
  end if;

  return new;
end;
$$;

create trigger profiles_account_status_admin_only
before update on public.profiles
for each row execute function public.prevent_profile_status_self_change();

create view public.profiles_public
with (security_barrier = true)
as
select
  id,
  case
    when visibility_mode = 'full_name' then display_name
    when visibility_mode = 'first_name_only' then split_part(display_name, ' ', 1)
    when visibility_mode = 'alias' then display_name
  end as public_display_name,
  lane,
  location_city,
  location_state,
  work_preference,
  linkedin_url,
  case when show_employer then current_employer else null end as current_employer,
  skills_offered,
  skills_sought,
  industry_tags,
  timeline_to_launch,
  primary_goal,
  account_status,
  created_at
from public.profiles
where account_status = 'Active';

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (id = auth.uid());

create policy "Users can view own full profile"
  on public.profiles for select
  using (id = auth.uid());

create policy "Users can update own profile"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "Admins can manage profiles"
  on public.profiles for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Users can view own admin status"
  on public.admin_users for select
  using (user_id = auth.uid() or public.is_admin());

create policy "Admins can manage admin users"
  on public.admin_users for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can view beta signups"
  on public.beta_signups for select
  using (public.is_admin());

grant select, insert, update on public.profiles to authenticated;
grant select on public.profiles_public to authenticated;
grant select, insert, update, delete on public.admin_users to authenticated;
grant select on public.beta_signups to authenticated;

create table public.user_financials (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  capital_available_range int4range not null,
  capital_sought_range int4range not null,
  constraint user_financials_available_range_valid check (
    not isempty(capital_available_range) and lower(capital_available_range) >= 0
  ),
  constraint user_financials_sought_range_valid check (
    not isempty(capital_sought_range) and lower(capital_sought_range) >= 0
  )
);

alter table public.user_financials enable row level security;

create policy "Users can view own financials"
  on public.user_financials for select
  using (user_id = auth.uid());

create policy "Users can upsert own financials"
  on public.user_financials for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Admins can manage financial receipts"
  on public.user_financials for all
  using (public.is_admin())
  with check (public.is_admin());

grant select, insert, update, delete on public.user_financials to authenticated;

create table public.verification_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  proof_category public.proof_category not null,
  verification_source text,
  verified_timestamp timestamptz not null default now(),
  expires_at timestamptz,
  unique (user_id, proof_category),
  constraint verification_badges_expiry_after_verified check (
    expires_at is null or expires_at > verified_timestamp
  )
);

comment on table public.verification_badges is
  'Stores proof receipts/statuses only. Do not store raw ID images, face captures, bank documents, SSNs, or account numbers.';

create or replace function public.apply_verification_badge_decay()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.proof_category = 'Capital' then
    new.expires_at = new.verified_timestamp + interval '90 days';
  end if;

  return new;
end;
$$;

create trigger verification_badges_apply_decay
before insert or update on public.verification_badges
for each row execute function public.apply_verification_badge_decay();

create view public.verified_badges_view
with (security_barrier = true)
as
select user_id, proof_category, verification_source, verified_timestamp
from public.verification_badges
where expires_at is null or expires_at > now();

alter table public.verification_badges enable row level security;

create policy "Users can view own verification badges"
  on public.verification_badges for select
  using (user_id = auth.uid());

create policy "Admins can manage verification badges"
  on public.verification_badges for all
  using (public.is_admin())
  with check (public.is_admin());

grant select, insert, update, delete on public.verification_badges to authenticated;
grant select on public.verified_badges_view to authenticated;

create table public.blueprints (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  project_environment public.project_environment not null,
  status public.blueprint_status not null default 'Draft',
  location_lat double precision,
  location_lng double precision,
  created_at timestamptz not null default now(),
  constraint blueprints_name_not_blank check (length(trim(name)) > 0),
  constraint blueprints_lat_lng_pair check (
    (location_lat is null and location_lng is null) or
    (location_lat between -90 and 90 and location_lng between -180 and 180)
  )
);

alter table public.blueprints enable row level security;

create policy "Active blueprints viewable by all authenticated"
  on public.blueprints for select
  using (status = 'Active');

create policy "Creators can view own blueprints"
  on public.blueprints for select
  using (creator_id = auth.uid());

create policy "Creators can create blueprints"
  on public.blueprints for insert
  with check (creator_id = auth.uid());

create policy "Creator can update own blueprint"
  on public.blueprints for update
  using (creator_id = auth.uid())
  with check (creator_id = auth.uid());

create policy "Admins can manage blueprints"
  on public.blueprints for all
  using (public.is_admin())
  with check (public.is_admin());

grant select, insert, update, delete on public.blueprints to authenticated;

create table public.blueprint_members (
  blueprint_id uuid not null references public.blueprints(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  lane_filled public.user_lane not null,
  joined_at timestamptz not null default now(),
  primary key (blueprint_id, user_id)
);

alter table public.blueprint_members enable row level security;

create or replace function public.is_blueprint_member(
  check_blueprint_id uuid,
  check_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.blueprint_members
    where blueprint_id = check_blueprint_id
      and user_id = check_user_id
  );
$$;

create or replace function public.is_blueprint_creator(
  check_blueprint_id uuid,
  check_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.blueprints
    where id = check_blueprint_id
      and creator_id = check_user_id
  );
$$;

create table public.blocked_users (
  blocker_user_id uuid not null references public.profiles(id) on delete cascade,
  blocked_user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_user_id, blocked_user_id),
  check (blocker_user_id <> blocked_user_id)
);

alter table public.blocked_users enable row level security;

create or replace function public.is_blocked_between(
  left_user_id uuid,
  right_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.blocked_users
    where (blocker_user_id = left_user_id and blocked_user_id = right_user_id)
       or (blocker_user_id = right_user_id and blocked_user_id = left_user_id)
  );
$$;

create or replace function public.enforce_blueprint_lane_cap()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  member_lane public.user_lane;
  active_blueprint_count integer;
  target_blueprint_status public.blueprint_status;
begin
  if exists (
    select 1
    from public.blueprint_members existing
    where existing.blueprint_id = new.blueprint_id
      and existing.lane_filled = new.lane_filled
      and existing.user_id <> new.user_id
  ) then
    raise exception 'Blueprint lane % is already filled for blueprint %', new.lane_filled, new.blueprint_id
      using errcode = '23505';
  end if;

  select lane into member_lane
  from public.profiles
  where id = new.user_id;

  select status into target_blueprint_status
  from public.blueprints
  where id = new.blueprint_id;

  if target_blueprint_status = 'Active' then
    select count(*) into active_blueprint_count
    from public.blueprint_members member
    join public.blueprints blueprint on blueprint.id = member.blueprint_id
    where member.user_id = new.user_id
      and blueprint.status = 'Active'
      and member.blueprint_id <> new.blueprint_id;

    if member_lane in ('Builder', 'Operator', 'Connector') and active_blueprint_count >= 3 then
      raise exception '% lane users can join at most 3 active blueprints', member_lane
        using errcode = '23514';
    end if;

    if member_lane in ('Backer', 'Spark') and active_blueprint_count >= 10 then
      raise exception '% lane users can join at most 10 active blueprints', member_lane
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

create trigger blueprint_members_lane_cap
before insert or update on public.blueprint_members
for each row execute function public.enforce_blueprint_lane_cap();

create policy "Members can see rosters of their blueprints"
  on public.blueprint_members for select
  using (
    user_id = auth.uid()
    or public.is_blueprint_member(blueprint_id)
    or public.is_blueprint_creator(blueprint_id)
    or public.is_admin()
  );

create policy "Users can join active blueprints as themselves"
  on public.blueprint_members for insert
  with check (
    user_id = auth.uid()
    and blueprint_id in (
      select blueprint_lookup.id
      from public.blueprints blueprint_lookup
      where blueprint_lookup.status = 'Active'
    )
  );

create policy "Users can leave own blueprint membership"
  on public.blueprint_members for delete
  using (user_id = auth.uid() or public.is_admin());

create policy "Admins can manage blueprint members"
  on public.blueprint_members for all
  using (public.is_admin())
  with check (public.is_admin());

grant select, insert, update, delete on public.blueprint_members to authenticated;

create table public.intro_requests (
  id uuid primary key default gen_random_uuid(),
  blueprint_id uuid not null references public.blueprints(id) on delete cascade,
  scout_user_id uuid not null references public.profiles(id) on delete cascade,
  target_user_id uuid not null references public.profiles(id) on delete cascade,
  co_sign_user_id uuid not null references public.profiles(id) on delete cascade,
  status public.intro_request_status not null default 'Pending Co-Sign',
  message text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '48 hours'),
  unique (blueprint_id, scout_user_id, target_user_id),
  constraint intro_requests_distinct_users check (
    scout_user_id <> target_user_id
    and scout_user_id <> co_sign_user_id
    and target_user_id <> co_sign_user_id
  ),
  constraint intro_requests_expiry_after_created check (expires_at > created_at)
);

alter table public.intro_requests enable row level security;

create or replace function public.enforce_intro_request_status_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status in ('Co-Signed', 'Auto-Approved') then
    if not public.is_blueprint_member(new.blueprint_id, new.scout_user_id)
      or not public.is_blueprint_member(new.blueprint_id, new.co_sign_user_id) then
      raise exception 'Scout and co-signer must both still belong to the blueprint';
    end if;
  end if;

  if current_setting('app.werkles_ttl_job', true) = 'on'
    and old.status = 'Pending Co-Sign'
    and new.status in ('Auto-Approved', 'Expired') then
    return new;
  end if;

  if public.is_admin() then
    return new;
  end if;

  if new.id <> old.id
    or new.blueprint_id <> old.blueprint_id
    or new.scout_user_id <> old.scout_user_id
    or new.target_user_id <> old.target_user_id
    or new.co_sign_user_id <> old.co_sign_user_id
    or new.message is distinct from old.message
    or new.created_at <> old.created_at
    or new.expires_at <> old.expires_at then
    raise exception 'Intro request updates can only change status';
  end if;

  if auth.uid() = old.co_sign_user_id then
    if old.status <> 'Pending Co-Sign' or new.status not in ('Co-Signed', 'Declined') then
      raise exception 'Co-signer can only co-sign or decline pending requests';
    end if;

    return new;
  end if;

  if auth.uid() = old.target_user_id then
    if old.status not in ('Co-Signed', 'Auto-Approved') or new.status not in ('Locked', 'Declined') then
      raise exception 'Target can only lock or decline approved intro requests';
    end if;

    return new;
  end if;

  raise exception 'Not allowed to update intro request status';

  return new;
end;
$$;

create trigger intro_requests_status_update_only
before update on public.intro_requests
for each row
when (old.status is distinct from new.status)
execute function public.enforce_intro_request_status_update();

create policy "Scout can create request"
  on public.intro_requests for insert
  with check (
    scout_user_id = auth.uid()
    and public.is_blueprint_member(blueprint_id, auth.uid())
    and public.is_blueprint_member(blueprint_id, co_sign_user_id)
    and co_sign_user_id <> auth.uid()
    and not public.is_blocked_between(scout_user_id, target_user_id)
    and not public.is_blocked_between(co_sign_user_id, target_user_id)
  );

create policy "Involved parties can view"
  on public.intro_requests for select
  using (
    scout_user_id = auth.uid()
    or co_sign_user_id = auth.uid()
    or target_user_id = auth.uid()
    or public.is_admin()
  );

create policy "Co-signer can update status"
  on public.intro_requests for update
  using (co_sign_user_id = auth.uid() and status = 'Pending Co-Sign')
  with check (status in ('Co-Signed', 'Declined'));

create policy "Target can lock or decline approved request"
  on public.intro_requests for update
  using (target_user_id = auth.uid() and status in ('Co-Signed', 'Auto-Approved'))
  with check (status in ('Locked', 'Declined'));

create policy "Admins can manage intro requests"
  on public.intro_requests for all
  using (public.is_admin())
  with check (public.is_admin());

grant select, insert, update, delete on public.intro_requests to authenticated;

create or replace function public.process_intro_request_ttl()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  changed_count integer;
begin
  perform set_config('app.werkles_ttl_job', 'on', true);

  update public.intro_requests request
  set status = case
    when public.is_blueprint_member(request.blueprint_id, request.scout_user_id)
      and public.is_blueprint_member(request.blueprint_id, request.co_sign_user_id)
      then 'Auto-Approved'::public.intro_request_status
    else 'Expired'::public.intro_request_status
  end
  where request.status = 'Pending Co-Sign'
    and request.expires_at < now();

  get diagnostics changed_count = row_count;
  return changed_count;
end;
$$;

comment on function public.process_intro_request_ttl() is
  'Run hourly via pg_cron or Supabase Edge Function. Pending expired requests auto-approve only when scout and co-signer are still blueprint members; otherwise they expire.';

create policy "Users manage own block list"
  on public.blocked_users for all
  using (blocker_user_id = auth.uid())
  with check (blocker_user_id = auth.uid());

create policy "Admins can view block lists"
  on public.blocked_users for select
  using (public.is_admin());

grant select, insert, update, delete on public.blocked_users to authenticated;

create or replace function public.distance_miles(
  left_lat double precision,
  left_lng double precision,
  right_lat double precision,
  right_lng double precision
)
returns double precision
language sql
immutable
returns null on null input
as $$
  select 3958.8 * acos(
    least(
      1,
      greatest(
        -1,
        sin(radians(left_lat)) * sin(radians(right_lat)) +
        cos(radians(left_lat)) * cos(radians(right_lat)) *
        cos(radians(right_lng - left_lng))
      )
    )
  );
$$;

create or replace function public.matchable_profiles_for(check_user_id uuid default auth.uid())
returns table (
  id uuid,
  public_display_name text,
  lane public.user_lane,
  location_city text,
  location_state text,
  work_preference public.work_preference,
  linkedin_url text,
  current_employer text,
  skills_offered text[],
  skills_sought text[],
  industry_tags text[],
  timeline_to_launch text,
  primary_goal text,
  created_at timestamptz,
  proof_categories public.proof_category[]
)
language sql
stable
security definer
set search_path = public
as $$
  select
    profile.id,
    profile.public_display_name,
    profile.lane,
    profile.location_city,
    profile.location_state,
    profile.work_preference,
    profile.linkedin_url,
    profile.current_employer,
    profile.skills_offered,
    profile.skills_sought,
    profile.industry_tags,
    profile.timeline_to_launch,
    profile.primary_goal,
    profile.created_at,
    coalesce(
      array_agg(badge.proof_category) filter (where badge.proof_category is not null),
      '{}'::public.proof_category[]
    ) as proof_categories
  from public.profiles_public profile
  left join public.verified_badges_view badge on badge.user_id = profile.id
  where profile.id <> check_user_id
    and not public.is_blocked_between(check_user_id, profile.id)
  group by
    profile.id,
    profile.public_display_name,
    profile.lane,
    profile.location_city,
    profile.location_state,
    profile.work_preference,
    profile.linkedin_url,
    profile.current_employer,
    profile.skills_offered,
    profile.skills_sought,
    profile.industry_tags,
    profile.timeline_to_launch,
    profile.primary_goal,
    profile.created_at;
$$;

grant execute on function public.matchable_profiles_for(uuid) to authenticated;

create or replace function public.match_candidates_for_blueprint(
  p_blueprint_id uuid,
  p_scout_user_id uuid default auth.uid()
)
returns table (
  target_user_id uuid,
  score integer,
  factors jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  with blueprint as (
    select blueprint.*
    from public.blueprints blueprint
    where blueprint.id = p_blueprint_id
      and (
        blueprint.status = 'Active'
        or blueprint.creator_id = p_scout_user_id
        or public.is_blueprint_member(blueprint.id, p_scout_user_id)
        or public.is_admin()
      )
  ),
  scout as (
    select profile.*
    from public.profiles profile
    where profile.id = p_scout_user_id
      and profile.account_status = 'Active'
      and (profile.id = auth.uid() or public.is_admin())
  ),
  scout_financials as (
    select financials.*
    from public.user_financials financials
    where financials.user_id = p_scout_user_id
  ),
  candidate_inputs as (
    select
      candidate.id,
      candidate.lane as candidate_lane,
      scout.lane as scout_lane,
      candidate.work_preference,
      candidate.skills_offered,
      candidate.skills_sought,
      candidate.industry_tags,
      candidate.timeline_to_launch,
      scout.timeline_to_launch as scout_timeline_to_launch,
      candidate.primary_goal,
      scout.primary_goal as scout_primary_goal,
      blueprint.project_environment,
      public.distance_miles(
        blueprint.location_lat,
        blueprint.location_lng,
        candidate.location_lat,
        candidate.location_lng
      ) as distance_from_blueprint,
      exists (
        select 1
        from public.verified_badges_view badge
        where badge.user_id = candidate.id
          and badge.proof_category = 'Capital'::public.proof_category
      ) as has_verified_capital,
      coalesce(
        candidate_financials.capital_available_range && scout_financials.capital_sought_range,
        false
      ) as capital_ranges_overlap,
      coalesce(
        (
          select array_agg(distinct skill.value order by skill.value)
          from unnest(scout.skills_sought) as skill(value)
          where skill.value = any(candidate.skills_offered)
        ),
        '{}'::text[]
      ) as matching_skills,
      coalesce(
        (
          select array_agg(distinct tag.value order by tag.value)
          from unnest(scout.industry_tags) as tag(value)
          where tag.value = any(candidate.industry_tags)
        ),
        '{}'::text[]
      ) as matching_industries
    from blueprint
    cross join scout
    join public.profiles candidate on candidate.account_status = 'Active'
    left join public.user_financials candidate_financials on candidate_financials.user_id = candidate.id
    left join scout_financials on true
    where candidate.id <> p_scout_user_id
      and not public.is_blueprint_member(p_blueprint_id, candidate.id)
      and not public.is_blocked_between(p_scout_user_id, candidate.id)
  ),
  scored as (
    select
      candidate_inputs.*,
      case
        when project_environment = 'Digital' then 0
        when distance_from_blueprint is null then 0
        when distance_from_blueprint > 50
          and work_preference in ('Open to Travel'::public.work_preference, 'Willing to Relocate'::public.work_preference)
          then 0
        when distance_from_blueprint > 50 then -100
        else 20
      end as location_score,
      case
        when array[scout_lane::text, candidate_lane::text] @> array['Operator', 'Backer'] then 25
        when array[scout_lane::text, candidate_lane::text] @> array['Spark', 'Operator'] then 20
        when array[scout_lane::text, candidate_lane::text] @> array['Operator', 'Connector'] then 20
        when array[scout_lane::text, candidate_lane::text] @> array['Operator', 'Builder'] then 20
        when array[scout_lane::text, candidate_lane::text] @> array['Spark', 'Backer'] then 15
        when array[scout_lane::text, candidate_lane::text] @> array['Backer', 'Connector'] then 15
        when array[scout_lane::text, candidate_lane::text] @> array['Builder', 'Backer'] then 15
        when scout_lane = 'Builder'::public.user_lane and candidate_lane = 'Builder'::public.user_lane then 10
        when scout_lane = 'Backer'::public.user_lane and candidate_lane = 'Backer'::public.user_lane then 10
        when array[scout_lane::text, candidate_lane::text] @> array['Spark', 'Builder'] then 10
        when array[scout_lane::text, candidate_lane::text] @> array['Connector', 'Builder'] then 10
        when scout_lane = 'Operator'::public.user_lane and candidate_lane = 'Operator'::public.user_lane then 5
        when array[scout_lane::text, candidate_lane::text] @> array['Spark', 'Connector'] then 5
        when scout_lane = 'Spark'::public.user_lane and candidate_lane = 'Spark'::public.user_lane then 0
        when scout_lane = 'Connector'::public.user_lane and candidate_lane = 'Connector'::public.user_lane then 0
        else 0
      end as lane_score,
      case
        when array[scout_lane::text, candidate_lane::text] @> array['Operator', 'Backer']
          then 'An Operator and a Backer is the golden combo: proven execution meets verified capital.'
        when array[scout_lane::text, candidate_lane::text] @> array['Spark', 'Operator']
          then 'An idea meets the person who can get the licenses and run the schedule.'
        when array[scout_lane::text, candidate_lane::text] @> array['Operator', 'Connector']
          then 'Operator builds/delivers, Connector sells/manages the books.'
        when array[scout_lane::text, candidate_lane::text] @> array['Operator', 'Builder']
          then 'Operator manages the site, Builder provides the raw execution/crew.'
        when array[scout_lane::text, candidate_lane::text] @> array['Spark', 'Backer']
          then 'Idea meets money - solid, but you''ll want an Operator soon.'
        when array[scout_lane::text, candidate_lane::text] @> array['Backer', 'Connector']
          then 'Capital meets sales/audience. Great for franchises or CPG.'
        when array[scout_lane::text, candidate_lane::text] @> array['Builder', 'Backer']
          then 'Sweat meets Equity. Needs operational oversight eventually.'
        when scout_lane = 'Builder'::public.user_lane and candidate_lane = 'Builder'::public.user_lane
          then 'Crew Formation: Good for scaling labor, but missing business infrastructure.'
        when scout_lane = 'Backer'::public.user_lane and candidate_lane = 'Backer'::public.user_lane
          then 'Two wallets joining forces to fund a larger room.'
        when array[scout_lane::text, candidate_lane::text] @> array['Spark', 'Builder']
          then 'Idea meets labor. Plucky, but chaotic without an Operator.'
        when array[scout_lane::text, candidate_lane::text] @> array['Connector', 'Builder']
          then 'Sales meets product. Missing the operational middle layer.'
        when scout_lane = 'Operator'::public.user_lane and candidate_lane = 'Operator'::public.user_lane
          then 'Potential ''too many cooks'' situation, unless skills are vastly different.'
        when array[scout_lane::text, candidate_lane::text] @> array['Spark', 'Connector']
          then 'Idea meets sales. What are you selling if it''s not built yet?'
        when scout_lane = 'Spark'::public.user_lane and candidate_lane = 'Spark'::public.user_lane
          then 'Two idea people, no execution. The classic coffee shop trap.'
        when scout_lane = 'Connector'::public.user_lane and candidate_lane = 'Connector'::public.user_lane
          then 'Two salespeople, no product.'
        else 'No special lane complementarity rule fired.'
      end as lane_reason,
      case when has_verified_capital and capital_ranges_overlap then 20 else 0 end as capital_score,
      least(cardinality(matching_skills) * 10, 20) as skill_score,
      least(cardinality(matching_industries) * 5, 15) as industry_score,
      case
        when scout_timeline_to_launch is not null
          and timeline_to_launch is not null
          and scout_timeline_to_launch = timeline_to_launch
          then 5
        else 0
      end as timeline_score,
      case
        when scout_primary_goal is not null
          and primary_goal is not null
          and scout_primary_goal = primary_goal
          then 5
        else 0
      end as goal_score,
      case
        when (
          scout_primary_goal = 'Venture Scale/Exit'
          and primary_goal = 'Generational Family Business'
        ) or (
          scout_primary_goal = 'Generational Family Business'
          and primary_goal = 'Venture Scale/Exit'
        )
          then -15
        else 0
      end as endgame_penalty
    from candidate_inputs
  )
  select
    id as target_user_id,
    (
      location_score +
      lane_score +
      capital_score +
      skill_score +
      industry_score +
      timeline_score +
      goal_score +
      endgame_penalty
    )::integer as score,
    jsonb_build_object(
      'location_fit',
        case
          when project_environment = 'Digital' then '0 (Digital blueprint: distance ignored)'
          when distance_from_blueprint is null then '0 (Location unavailable for one side)'
          when distance_from_blueprint > 50
            and work_preference in ('Open to Travel'::public.work_preference, 'Willing to Relocate'::public.work_preference)
            then '0 (Outside 50 miles, but open to travel or relocate)'
          when distance_from_blueprint > 50 then '-100 (Outside 50 miles and not travel-ready)'
          else '+20 (Within 50 miles)'
        end,
      'lane_fit',
        case when lane_score > 0 then '+' else '' end || lane_score::text || ' (' || lane_reason || ')',
      'capital_overlap',
        case
          when capital_score > 0 then '+20 (Verified capital aligns with your needs)'
          when has_verified_capital then '0 (Candidate has a Capital badge, but no requested range overlap)'
          else '0 (No unexpired Capital badge on candidate)'
        end,
      'skill_match',
        case
          when skill_score > 0 then '+' || skill_score::text || ' (They bring ' || array_to_string(matching_skills, ', ') || ', which is exactly what you are looking for)'
          else '0 (No direct skill lock-and-key yet)'
        end,
      'industry_match',
        case
          when industry_score > 0 then '+' || industry_score::text || ' (Both operating in ' || array_to_string(matching_industries, ', ') || ')'
          else '0 (No shared industry tags yet)'
        end,
      'timeline_match',
        case
          when timeline_score > 0 then '+5 (Launch timeline matches)'
          else '0 (Launch timeline is not aligned or is unknown)'
        end,
      'goal_match',
        case
          when goal_score > 0 then '+5 (Primary goal matches)'
          else '0 (Primary goal is not aligned or is unknown)'
        end,
      'endgame_dealbreaker',
        case
          when endgame_penalty < 0 then '-15 (Venture Scale/Exit and Generational Family Business are conflicting endgames)'
          else '0 (No endgame dealbreaker)'
        end
    ) as factors
  from scored
  order by 2 desc, 1;
$$;

grant execute on function public.match_candidates_for_blueprint(uuid, uuid) to authenticated;

create table public.user_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_user_id uuid not null references public.profiles(id) on delete cascade,
  reason public.flag_reason not null,
  details text,
  status text not null default 'Pending' check (status in ('Pending', 'Investigating', 'Resolved')),
  created_at timestamptz not null default now(),
  constraint user_reports_no_self_report check (reporter_id <> reported_user_id)
);

alter table public.user_reports enable row level security;

create policy "Users can report"
  on public.user_reports for insert
  with check (reporter_id = auth.uid());

create policy "Users can view reports they filed"
  on public.user_reports for select
  using (reporter_id = auth.uid() or public.is_admin());

create policy "Admins can update reports"
  on public.user_reports for update
  using (public.is_admin())
  with check (public.is_admin());

grant select, insert, update on public.user_reports to authenticated;

create index profiles_lane_idx on public.profiles(lane);
create index profiles_location_idx on public.profiles(location_state, location_city);
create index profiles_account_status_idx on public.profiles(account_status);
create index profiles_skills_offered_idx on public.profiles using gin(skills_offered);
create index profiles_skills_sought_idx on public.profiles using gin(skills_sought);
create index profiles_industry_tags_idx on public.profiles using gin(industry_tags);
create index verification_badges_user_idx on public.verification_badges(user_id);
create index verification_badges_expiry_idx on public.verification_badges(expires_at);
create index blueprints_creator_idx on public.blueprints(creator_id);
create index blueprints_status_idx on public.blueprints(status);
create index blueprint_members_user_idx on public.blueprint_members(user_id);
create index blueprint_members_lane_idx on public.blueprint_members(blueprint_id, lane_filled);
create index intro_requests_scout_idx on public.intro_requests(scout_user_id);
create index intro_requests_target_idx on public.intro_requests(target_user_id);
create index intro_requests_cosign_idx on public.intro_requests(co_sign_user_id);
create index intro_requests_expiry_idx on public.intro_requests(expires_at);
create index blocked_users_blocked_idx on public.blocked_users(blocked_user_id);
create index user_reports_reported_idx on public.user_reports(reported_user_id);
create index user_reports_status_idx on public.user_reports(status);
