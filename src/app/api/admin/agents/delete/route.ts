import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { apiError, requireAdmin } from '../../_utils';

export const runtime = 'nodejs';

type DeleteAgentBody = {
  agentId?: string;
};

export async function DELETE(request: Request) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.ok) {
      return adminCheck.response;
    }

    let body: DeleteAgentBody;

    try {
      body = (await request.json()) as DeleteAgentBody;
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
      console.error('[admin-agent-delete] agent lookup failed', {
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
        'Admin accounts cannot be deleted from this tool.',
        403
      );
    }

    if (agent.user_id && agent.user_id === adminCheck.userId) {
      return apiError(
        'self_delete_blocked',
        'You cannot delete your own linked agent account.',
        403
      );
    }

    const { error: paymentsDeleteError } = await admin
      .from('membership_payments')
      .delete()
      .eq('agent_id', agentId);

    if (paymentsDeleteError) {
      console.error('[admin-agent-delete] payment delete failed', {
        agentId,
        error: paymentsDeleteError,
      });

      return apiError(
        'payment_delete_failed',
        paymentsDeleteError.message || 'Unable to delete membership payments.',
        500
      );
    }

    console.log('membership payments deleted', {
      agentId,
    });

    const { error: membershipsDeleteError } = await admin
      .from('memberships')
      .delete()
      .eq('agent_id', agentId);

    if (membershipsDeleteError) {
      console.error('[admin-agent-delete] membership delete failed', {
        agentId,
        error: membershipsDeleteError,
      });

      return apiError(
        'membership_delete_failed',
        membershipsDeleteError.message || 'Unable to delete memberships.',
        500
      );
    }

    console.log('memberships deleted', {
      agentId,
    });

    if (agent.user_id) {
      const { error: authDeleteError } = await admin.auth.admin.deleteUser(
        agent.user_id
      );

      if (authDeleteError) {
        console.error('[admin-agent-delete] auth user delete failed', {
          agentId,
          authUserId: agent.user_id,
          error: authDeleteError,
        });

        return apiError(
          'auth_delete_failed',
          authDeleteError.message || 'Unable to delete auth user.',
          500
        );
      }

      console.log('auth user deleted', {
        agentId,
        authUserId: agent.user_id,
      });
    }

    const { error: agentDeleteError } = await admin
      .from('agents')
      .delete()
      .eq('id', agentId);

    if (agentDeleteError) {
      console.error('[admin-agent-delete] agent delete failed', {
        agentId,
        error: agentDeleteError,
      });

      return apiError(
        'agent_delete_failed',
        agentDeleteError.message || 'Unable to delete agent.',
        500
      );
    }

    console.log('agent deleted', {
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
    console.error('[admin-agent-delete] unexpected failure', { error });

    return apiError(
      'agent_delete_failed',
      error instanceof Error ? error.message : 'Delete request failed.',
      500
    );
  }
}
