import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import { S3Client, PutObjectCommand } from 'npm:@aws-sdk/client-s3@3.908.0';
import { getSignedUrl } from 'npm:@aws-sdk/s3-request-presigner@3.908.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type UploadSlot = 'media' | 'thumbnail';

interface CreateUploadPayload {
  exerciseId: string;
  slot: UploadSlot;
  contentType: string;
}

const CONTENT_TYPE_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
  'application/vnd.apple.mpegurl': 'm3u8',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function sanitizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, '');
}

function sanitizeBucketName(value: string): string {
  return value.replace(/^\/+|\/+$/g, '');
}

function buildPublicUrl(baseUrl: string, bucket: string, objectPath: string): string {
  const safeBase = sanitizeBaseUrl(baseUrl);
  const safeBucket = sanitizeBucketName(bucket);
  const safeObjectPath = objectPath.replace(/^\/+/, '');

  // If the base URL already includes /<bucket>, avoid duplicating it.
  if (safeBase.toLowerCase().endsWith(`/${safeBucket.toLowerCase()}`)) {
    return `${safeBase}/${safeObjectPath}`;
  }

  return `${safeBase}/${safeBucket}/${safeObjectPath}`;
}

function resolveExtension(contentType: string): string {
  const normalized = contentType.toLowerCase().split(';')[0].trim();
  return CONTENT_TYPE_TO_EXT[normalized] ?? 'bin';
}

function normalizeContentType(contentType: string): string | null {
  const normalized = contentType.toLowerCase().split(';')[0].trim();
  if (!CONTENT_TYPE_TO_EXT[normalized]) return null;
  return normalized;
}

function isValidPayload(value: unknown): value is CreateUploadPayload {
  if (!value || typeof value !== 'object') return false;
  const payload = value as Record<string, unknown>;
  return (
    typeof payload.exerciseId === 'string' &&
    payload.exerciseId.length > 0 &&
    (payload.slot === 'media' || payload.slot === 'thumbnail') &&
    typeof payload.contentType === 'string' &&
    payload.contentType.length > 0
  );
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabasePublishableKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const authHeader =
    request.headers.get('Authorization') ??
    request.headers.get('authorization') ??
    '';

  if (!supabaseUrl || !supabasePublishableKey) {
    return jsonResponse({ error: 'Supabase environment is not configured.' }, 500);
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return jsonResponse({ error: 'Missing bearer token.' }, 401);
  }

  const supabase = createClient(supabaseUrl, supabasePublishableKey, {
    global: {
      headers: { Authorization: authHeader },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData?.user) {
    return jsonResponse({ error: 'Unauthorized.' }, 401);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body.' }, 400);
  }

  if (!isValidPayload(payload)) {
    return jsonResponse({ error: 'Invalid request payload.' }, 400);
  }

  const { exerciseId, slot, contentType } = payload;
  const normalizedContentType = normalizeContentType(contentType);
  if (!normalizedContentType) {
    return jsonResponse({ error: 'Unsupported content type.' }, 400);
  }
  if (slot === 'thumbnail' && !normalizedContentType.startsWith('image/')) {
    return jsonResponse({ error: 'Thumbnails must use an image content type.' }, 400);
  }

  const userId = authData.user.id;

  const { data: exercise, error: exerciseError } = await supabase
    .from('exercises')
    .select('id')
    .eq('id', exerciseId)
    .eq('user_id', userId)
    .maybeSingle();

  if (exerciseError) {
    return jsonResponse({ error: `Failed to validate exercise: ${exerciseError.message}` }, 500);
  }

  if (!exercise) {
    return jsonResponse({ error: 'Exercise not found or not owned by user.' }, 404);
  }

  const r2AccountId = Deno.env.get('R2_ACCOUNT_ID') ?? '';
  const r2Bucket = Deno.env.get('R2_BUCKET') ?? '';
  const r2AccessKeyId = Deno.env.get('R2_ACCESS_KEY_ID') ?? '';
  const r2SecretAccessKey = Deno.env.get('R2_SECRET_ACCESS_KEY') ?? '';
  const r2PublicBaseUrl = Deno.env.get('R2_PUBLIC_BASE_URL') ?? '';

  if (!r2AccountId || !r2Bucket || !r2AccessKeyId || !r2SecretAccessKey || !r2PublicBaseUrl) {
    return jsonResponse({ error: 'R2 environment is not fully configured.' }, 500);
  }

  const r2Endpoint =
    Deno.env.get('R2_S3_ENDPOINT') ??
    `https://${r2AccountId}.r2.cloudflarestorage.com`;

  const extension = resolveExtension(normalizedContentType);
  const objectPath = `users/${userId}/exercises/${exerciseId}/v1/${slot}.${extension}`;

  const s3 = new S3Client({
    region: 'auto',
    endpoint: r2Endpoint,
    credentials: {
      accessKeyId: r2AccessKeyId,
      secretAccessKey: r2SecretAccessKey,
    },
  });

  const putCommand = new PutObjectCommand({
    Bucket: r2Bucket,
    Key: objectPath,
    ContentType: normalizedContentType,
    CacheControl: 'public, max-age=31536000, immutable',
  });

  const expiresInSeconds = 5 * 60;
  const uploadUrl = await getSignedUrl(s3, putCommand, { expiresIn: expiresInSeconds });
  const publicUrl = buildPublicUrl(r2PublicBaseUrl, r2Bucket, objectPath);

  return jsonResponse({
    uploadUrl,
    publicUrl,
    objectPath,
    expiresInSeconds,
  });
});
