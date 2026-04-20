import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from 'npm:@aws-sdk/client-s3@3.908.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

function chunk<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
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

  for (const keyBatch of chunk(keys, 1000)) {
    await s3.send(new DeleteObjectsCommand({
      Bucket: r2Bucket,
      Delete: {
        Objects: keyBatch.map((key) => ({ Key: key })),
        Quiet: true,
      },
    }));
  }

  return jsonResponse({ deletedCount: keys.length, prefix });
});
