-- PeerSkill: run this entire script in Supabase Dashboard -> SQL Editor -> New query.
-- Uses the existing Supabase Auth users; never expose the service-role key in the browser.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default 'Learner',
  bio text not null default '',
  skills text[] not null default '{}',
  learning_interests text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.learning_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  skill text not null,
  message text not null default '',
  status text not null default 'pending' check (status in ('pending','accepted','declined','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint different_peers check (requester_id <> recipient_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.learning_requests(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index if not exists profiles_skills_gin on public.profiles using gin (skills);
create index if not exists learning_requests_recipient_idx on public.learning_requests (recipient_id, status, created_at desc);
create index if not exists learning_requests_requester_idx on public.learning_requests (requester_id, status, created_at desc);
create index if not exists messages_request_idx on public.messages (request_id, created_at);

alter table public.profiles enable row level security;
alter table public.learning_requests enable row level security;
alter table public.messages enable row level security;

-- Profiles are discoverable by signed-in users; only the owner can change their own profile.
drop policy if exists "Signed-in users can view profiles" on public.profiles;
create policy "Signed-in users can view profiles" on public.profiles for select to authenticated using (true);
drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- A learner can create a request as themselves. Only its recipient can accept/decline it.
drop policy if exists "Request participants can view requests" on public.learning_requests;
create policy "Request participants can view requests" on public.learning_requests for select to authenticated using (auth.uid() = requester_id or auth.uid() = recipient_id);
drop policy if exists "Users can send learning requests" on public.learning_requests;
create policy "Users can send learning requests" on public.learning_requests for insert to authenticated with check (auth.uid() = requester_id and requester_id <> recipient_id and status = 'pending');
drop policy if exists "Recipients can respond to requests" on public.learning_requests;
create policy "Recipients can respond to requests" on public.learning_requests for update to authenticated using (auth.uid() = recipient_id) with check (auth.uid() = recipient_id and status in ('accepted','declined'));

-- Messages are only available to the two participants of an accepted request.
drop policy if exists "Participants can read accepted request messages" on public.messages;
create policy "Participants can read accepted request messages" on public.messages for select to authenticated using (
  exists (select 1 from public.learning_requests r where r.id = request_id and r.status = 'accepted' and auth.uid() in (r.requester_id, r.recipient_id))
);
drop policy if exists "Participants can send accepted request messages" on public.messages;
create policy "Participants can send accepted request messages" on public.messages for insert to authenticated with check (
  auth.uid() = sender_id and exists (
    select 1 from public.learning_requests r where r.id = request_id and r.status = 'accepted' and auth.uid() in (r.requester_id, r.recipient_id)
  )
);

-- Automatically create a profile when a new Auth user signs up.
create or replace function public.handle_new_peer_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, skills)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)), '{}')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_peer_profile on auth.users;
create trigger on_auth_user_created_peer_profile
after insert on auth.users for each row execute procedure public.handle_new_peer_profile();

-- Allow the browser client to use the tables through Supabase REST.
grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.learning_requests to authenticated;
grant select, insert on public.messages to authenticated;
