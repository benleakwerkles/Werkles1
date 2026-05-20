-- Werkles Camelot admin bootstrap.
-- Run this in Supabase SQL Editor after the listed people have created Supabase Auth accounts
-- and their corresponding public.profiles rows exist.
--
-- Admin authorization must stay table-driven through public.admin_users.
-- Do not hardcode these emails into RLS policies.

with camelot_emails(email) as (
  values
    ('shaunmroberts1230@gmail.com'),
    ('ben.leak@kindsir.com')
),
matched_profiles as (
  select profile.id
  from camelot_emails camelot
  join auth.users auth_user on lower(auth_user.email) = camelot.email
  join public.profiles profile on profile.id = auth_user.id
)
insert into public.admin_users (user_id, granted_by)
select id, null
from matched_profiles
on conflict (user_id) do nothing;

-- Review this result after running. Any row marked pending needs the user to finish
-- Auth signup and profile creation before it can be added to public.admin_users.
with camelot_emails(email) as (
  values
    ('shaunmroberts1230@gmail.com'),
    ('ben.leak@kindsir.com')
)
select
  camelot.email,
  auth_user.id as auth_user_id,
  profile.id as profile_id,
  admin_user.user_id as admin_user_id,
  case
    when auth_user.id is null then 'pending_auth_account'
    when profile.id is null then 'pending_profile'
    when admin_user.user_id is null then 'pending_admin_insert'
    else 'admin_ready'
  end as bootstrap_status
from camelot_emails camelot
left join auth.users auth_user on lower(auth_user.email) = camelot.email
left join public.profiles profile on profile.id = auth_user.id
left join public.admin_users admin_user on admin_user.user_id = profile.id;
