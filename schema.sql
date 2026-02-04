-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create specific types
create type app_role as enum ('admin', 'user');
create type profile_status as enum ('pending', 'approved', 'rejected');
create type college_enum as enum ('CAS', 'CCSS', 'CBA', 'CEDUC', 'CDENT', 'CENG');

-- Create profiles table
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  nickname text,
  photo_urls text[], -- Array of 2 URLs
  college college_enum,
  year_level int,
  hobbies text[],
  description text,
  gender text check (gender in ('Male', 'Female', 'Non-binary', 'Other')),
  preferred_gender text check (preferred_gender in ('Male', 'Female', 'Non-binary', 'Other', 'Everyone')),
  role app_role default 'user',
  status profile_status default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table profiles enable row level security;

-- Policies for profiles
create policy "Public profiles are viewable by everyone" on profiles
  for select using (true);

create policy "Users can insert their own profile" on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

-- Swipes table
create table swipes (
  id uuid default uuid_generate_v4() primary key,
  swiper_id uuid references profiles(id) not null,
  swiped_id uuid references profiles(id) not null,
  direction text check (direction in ('left', 'right')) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(swiper_id, swiped_id)
);

-- Matches table
create table matches (
  id uuid default uuid_generate_v4() primary key,
  user1_id uuid references profiles(id) not null,
  user2_id uuid references profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Messages table
create table messages (
  id uuid default uuid_generate_v4() primary key,
  match_id uuid references matches(id) on delete cascade not null,
  sender_id uuid references profiles(id) not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tasks table (for matched users)
create table tasks (
  id uuid default uuid_generate_v4() primary key,
  match_id uuid references matches(id) on delete cascade not null,
  description text not null,
  is_completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Reports table
create table reports (
  id uuid default uuid_generate_v4() primary key,
  reporter_id uuid references profiles(id) not null,
  reported_id uuid references profiles(id) not null,
  reason text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger the function every time a user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
