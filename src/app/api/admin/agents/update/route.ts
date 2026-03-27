import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { apiError, requireAdmin } from '../../_utils';

type Body = {
  agentId?: string;
  isActive?: boolean;
};

export async function POST(request: Request) {
  const adminCheck = await requireAdmin();

  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  try {
    const body = (await request.json()) as Body;
    const agentId = body.agentId?.trim();

    if (!agentId) {
      return apiError('missing_agent_id', 'agentId is required.', 400);
    }

    const updatePayload: Record<string, boolean | string> = {};

    if (typeof body.isActive === 'boolean') {
      updatePayload.is_active = body.isActive;
    }

    if (Object.keys(updatePayload).length === 0) {
      return apiError(
        'missing_update_fields',
        'Provide isActive.',
        400
      );
    }

    const admin = createSupabaseAdminClient();
    const { error: updateError } = await admin
      .from('agents')
      .update(updatePayload)
      .eq('id', agentId);

    if (updateError) {
      throw new Error(updateError.message || 'Unable to update agent.');
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    return apiError(
      'agent_update_failed',
      error instanceof Error ? error.message : 'Unable to update agent.',
      500
    );
  }
}
