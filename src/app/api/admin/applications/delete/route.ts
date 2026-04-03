import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { apiError, requireAdmin } from '../../_utils';

export const runtime = 'nodejs';

type DeleteApplicationBody = {
  applicationId?: string;
};

export async function DELETE(request: Request) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.ok) {
      return adminCheck.response;
    }

    let body: DeleteApplicationBody;

    try {
      body = (await request.json()) as DeleteApplicationBody;
    } catch {
      return apiError('invalid_body', 'Invalid JSON body.', 400);
    }

    const applicationId = body.applicationId?.trim();

    if (!applicationId) {
      return apiError('missing_fields', 'applicationId is required.', 400);
    }

    const admin = createSupabaseAdminClient();

    const { data: application, error: lookupError } = await admin
      .from('agent_applications')
      .select('id')
      .eq('id', applicationId)
      .maybeSingle();

    if (lookupError) {
      return apiError(
        'application_lookup_failed',
        lookupError.message || 'Unable to load application.',
        500
      );
    }

    if (!application) {
      return apiError('application_not_found', 'Application not found.', 404);
    }

    const { error: deleteError } = await admin
      .from('agent_applications')
      .delete()
      .eq('id', applicationId);

    if (deleteError) {
      return apiError(
        'delete_failed',
        deleteError.message || 'Failed to delete application.',
        500
      );
    }

    console.log('Application deleted:', {
      applicationId,
      adminUserId: adminCheck.userId,
    });

    return NextResponse.json({
      success: true,
      data: {
        applicationId,
      },
    });
  } catch (error) {
    return apiError(
      'delete_failed',
      error instanceof Error ? error.message : 'Delete request failed.',
      500
    );
  }
}
