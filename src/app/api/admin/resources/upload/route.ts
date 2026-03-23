import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { apiError, requireAdmin } from '../../_utils';

export const runtime = 'nodejs';

const allowedCategories = new Set(['marketing', 'training']);

function buildStoragePath(category: string, fileName: string) {
  const safeFileName = fileName.replace(/\s+/g, '_');
  return `${category}/${Date.now()}_${safeFileName}`;
}

export async function POST(request: Request) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.ok) {
      return adminCheck.response;
    }

    const formData = await request.formData();
    const title = formData.get('title');
    const description = formData.get('description');
    const category = formData.get('category');
    const file = formData.get('file');

    if (
      typeof title !== 'string' ||
      typeof description !== 'string' ||
      typeof category !== 'string' ||
      !(file instanceof File)
    ) {
      return apiError(
        'missing_fields',
        'title, description, category, and file are required.',
        400
      );
    }

    const normalizedTitle = title.trim();
    const normalizedDescription = description.trim();
    const normalizedCategory = category.trim().toLowerCase();

    if (!normalizedTitle || !normalizedDescription || !file.name) {
      return apiError(
        'invalid_fields',
        'title, description, and file are required.',
        400
      );
    }

    if (!allowedCategories.has(normalizedCategory)) {
      return apiError('invalid_category', 'Invalid resource category.', 400);
    }

    const admin = createSupabaseAdminClient();
    const filePath = buildStoragePath(normalizedCategory, file.name);
    const fileBytes = new Uint8Array(await file.arrayBuffer());

    const { error: uploadError } = await admin.storage
      .from('resources')
      .upload(filePath, fileBytes, {
        contentType: file.type || undefined,
        upsert: false,
      });

    if (uploadError) {
      return apiError(
        'upload_failed',
        uploadError.message || 'Unable to upload file.',
        500
      );
    }

    const {
      data: { publicUrl },
    } = admin.storage.from('resources').getPublicUrl(filePath);

    const { data: resource, error: insertError } = await admin
      .from('resources')
      .insert({
        title: normalizedTitle,
        description: normalizedDescription,
        category: normalizedCategory,
        file_url: publicUrl,
      })
      .select('id, title, description, category, file_url, created_at')
      .single();

    if (insertError) {
      await admin.storage.from('resources').remove([filePath]);
      return apiError(
        'resource_insert_failed',
        insertError.message || 'Unable to save resource.',
        500
      );
    }

    return NextResponse.json({
      success: true,
      data: resource,
    });
  } catch (error) {
    return apiError(
      'resource_upload_failed',
      error instanceof Error ? error.message : 'Unable to upload resource.',
      500
    );
  }
}
