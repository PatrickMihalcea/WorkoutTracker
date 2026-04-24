import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} from 'npm:@aws-sdk/client-s3@3.908.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface DeleteObjectsErrorLike {
  Code?: string;
  Message?: string;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function chunk<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error.trim().length > 0) return error;
  return 'Unknown error';
}

function isNoSuchKeyError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const shaped = error as { name?: unknown; Code?: unknown; message?: unknown };
  return (
    shaped.name === 'NoSuchKey' ||
    shaped.Code === 'NoSuchKey' ||
    (typeof shaped.message === 'string' && shaped.message.includes('NoSuchKey'))
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

  const userId = authData.user.id;

  const r2AccountId = Deno.env.get('R2_ACCOUNT_ID') ?? '';
  const r2Bucket = Deno.env.get('R2_BUCKET') ?? '';
  const r2AccessKeyId = Deno.env.get('R2_ACCESS_KEY_ID') ?? '';
  const r2SecretAccessKey = Deno.env.get('R2_SECRET_ACCESS_KEY') ?? '';

  if (!r2AccountId || !r2Bucket || !r2AccessKeyId || !r2SecretAccessKey) {
    return jsonResponse({ error: 'R2 environment is not fully configured.' }, 500);
  }

  const r2Endpoint =
    Deno.env.get('R2_S3_ENDPOINT') ??
    `https://${r2AccountId}.r2.cloudflarestorage.com`;

  const s3 = new S3Client({
    region: 'auto',
    endpoint: r2Endpoint,
    credentials: {
      accessKeyId: r2AccessKeyId,
      secretAccessKey: r2SecretAccessKey,
    },
  });

  const prefix = `users/${userId}/`;
  const keys: string[] = [];
  let continuationToken: string | undefined;

  do {
    const listed = await s3.send(new ListObjectsV2Command({
      Bucket: r2Bucket,
      Prefix: prefix,
      ContinuationToken: continuationToken,
      MaxKeys: 1000,
    }));

    const foundKeys = (listed.Contents ?? [])
      .map((obj) => obj.Key)
      .filter((key): key is string => typeof key === 'string' && key.length > 0);

    keys.push(...foundKeys);
    continuationToken = listed.IsTruncated ? listed.NextContinuationToken : undefined;
  } while (continuationToken);

  if (keys.length === 0) {
    return jsonResponse({ deletedCount: 0, prefix });
  }

  let deletedCount = 0;
  for (const keyBatch of chunk(keys, 1000)) {
    try {
      const result = await s3.send(new DeleteObjectsCommand({
        Bucket: r2Bucket,
        Delete: {
          Objects: keyBatch.map((key) => ({ Key: key })),
          Quiet: true,
        },
      }));

      const blockingErrors = (result.Errors ?? [])
        .filter((entry): entry is DeleteObjectsErrorLike => !!entry)
        .filter((entry) => (entry.Code ?? '') !== 'NoSuchKey');
      if (blockingErrors.length > 0) {
        const first = blockingErrors[0];
        const details = first.Message ? `${first.Code ?? 'Error'}: ${first.Message}` : (first.Code ?? 'DeleteObjects failed.');
        return jsonResponse({ error: `Failed to delete one or more media objects: ${details}` }, 502);
      }

      const deletedInBatch = result.Deleted?.length ?? keyBatch.length;
      deletedCount += deletedInBatch;
    } catch (error: unknown) {
      if (isNoSuchKeyError(error)) {
        // Some R2 setups can fail the whole batch on a missing key.
        // Retry per-object so one stale key does not block deleting the rest.
        for (const key of keyBatch) {
          try {
            await s3.send(new DeleteObjectCommand({
              Bucket: r2Bucket,
              Key: key,
            }));
            deletedCount += 1;
          } catch (singleError: unknown) {
            if (isNoSuchKeyError(singleError)) {
              continue;
            }
            return jsonResponse({ error: `Failed to delete media object "${key}": ${getErrorMessage(singleError)}` }, 500);
          }
        }
        continue;
      }
      return jsonResponse({ error: `Failed to delete media from R2: ${getErrorMessage(error)}` }, 500);
    }
  }

  return jsonResponse({ deletedCount, prefix });
});
