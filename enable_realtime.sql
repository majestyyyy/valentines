-- Enable Realtime on messages table
alter publication supabase_realtime add table messages;

-- Enable Realtime on tasks table
alter publication supabase_realtime add table tasks;

-- Enable Realtime on matches table (for new match notifications)
alter publication supabase_realtime add table matches;

-- RLS policies for messages
alter table messages enable row level security;

create policy "Users can view messages in their matches" on messages
  for select using (
    exists (
      select 1 from matches 
      where matches.id = messages.match_id 
      and (matches.user1_id = auth.uid() or matches.user2_id = auth.uid())
    )
  );

create policy "Users can insert messages in their matches" on messages
  for insert with check (
    exists (
      select 1 from matches 
      where matches.id = match_id 
      and (matches.user1_id = auth.uid() or matches.user2_id = auth.uid())
    )
  );

-- RLS policies for tasks
alter table tasks enable row level security;

create policy "Users can view tasks in their matches" on tasks
  for select using (
    exists (
      select 1 from matches 
      where matches.id = tasks.match_id 
      and (matches.user1_id = auth.uid() or matches.user2_id = auth.uid())
    )
  );

create policy "Users can update tasks in their matches" on tasks
  for update using (
    exists (
      select 1 from matches 
      where matches.id = tasks.match_id 
      and (matches.user1_id = auth.uid() or matches.user2_id = auth.uid())
    )
  );

create policy "Users can insert tasks in their matches" on tasks
  for insert with check (
    exists (
      select 1 from matches 
      where matches.id = match_id 
      and (matches.user1_id = auth.uid() or matches.user2_id = auth.uid())
    )
  );

-- RLS policies for matches
alter table matches enable row level security;

create policy "Users can view their own matches" on matches
  for select using (user1_id = auth.uid() or user2_id = auth.uid());

create policy "Users can insert matches" on matches
  for insert with check (user1_id = auth.uid() or user2_id = auth.uid());
