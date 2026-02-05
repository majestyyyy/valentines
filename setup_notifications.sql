-- Notifications table for like notifications
create table if not exists notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  from_user_id uuid references profiles(id) on delete cascade not null,
  type text check (type in ('like', 'match')) not null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table notifications enable row level security;

-- Policies for notifications
create policy "Users can view their own notifications" on notifications
  for select using (auth.uid() = user_id);

create policy "Users can update their own notifications" on notifications
  for update using (auth.uid() = user_id);

create policy "System can insert notifications" on notifications
  for insert with check (true);

-- Index for faster queries
create index if not exists notifications_user_id_idx on notifications(user_id);
create index if not exists notifications_is_read_idx on notifications(user_id, is_read);

-- Function to create notification when someone swipes right
create or replace function create_like_notification()
returns trigger as $$
begin
  -- Only create notification for right swipes (likes)
  if new.direction = 'right' then
    insert into notifications (user_id, from_user_id, type)
    values (new.swiped_id, new.swiper_id, 'like');
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to auto-create notification on swipe
drop trigger if exists on_swipe_created on swipes;
create trigger on_swipe_created
  after insert on swipes
  for each row execute procedure create_like_notification();

-- Function to create match notification
create or replace function create_match_notification()
returns trigger as $$
begin
  -- Create notification for both users
  insert into notifications (user_id, from_user_id, type)
  values 
    (new.user1_id, new.user2_id, 'match'),
    (new.user2_id, new.user1_id, 'match');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to auto-create notification on match
drop trigger if exists on_match_created on matches;
create trigger on_match_created
  after insert on matches
  for each row execute procedure create_match_notification();
