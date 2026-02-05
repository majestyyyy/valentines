-- Add mission_number column to tasks table to track sequential missions
alter table tasks add column if not exists mission_number integer default 1 check (mission_number between 1 and 3);

-- Update existing tasks to have mission_number = 1
update tasks set mission_number = 1 where mission_number is null;

-- Add comment to explain the column
comment on column tasks.mission_number is 'Track which mission (1, 2, or 3) is currently active for the match';
