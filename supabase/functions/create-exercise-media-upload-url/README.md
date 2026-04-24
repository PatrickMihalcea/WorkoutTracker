# create-exercise-media-upload-url

Creates a short-lived signed `PUT` URL for uploading exercise media to Cloudflare R2.

Note: this function only signs uploads. It does not transform image bytes server-side.  
Client apps should resize/compress icon images before uploading (for example max 480px).

## Required environment variables

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `R2_ACCOUNT_ID`
- `R2_BUCKET`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_PUBLIC_BASE_URL` (for example `https://cdn.example.com` or `https://pub-<hash>.r2.dev`)
- `R2_S3_ENDPOINT` (optional; defaults to `https://<account>.r2.cloudflarestorage.com`)

`publicUrl` is built as:

- `<R2_PUBLIC_BASE_URL>/<objectPath>` when `R2_PUBLIC_BASE_URL` is already bucket-scoped (for example `*.r2.dev`)
- `<R2_PUBLIC_BASE_URL>/<R2_BUCKET>/<objectPath>` otherwise

## Request body

```json
{
  "exerciseId": "uuid",
  "slot": "media",
  "contentType": "image/jpeg"
}
```

`slot` can be `media` or `thumbnail`.

Supported `contentType` values:

- `image/jpeg`
- `image/jpg`
- `image/png`
- `image/webp`
- `image/gif`
- `video/mp4`
- `video/webm`
- `video/quicktime`
- `application/vnd.apple.mpegurl`

If `slot` is `thumbnail`, `contentType` must be an image type.

## Response body

```json
{
  "uploadUrl": "https://...",
  "publicUrl": "https://cdn.example.com/exercise-media/users/<uid>/exercises/<exercise-id>/v1/media.jpg",
  "objectPath": "users/<uid>/exercises/<exercise-id>/v1/media.jpg",
  "expiresInSeconds": 300
}
```
