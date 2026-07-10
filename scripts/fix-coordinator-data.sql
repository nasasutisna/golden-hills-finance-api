-- Check house blocks with coordinatorId
SELECT
  hb.id,
  hb.block_code,
  hb.coordinator_id,
  r.id as resident_exists
FROM house_blocks hb
LEFT JOIN residents r ON hb.coordinator_id = r.id AND r.deleted_at IS NULL
WHERE hb.deleted_at IS NULL
  AND hb.coordinator_id IS NOT NULL;
