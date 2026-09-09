-- Add founder_user_id column to pods table
ALTER TABLE pods ADD COLUMN IF NOT EXISTS founder_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Backfill existing pods from the earliest member (consistent with remove_member_from_pod RPC)
UPDATE pods
SET founder_user_id = pm.earliest_member_user_id
FROM (
  SELECT pod_id, user_id AS earliest_member_user_id
  FROM pod_members
  WHERE (pod_id, created_at) IN (
    SELECT pod_id, MIN(created_at)
    FROM pod_members
    GROUP BY pod_id
  )
) pm
WHERE pods.id = pm.pod_id;