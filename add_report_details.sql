-- Add details column to reports table
-- This allows users to provide additional context when reporting

ALTER TABLE reports ADD COLUMN IF NOT EXISTS details TEXT;

-- Verify the change
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'reports' 
ORDER BY ordinal_position;
