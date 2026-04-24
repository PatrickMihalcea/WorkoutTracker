import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from 'npm:@aws-sdk/client-s3@3.908.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface DeleteExerciseMediaPayload {
  exerciseId: string;
}

interface SerializedError {
  name?: string;
  code?: string;
  message: string;
  httpStatusCode?: number;
  attempts?: number;
  totalRetryDelay?: number;
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

function isValidPayload(value: unknown): value is DeleteExerciseMediaPayload {
  if (!value || typeof value !== 'object') return false;
  const payload = value as Record<string, unknown>;
  return typeof payload.exerciseId === 'string' && payload.exerciseId.length > 0;
}

function logEvent(invocationId: string, event: string, details: Record<string, unknown> = {}): void {
  console.log(JSON.stringify({
    ts: new Date().toISOString(),
    invocationId,
    event,
    ...details,
  }));
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error.trim().length > 0) return error;
  return 'Unknown error';
}

function serializeMetadata(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object') return {};
  const metadata = value as {
    httpStatusCode?: unknown;
    requestId?: unknown;
    extendedRequestId?: unknown;
    cfId?: unknown;
    attempts?: unknown;
    totalRetryDelay?: unknown;
  };

  return {
    httpStatusCode: typeof metadata.httpStatusCode === 'number' ? metadata.httpStatusCode : undefined,
    requestId: typeof metadata.requestId === 'string' ? metadata.requestId : undefined,
    extendedRequestId: typeof metadata.extendedRequestId === 'string' ? metadata.extendedRequestId : undefined,
    cfId: typeof metadata.cfId === 'string' ? metadata.cfId : undefined,
    attempts: typeof metadata.attempts === 'number' ? metadata.attempts : undefined,
    totalRetryDelay: typeof metadata.totalRetryDelay === 'number' ? metadata.totalRetryDelay : undefined,
  };
}

function serializeError(error: unknown): SerializedError {
  if (!error || typeof error !== 'object') {
    return { message: getErrorMessage(error) };
  }

  const shaped = error as {
    name?: unknown;
    Code?: unknown;
    message?: unknown;
    $metadata?: {
      httpStatusCode?: unknown;
      attempts?: unknown;
      totalRetryDelay?: unknown;
    };
  };

  const metadata = shaped.$metadata ?? {};

  return {
    name: typeof shaped.name === 'string' ? shaped.name : undefined,
    code: typeof shaped.Code === 'string' ? shaped.Code : undefined,
    message: getErrorMessage(error),
    httpStatusCode: typeof metadata.httpStatusCode === 'number' ? metadata.httpStatusCode : undefined,
    attempts: typeof metadata.attempts === 'number' ? metadata.attempts : undefined,
    totalRetryDelay: typeof metadata.totalRetryDelay === 'number' ? metadata.totalRetryDelay : undefined,
  };
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
  const invocationId = crypto.randomUUID();
  logEvent(invocationId, 'request_received', { method: request.method });

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
    logEvent(invocationId, 'auth_failed', {
      error: serializeError(authError),
    });
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

  const { exerciseId } = payload;
  const userId = authData.user.id;
  const prefix = `users/${userId}/exercises/${exerciseId}/`;
  logEvent(invocationId, 'delete_started', {
    userId,
    exerciseId,
    prefix,
  });

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
  logEvent(invocationId, 'r2_config', {
    r2Bucket,
    r2Endpoint,
  });

  const s3 = new S3Client({
    region: 'auto',
    endpoint: r2Endpoint,
    credentials: {
      accessKeyId: r2AccessKeyId,
      secretAccessKey: r2SecretAccessKey,
    },
  });

  const keys: string[] = [];
  let duplicateKeyCount = 0;
  const seenKeys = new Set<string>();
  let continuationToken: string | undefined;

  try {
    let pageCount = 0;
    do {
      const listed = await s3.send(new ListObjectsV2Command({
        Bucket: r2Bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
        MaxKeys: 1000,
      }));
      pageCount += 1;
      logEvent(invocationId, 'list_page', {
        page: pageCount,
        isTruncated: !!listed.IsTruncated,
        nextContinuationToken: listed.NextContinuationToken ?? null,
        metadata: serializeMetadata((listed as { $metadata?: unknown }).$metadata),
      });

      const foundKeys = (listed.Contents ?? [])
        .map((obj) => obj.Key)
        .filter((key): key is string => typeof key === 'string' && key.length > 0);
      for (const key of foundKeys) {
        if (seenKeys.has(key)) {
          duplicateKeyCount += 1;
          continue;
        }
        seenKeys.add(key);
        keys.push(key);
      }
      continuationToken = listed.IsTruncated ? listed.NextContinuationToken : undefined;
    } while (continuationToken);

    logEvent(invocationId, 'list_completed', {
      pageCount,
      keyCount: keys.length,
      duplicateKeyCount,
      keySample: keys.slice(0, 8),
    });
  } catch (error: unknown) {
    logEvent(invocationId, 'list_failed', {
      error: serializeError(error),
      prefix,
    });
    if (isNoSuchKeyError(error)) {
      return jsonResponse({ deletedCount: 0, prefix });
    }
    return jsonResponse({ error: `Failed to list media from R2: ${getErrorMessage(error)}` }, 500);
  }

  if (keys.length === 0) {
    logEvent(invocationId, 'delete_completed', {
      keyCount: 0,
      deletedCount: 0,
      noSuchKeyCount: 0,
    });
    return jsonResponse({ deletedCount: 0, prefix });
  }

  let deletedCount = 0;
  let noSuchKeyCount = 0;
  for (const key of keys) {
    try {
      await s3.send(new DeleteObjectCommand({
        Bucket: r2Bucket,
        Key: key,
      }));
      deletedCount += 1;
    } catch (error: unknown) {
      if (isNoSuchKeyError(error)) {
        noSuchKeyCount += 1;
        logEvent(invocationId, 'delete_object_nosuchkey', {
          key,
          error: serializeError(error),
        });
        continue;
      }
      logEvent(invocationId, 'delete_object_failed', {
        key,
        error: serializeError(error),
      });
      return jsonResponse({ error: `Failed to delete media object "${key}": ${getErrorMessage(error)}` }, 500);
    }
  }

  logEvent(invocationId, 'delete_completed', {
    keyCount: keys.length,
    deletedCount,
    noSuchKeyCount,
    duplicateKeyCount,
  });

  return jsonResponse({ deletedCount, prefix });
});
