-- Add gender and preferred_gender to profiles table
alter table profiles 
add column if not exists gender text check (gender in ('Male', 'Female', 'Non-binary', 'Other')),
add column if not exists preferred_gender text check (preferred_gender in ('Male', 'Female', 'Non-binary', 'Other', 'Everyone'));

-- Update handle_new_user function if needed, but since we update profile later, it might not be strictly necessary to update the trigger unless we want defaults. 
-- For now, defaults are null which is fine until profile setup.
