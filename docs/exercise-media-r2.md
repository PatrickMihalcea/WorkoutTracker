# Exercise Media With Supabase + Cloudflare R2

## 1. Run the database migration

This migration adds:

- `media_type` (`none`, `image`, `gif`, `video`)
- `media_url`
- `thumbnail_url`

And removes legacy `asset_url`.

```bash
supabase db push
```

## 2. Create and configure your R2 bucket

Create one bucket (example: `exercise-media`) and set a public base URL:

- Custom domain (recommended), or
- `https://<bucket>.<account>.r2.dev`

## 3. Set Edge Function secrets

Set these for Supabase Edge Functions:

- `R2_ACCOUNT_ID`
- `R2_BUCKET`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_PUBLIC_BASE_URL`
- optional: `R2_S3_ENDPOINT` (`https://<account>.r2.cloudflarestorage.com`)

## 4. Deploy the upload-url function

```bash
supabase functions deploy create-exercise-media-upload-url
supabase functions deploy delete-exercise-media
supabase functions deploy delete-user-media
```

## 5. App behavior now

- Creating a custom exercise supports optional image upload from photo library.
- Uploaded file goes directly to R2 through a short-lived signed `PUT` URL.
- Deleting a custom exercise now deletes its R2 media prefix first (`users/<uid>/exercises/<exercise_id>/...`), then deletes the DB row.
- Deleting an account now deletes the entire user media prefix first (`users/<uid>/...`), then deletes the auth/account row.
- Exercise row is updated with:
  - `media_type = 'image'`
  - `media_url = <r2 public url>`
  - `thumbnail_url = <same url>`
- Exercise picker rows now render thumbnail previews.
- Exercise detail now renders media (GIF/image), and shows video fallback text if `media_type='video'`.

## 6. Library GIF + thumbnail workflow

For each exercise:

```bash
ffmpeg -ss 0.3 -i input.gif -frames:v 1 -vf "scale=640:-1:flags=lanczos" -q:v 3 thumb.jpg
```

Suggested object keys:

- `library/exercises/<exercise_id>/v1/media.gif`
- `library/exercises/<exercise_id>/v1/thumb.jpg`

Then update DB row:

- `media_type='gif'`
- `media_url=<gif url>`
- `thumbnail_url=<thumb url>`
