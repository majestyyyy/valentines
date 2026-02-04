-- Ensure Photos bucket exists and has correct policies
-- We use a DO block to safely handle "already exists" errors logic in SQL

-- 1. Create bucket if not exists (handled by insert on conflict do nothing)
insert into storage.buckets (id, name, public) 
values ('photos', 'photos', true)
on conflict (id) do update set public = true;

-- 2. Clean up existing policies to avoid conflicts
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Authenticated users can upload" on storage.objects;
drop policy if exists "Users can update own photos" on storage.objects;
drop policy if exists "Users can delete own photos" on storage.objects;

-- 3. Re-create policies

-- Allow everyone to view photos
create policy "Public Access" 
on storage.objects for select 
using ( bucket_id = 'photos' );

-- Allow authenticated users to upload photos
create policy "Authenticated users can upload" 
on storage.objects for insert 
with check (
  bucket_id = 'photos' 
  and auth.role() = 'authenticated'
);

-- Allow users to update their own photos (matched by folder name convention 'userid/*')
create policy "Users can update own photos"
on storage.objects for update
using ( bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1] );

-- Allow users to delete their own photos
create policy "Users can delete own photos"
on storage.objects for delete
using ( bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1] );
