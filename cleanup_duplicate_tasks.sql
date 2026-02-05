-- Clean up duplicate tasks - keep only the latest task for each match
-- This script removes old duplicate tasks and keeps the most recent one

-- Step 1: Delete all duplicate tasks except the newest one per match_id
DELETE FROM tasks
WHERE id NOT IN (
  SELECT DISTINCT ON (match_id) id
  FROM tasks
  ORDER BY match_id, created_at DESC
);

-- Step 2: Add a unique constraint to prevent future duplicates
-- This ensures only ONE task per match_id
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_match_id_unique;
ALTER TABLE tasks ADD CONSTRAINT tasks_match_id_unique UNIQUE (match_id);

-- Verify cleanup
SELECT match_id, COUNT(*) as task_count
FROM tasks
GROUP BY match_id
HAVING COUNT(*) > 1;
-- Should return 0 rows after cleanup
