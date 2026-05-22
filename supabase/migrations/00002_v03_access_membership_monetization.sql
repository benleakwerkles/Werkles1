-- Werkles v0.3: access weight, onboarding depth, membership, verification gates,
-- and the first revenue-engine foundations.

alter type public.blueprint_status add value if not exists 'Locked';

alter table public.profiles
  add column if not exists profile_depth text default 'quick_weld'
    check (profile_depth in ('quick_weld','full_audit','blueprint')),
  add column if not exists membership_tier text default 'free'
    check (membership_tier in ('free','member')),
  add column if not exists email_status text default 'unverified'
    check (email_status in ('unverified','verified')),
  add column if not exists id_status text default 'none'
    check (id_status in ('none','sandbox_pending','sandbox_verified','live_verified')),
  add column if not exists funds_status text default 'none'
    check (funds_status in ('none','sandbox_pending','sandbox_verified','live_verified')),
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_status text,
  add column if not exists current_period_end timestamptz,
  add column if not exists turf_zip text,
  add column if not exists blueprint_narrative text,
  add column if not exists deep_audit_status text default 'none'
    check (deep_audit_status in ('none','requested','processing','cleared','failed'));

alter table public.blueprints
  add column if not exists flare_active_until timestamptz;

create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  arena text not null,
  turf text not null,
  service_type text not null,
  monthly_fee_status text not null default 'pending'
    check (monthly_fee_status in ('pending','active','past_due','paused','canceled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.vendors enable row level security;

drop policy if exists "Authenticated users can view active vendors" on public.vendors;
create policy "Authenticated users can view active vendors"
  on public.vendors for select
  to authenticated
  using (monthly_fee_status = 'active');

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

drop policy if exists "Anyone can see active profiles (public view columns)" on public.profiles;
grant select on public.profiles to authenticated;
grant select on public.profiles_public to authenticated;

create or replace function public.access_weight(p_user_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select case
      when id_status = 'live_verified'
       and funds_status = 'live_verified'
       and membership_tier = 'member' then 'heavyweight'
      when membership_tier = 'member'
        or profile_depth in ('full_audit','blueprint') then 'middleweight'
      else 'lightweight'
    end
    from public.profiles
    where id = p_user_id
  ), 'lightweight');
$$;

grant execute on function public.access_weight(uuid) to authenticated;

drop policy if exists "Lightweight cannot target Heavyweight" on public.intro_requests;
create policy "Lightweight cannot target Heavyweight"
  on public.intro_requests
  as restrictive
  for insert
  to authenticated
  with check (
    not (
      public.access_weight(auth.uid()) = 'lightweight'
      and public.access_weight(target_user_id) = 'heavyweight'
    )
  );

drop policy if exists "Only active members can create intro requests" on public.intro_requests;
create policy "Only active members can create intro requests"
  on public.intro_requests
  as restrictive
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.membership_tier = 'member'
        and p.subscription_status = 'active'
    )
  );

-- Users may create and maintain their own dossier, but trust-state, membership,
-- verification, account status, and audit state are server-owned facts.
revoke insert, update on public.profiles from authenticated;
grant insert (
  id,
  display_name,
  first_name,
  last_name,
  email,
  phone,
  location_city,
  location_state,
  location_lat,
  location_lng,
  linkedin_url,
  lane,
  work_preference,
  current_employer,
  past_roles,
  skills_offered,
  skills_sought,
  industry_tags,
  timeline_to_launch,
  primary_goal,
  visibility_mode,
  show_employer,
  profile_depth,
  turf_zip,
  blueprint_narrative
) on public.profiles to authenticated;
grant update (
  id,
  display_name,
  first_name,
  last_name,
  email,
  phone,
  location_city,
  location_state,
  location_lat,
  location_lng,
  linkedin_url,
  lane,
  work_preference,
  current_employer,
  past_roles,
  skills_offered,
  skills_sought,
  industry_tags,
  timeline_to_launch,
  primary_goal,
  visibility_mode,
  show_employer,
  profile_depth,
  turf_zip,
  blueprint_narrative
) on public.profiles to authenticated;

create or replace function public.fire_flare(
  p_blueprint_id uuid,
  p_arena text,
  p_turf text
)
returns table (
  blueprint_id uuid,
  flare_active_until timestamptz,
  matching_heavyweights int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_until timestamptz := now() + interval '72 hours';
  v_matching_heavyweights int := 0;
begin
  -- Skeleton only: call this from trusted server code after a future
  -- one-time Stripe flare checkout succeeds.
  update public.blueprints
    set flare_active_until = v_until
    where id = p_blueprint_id;

  select count(*) into v_matching_heavyweights
  from public.profiles p
  where public.access_weight(p.id) = 'heavyweight'
    and p.account_status = 'Active'
    and (
      p_arena is null
      or p_arena = ''
      or p_arena = any(p.industry_tags)
    )
    and (
      p_turf is null
      or p_turf = ''
      or p.turf_zip = p_turf
      or lower(p.location_city || ', ' || p.location_state) = lower(p_turf)
    );

  return query
    select p_blueprint_id, v_until, v_matching_heavyweights;
end;
$$;

revoke all on function public.fire_flare(uuid, text, text) from public, anon, authenticated;

comment on table public.vendors is
  'Tool Shed vendors: vetted service providers surfaced after a blueprint is locked.';
comment on column public.profiles.deep_audit_status is
  'Deep Audit queue state for premium manual verification review.';
comment on column public.blueprints.flare_active_until is
  'Firing a Flare visibility window, set only after future one-time payment confirmation.';
