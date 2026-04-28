-- =============================================================
-- Backfill `exercises.library_id` from pasted exercise mappings
--
-- Usage:
--   1. Paste your source values into the $exercise_map$ block below.
--   2. Use CSV-style quoted values, for example:
--        "12_Barbell Bench Press",
--        "13_Dumbbell Curl",
--        "14_Farmer's Carry"
--   3. Run this script in Supabase SQL Editor.
--
-- Notes:
--   - Adds `library_id` as an integer if it does not already exist.
--   - Updates only public library exercises (`user_id IS NULL`).
--   - Matches pasted values to `exercises.name` exactly.
--   - Safe to rerun; matching rows are simply assigned the same value again.
-- =============================================================

BEGIN;

ALTER TABLE exercises
ADD COLUMN IF NOT EXISTS library_id integer;

DROP TABLE IF EXISTS pg_temp._exercise_library_id_input;
CREATE TEMP TABLE _exercise_library_id_input (
  raw_line text NOT NULL
) ON COMMIT DROP;

WITH raw_csv AS (
  SELECT $exercise_map$
"12_Barbell Bench Press",
"13_Dumbbell Curl",
"14_Farmer's Carry",
"15_Assisted Chest Dip (Kneeling)"
  $exercise_map$ AS csv_blob
)
INSERT INTO _exercise_library_id_input (raw_line)
SELECT replace((m.match_parts)[1], '""', '"')
FROM raw_csv
CROSS JOIN LATERAL regexp_matches(
  csv_blob,
  '"((?:[^"]|"")*)"',
  'g'
) AS m(match_parts);

DROP TABLE IF EXISTS pg_temp._exercise_library_id_parsed;
CREATE TEMP TABLE _exercise_library_id_parsed AS
SELECT
  i.raw_line,
  (m.parts)[1]::integer AS library_id,
  btrim((m.parts)[2]) AS name
FROM _exercise_library_id_input AS i
CROSS JOIN LATERAL regexp_match(i.raw_line, '^\s*(\d+)_(.+?)\s*$') AS m(parts);

-- Preview 1: any pasted rows that do not match the expected X_Exercise Name format.
SELECT raw_line AS invalid_input_line
FROM _exercise_library_id_input
WHERE raw_line !~ '^\s*\d+_.+\s*$'
ORDER BY raw_line;

-- Preview 1b: any leftover content that was not parsed as a quoted CSV value.
WITH raw_csv AS (
  SELECT $exercise_map$
"12_Barbell Bench Press",
"13_Dumbbell Curl",
"14_Farmer's Carry",
"15_Assisted Chest Dip (Kneeling)"
  $exercise_map$ AS csv_blob
)
SELECT NULLIF(
  btrim(
    regexp_replace(
      regexp_replace(csv_blob, '"((?:[^"]|"")*)"', '', 'g'),
      '[,\s]+',
      '',
      'g'
    )
  ),
  ''
) AS unparsed_csv_content
FROM raw_csv;

-- Preview 2: parsed values and how many public exercises each line will match.
SELECT
  p.library_id,
  p.name,
  COUNT(e.id) AS matching_public_rows
FROM _exercise_library_id_parsed AS p
LEFT JOIN exercises AS e
  ON e.user_id IS NULL
 AND e.name = p.name
GROUP BY p.library_id, p.name
ORDER BY p.library_id, p.name;

-- Backfill public library rows only.
WITH updated AS (
  UPDATE exercises AS e
  SET library_id = p.library_id
  FROM _exercise_library_id_parsed AS p
  WHERE e.user_id IS NULL
    AND e.name = p.name
  RETURNING e.id, e.name, p.library_id
)
SELECT COUNT(*) AS updated_rows
FROM updated;

-- Post-check: pasted names that did not match any public exercise row.
SELECT
  p.library_id,
  p.name AS unmatched_exercise_name
FROM _exercise_library_id_parsed AS p
LEFT JOIN exercises AS e
  ON e.user_id IS NULL
 AND e.name = p.name
WHERE e.id IS NULL
ORDER BY p.library_id, p.name;

COMMIT;
