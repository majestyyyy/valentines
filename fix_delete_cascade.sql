-- FIX: Allow users to be deleted by cascading delete to related tables

-- 1. Matches Table
alter table matches
drop constraint if exists matches_user1_id_fkey,
drop constraint if exists matches_user2_id_fkey;

alter table matches
add constraint matches_user1_id_fkey foreign key (user1_id) references profiles(id) on delete cascade,
add constraint matches_user2_id_fkey foreign key (user2_id) references profiles(id) on delete cascade;

-- 2. Swipes Table
alter table swipes
drop constraint if exists swipes_swiper_id_fkey,
drop constraint if exists swipes_swiped_id_fkey;

alter table swipes
add constraint swipes_swiper_id_fkey foreign key (swiper_id) references profiles(id) on delete cascade,
add constraint swipes_swiped_id_fkey foreign key (swiped_id) references profiles(id) on delete cascade;

-- 3. Messages Table
alter table messages
drop constraint if exists messages_sender_id_fkey;

alter table messages
add constraint messages_sender_id_fkey foreign key (sender_id) references profiles(id) on delete cascade;

-- 4. Reports Table
alter table reports
drop constraint if exists reports_reporter_id_fkey,
drop constraint if exists reports_reported_id_fkey;

alter table reports
add constraint reports_reporter_id_fkey foreign key (reporter_id) references profiles(id) on delete cascade,
add constraint reports_reported_id_fkey foreign key (reported_id) references profiles(id) on delete cascade;
