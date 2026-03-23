import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { apiError, requireAdmin } from '../_utils';

export const runtime = 'nodejs';

type RejectRequestBody = {
  applicationId?: string;
};

export async function POST(request: Request) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.ok) {
      return adminCheck.response;
    }

    let body: RejectRequestBody;

    try {
      body = (await request.json()) as RejectRequestBody;
    } catch {
      return apiError('invalid_body', 'Invalid JSON body.', 400);
    }

    const applicationId = body.applicationId?.trim();

    if (!applicationId) {
      return apiError('missing_fields', 'applicationId is required.', 400);
    }

    const admin = createSupabaseAdminClient();
    const { error } = await admin
      .from('agent_applications')
      .update({ status: 'rejected' })
      .eq('id', applicationId);

    if (error) {
      return apiError(
        'reject_failed',
        error.message || 'Failed to reject application.',
        500
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        applicationId,
      },
    });
  } catch (error) {
    return apiError(
      'reject_failed',
      error instanceof Error ? error.message : 'Reject request failed.',
      500
    );
  }
}
