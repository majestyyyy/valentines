-- Add 'banned' status to differentiate from 'rejected'
-- 'rejected' = profile needs changes, can edit and resubmit
-- 'banned' = user is permanently banned, no editing allowed

ALTER TYPE profile_status ADD VALUE IF NOT EXISTS 'banned';

-- Add comment to explain the difference
COMMENT ON TYPE profile_status IS 'pending: awaiting approval, approved: active profile, rejected: needs changes (can edit), banned: permanently banned (cannot edit)';
