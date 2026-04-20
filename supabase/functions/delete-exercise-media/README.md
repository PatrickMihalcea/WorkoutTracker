# delete-exercise-media

Deletes all R2 objects for a user-owned custom exercise.

It removes everything under:

`users/<user_id>/exercises/<exercise_id>/`

## Required environment variables

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `R2_ACCOUNT_ID`
- `R2_BUCKET`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_S3_ENDPOINT` (optional; defaults to `https://<account>.r2.cloudflarestorage.com`)

## Request body

```json
{
  "exerciseId": "uuid"
}
```

## Response body

```json
{
  "deletedCount": 2,
  "prefix": "users/<uid>/exercises/<exercise-id>/"
}
```
