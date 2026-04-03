import { NextResponse } from 'next/server';
import { refreshAgentActivationStatus } from '@/lib/agent-activation';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { apiError, requireAdmin } from '../../_utils';

export const runtime = 'nodejs';

type ResetAgentBody = {
  agentId?: string;
};

export async function POST(request: Request) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.ok) {
      return adminCheck.response;
    }

    let body: ResetAgentBody;

    try {
      body = (await request.json()) as ResetAgentBody;
    } catch {
      return apiError('invalid_body', 'Invalid JSON body.', 400);
    }

    const agentId = body.agentId?.trim();

    if (!agentId) {
      return apiError('missing_agent_id', 'agentId is required.', 400);
    }

    const admin = createSupabaseAdminClient();
    const { data: agent, error: agentLookupError } = await admin
      .from('agents')
      .select('id, user_id, full_name, email, role')
      .eq('id', agentId)
      .maybeSingle();

    if (agentLookupError) {
      console.error('[admin-agent-reset] agent lookup failed', {
        agentId,
        error: agentLookupError,
      });

      return apiError(
        'agent_lookup_failed',
        agentLookupError.message || 'Unable to load agent.',
        500
      );
    }

    if (!agent) {
      return apiError('agent_not_found', 'Agent not found.', 404);
    }

    if (agent.role === 'admin') {
      return apiError(
        'protected_agent',
        'Admin accounts cannot be reset from this tool.',
        403
      );
    }

    const { error: agentResetError } = await admin
      .from('agents')
      .update({
        user_id: null,
        profile_completed: false,
        phone_number: null,
        license_number: null,
        city: null,
        state: null,
        postal_code: null,
        is_active: false,
        certification_status: 'not_started',
        agent_status: 'pending',
        admin_override_active: null,
        admin_override_profile_complete: null,
        admin_override_training_complete: null,
        admin_override_membership_active: null,
      })
      .eq('id', agentId);

    if (agentResetError) {
      console.error('[admin-agent-reset] agent reset failed', {
        agentId,
        error: agentResetError,
      });

      return apiError(
        'agent_reset_failed',
        agentResetError.message || 'Unable to reset agent.',
        500
      );
    }

    const { error: membershipsResetError } = await admin
      .from('memberships')
      .update({
        status: 'pending',
        starts_at: null,
        expires_at: null,
        stripe_session_id: null,
        stripe_subscription_id: null,
      })
      .eq('agent_id', agentId)
      .eq('status', 'active');

    if (membershipsResetError) {
      console.error('[admin-agent-reset] membership reset failed', {
        agentId,
        error: membershipsResetError,
      });

      return apiError(
        'membership_reset_failed',
        membershipsResetError.message || 'Unable to reset membership state.',
        500
      );
    }

    await refreshAgentActivationStatus(agentId, admin);

    console.log('agent reset', {
      agentId,
      email: agent.email,
      fullName: agent.full_name,
    });

    return NextResponse.json({
      success: true,
      data: {
        agentId,
      },
    });
  } catch (error) {
    console.error('[admin-agent-reset] unexpected failure', { error });

    return apiError(
      'agent_reset_failed',
      error instanceof Error ? error.message : 'Reset request failed.',
      500
    );
  }
}
