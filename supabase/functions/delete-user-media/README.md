# delete-user-media

Deletes all R2 media objects for the authenticated user.

It removes everything under:

`users/<user_id>/`

## Required environment variables

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `R2_ACCOUNT_ID`
- `R2_BUCKET`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_S3_ENDPOINT` (optional; defaults to `https://<account>.r2.cloudflarestorage.com`)

## Request body

No body is required. Send an authenticated `POST`.

## Response body

```json
{
  "deletedCount": 24,
  "prefix": "users/<uid>/"
}
```
