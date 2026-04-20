import { supabase } from './supabase';

export type ExerciseMediaSlot = 'media' | 'thumbnail';

export interface CreateExerciseMediaUploadUrlInput {
  exerciseId: string;
  slot: ExerciseMediaSlot;
  contentType: string;
}

export interface CreateExerciseMediaUploadUrlResponse {
  uploadUrl: string;
  publicUrl: string;
  objectPath: string;
  expiresInSeconds: number;
}

interface DeleteExerciseMediaResponse {
  deletedCount: number;
  prefix: string;
}

async function readContextErrorMessage(error: unknown): Promise<string | null> {
  if (!error || typeof error !== 'object') return null;

  const context = (
    error as {
      context?: { json?: () => Promise<unknown>; text?: () => Promise<string> };
    }
  ).context;

  if (!context) return null;

  try {
    if (typeof context.json === 'function') {
      const payload = await context.json();
      if (
        payload &&
        typeof payload === 'object' &&
        typeof (payload as { error?: unknown }).error === 'string'
      ) {
        return (payload as { error: string }).error;
      }
    }
  } catch {
    // ignore
  }

  try {
    if (typeof context.text === 'function') {
      const text = await context.text();
      if (text.trim().length > 0) return text;
    }
  } catch {
    // ignore
  }

  return null;
}

export const exerciseMediaService = {
  async createUploadUrl(
    input: CreateExerciseMediaUploadUrlInput,
  ): Promise<CreateExerciseMediaUploadUrlResponse> {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error('You must be signed in to upload exercise media.');
    }

    const { data, error } = await supabase.functions.invoke('create-exercise-media-upload-url', {
      body: input,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) {
      const contextMessage = await readContextErrorMessage(error);
      throw new Error(contextMessage ?? error.message ?? 'Failed to create upload URL.');
    }

    if (!data || typeof data !== 'object') {
      throw new Error('Upload URL function returned an invalid response.');
    }

    const payload = data as Partial<CreateExerciseMediaUploadUrlResponse>;
    if (
      typeof payload.uploadUrl !== 'string' ||
      typeof payload.publicUrl !== 'string' ||
      typeof payload.objectPath !== 'string' ||
      typeof payload.expiresInSeconds !== 'number'
    ) {
      throw new Error('Upload URL function returned incomplete fields.');
    }

    return payload as CreateExerciseMediaUploadUrlResponse;
  },

  async uploadFileToSignedUrl(args: {
    fileUri: string;
    uploadUrl: string;
    contentType: string;
  }): Promise<void> {
    const { fileUri, uploadUrl, contentType } = args;

    const fileResponse = await fetch(fileUri);
    if (!fileResponse.ok) {
      throw new Error('Failed to read selected file before upload.');
    }

    const fileBlob = await fileResponse.blob();
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
      },
      body: fileBlob,
    });

    if (!uploadResponse.ok) {
      const message = await uploadResponse.text().catch(() => '');
      throw new Error(message || 'Media upload failed.');
    }
  },

  async deleteExerciseMedia(exerciseId: string): Promise<DeleteExerciseMediaResponse> {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error('You must be signed in to delete exercise media.');
    }

    const { data, error } = await supabase.functions.invoke('delete-exercise-media', {
      body: { exerciseId },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) {
      const contextMessage = await readContextErrorMessage(error);
      throw new Error(contextMessage ?? error.message ?? 'Failed to delete exercise media.');
    }

    if (!data || typeof data !== 'object') {
      throw new Error('Delete media function returned an invalid response.');
    }

    const payload = data as Partial<DeleteExerciseMediaResponse>;
    if (
      typeof payload.deletedCount !== 'number' ||
      typeof payload.prefix !== 'string'
    ) {
      throw new Error('Delete media function returned incomplete fields.');
    }

    return payload as DeleteExerciseMediaResponse;
  },

  async deleteUserMedia(): Promise<DeleteExerciseMediaResponse> {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error('You must be signed in to delete user media.');
    }

    const { data, error } = await supabase.functions.invoke('delete-user-media', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) {
      const contextMessage = await readContextErrorMessage(error);
      throw new Error(contextMessage ?? error.message ?? 'Failed to delete user media.');
    }

    if (!data || typeof data !== 'object') {
      throw new Error('Delete user media function returned an invalid response.');
    }

    const payload = data as Partial<DeleteExerciseMediaResponse>;
    if (
      typeof payload.deletedCount !== 'number' ||
      typeof payload.prefix !== 'string'
    ) {
      throw new Error('Delete user media function returned incomplete fields.');
    }

    return payload as DeleteExerciseMediaResponse;
  },
};
