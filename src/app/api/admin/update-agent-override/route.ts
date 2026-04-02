import { NextResponse } from 'next/server';
import { computeAgentStatus } from '@/lib/agent-status';
import {
  AgentOverrideField,
  AgentOverrideValue,
  isAgentOverrideField,
  isAgentOverrideValue,
} from '@/lib/agent-overrides';
import { selectPreferredMembership } from '@/lib/membership';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { apiError, requireAdmin } from '../_utils';

export const runtime = 'nodejs';

type UpdateAgentOverrideBody = {
  agentId: string;
  field: AgentOverrideField;
  value: AgentOverrideValue;
};

function validateBody(body: unknown):
  | { ok: true; data: UpdateAgentOverrideBody }
  | { ok: false; response: NextResponse } {
  if (typeof body !== 'object' || body === null) {
    console.error('[api/admin/update-agent-override] Invalid body payload.', {
      body,
    });

    return {
      ok: false,
      response: apiError('invalid_body', 'Request body must be a JSON object.', 400),
    };
  }

  const { agentId, field, value } = body as {
    agentId?: unknown;
    field?: unknown;
    value?: unknown;
  };

  const trimmedAgentId = typeof agentId === 'string' ? agentId.trim() : '';

  if (!trimmedAgentId) {
    console.error('[api/admin/update-agent-override] Missing agentId.', {
      agentId,
    });

    return {
      ok: false,
      response: apiError('missing_agent_id', 'agentId is required.', 400),
    };
  }

  if (!isAgentOverrideField(field)) {
    console.error('[api/admin/update-agent-override] Invalid override field.', {
      field,
    });

    return {
      ok: false,
      response: apiError('invalid_field', 'Invalid override field.', 400),
    };
  }

  if (!isAgentOverrideValue(value)) {
    console.error('[api/admin/update-agent-override] Invalid override value.', {
      field,
      value,
    });

    return {
      ok: false,
      response: apiError('invalid_value', 'value must be boolean or null.', 400),
    };
  }

  return {
    ok: true,
    data: {
      agentId: trimmedAgentId,
      field,
      value,
    },
  };
}

export async function POST(request: Request) {
  console.log('[api/admin/update-agent-override] POST request received.');

  const adminCheck = await requireAdmin();

  if (!adminCheck.ok) {
    console.warn('[api/admin/update-agent-override] Admin check failed.');
    return adminCheck.response;
  }

  console.log('[api/admin/update-agent-override] Admin verified.', {
    adminUserId: adminCheck.userId,
  });

  try {
    let parsedBody: unknown;

    try {
      parsedBody = await request.json();
    } catch (error) {
      console.error('[api/admin/update-agent-override] Failed to parse JSON body.', {
        error,
      });

      return apiError('invalid_json', 'Request body must be valid JSON.', 400);
    }

    const validation = validateBody(parsedBody);

    if (!validation.ok) {
      return validation.response;
    }

    const { agentId, field, value } = validation.data;
    const adminUpdatedAt = new Date().toISOString();
    const supabaseAdmin = createSupabaseAdminClient();
    const overrideUpdatePayload: Partial<
      Record<AgentOverrideField, AgentOverrideValue>
    > = {
      [field]: value,
    };

    console.log('Override updated:', field, value);
    console.log('[api/admin/update-agent-override] Updating agent override.', {
      adminUserId: adminCheck.userId,
      agentId,
      field,
      value,
      adminUpdatedAt,
    });

    const { data: updatedAgent, error: updateError } = await supabaseAdmin
      .from('agents')
      .update(overrideUpdatePayload)
      .eq('id', agentId)
      .select(
        'id, full_name, is_active, profile_completed, certification_status, admin_override_active, admin_override_profile_complete, admin_override_training_complete, admin_override_membership_active'
      )
      .maybeSingle();

    if (updateError) {
      console.error('[api/admin/update-agent-override] Supabase update failed.', {
        adminUserId: adminCheck.userId,
        agentId,
        field,
        value,
        error: updateError,
      });

      return apiError(
        'override_update_failed',
        updateError.message || 'Unable to update the agent override.',
        500
      );
    }

    if (!updatedAgent) {
      console.warn('[api/admin/update-agent-override] Agent not found.', {
        adminUserId: adminCheck.userId,
        agentId,
      });

      return apiError('agent_not_found', 'Agent not found.', 404);
    }

    const { data: memberships, error: membershipsError } = await supabaseAdmin
      .from('memberships')
      .select('id, status, starts_at, expires_at, created_at')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false });

    if (membershipsError) {
      console.error(
        '[api/admin/update-agent-override] Membership lookup failed.',
        {
          adminUserId: adminCheck.userId,
          agentId,
          error: membershipsError,
        }
      );

      return apiError(
        'membership_lookup_failed',
        membershipsError.message || 'Unable to load membership status.',
        500
      );
    }

    const preferredMembership = selectPreferredMembership(
      (memberships ?? []).map((membership) => ({
        amount: null,
        created_at: membership.created_at,
        currency: null,
        expires_at: membership.expires_at,
        id: membership.id,
        plan_name: null,
        renewal_period: null,
        starts_at: membership.starts_at,
        status: membership.status,
      }))
    );
    const computedStatus = computeAgentStatus({
      ...updatedAgent,
      membership_status: preferredMembership?.status ?? 'pending',
    });

    console.log('Computed status:', {
      name: updatedAgent.full_name,
      finalActive: computedStatus.finalActive,
    });

    const canonicalUpdatePayload = {
      admin_updated_at: adminUpdatedAt,
      agent_status: computedStatus.canonicalAgentStatus,
      is_active: computedStatus.finalActive,
    };

    const { error: canonicalUpdateError } = await supabaseAdmin
      .from('agents')
      .update(canonicalUpdatePayload)
      .eq('id', agentId);

    if (canonicalUpdateError) {
      console.error(
        '[api/admin/update-agent-override] Canonical field sync failed.',
        {
          adminUserId: adminCheck.userId,
          agentId,
          field,
          value,
          error: canonicalUpdateError,
        }
      );

      return apiError(
        'canonical_sync_failed',
        canonicalUpdateError.message || 'Unable to sync agent status.',
        500
      );
    }

    console.log('[api/admin/update-agent-override] Override updated successfully.', {
      adminUserId: adminCheck.userId,
      agentId,
      field,
      value,
      adminUpdatedAt,
      finalActive: computedStatus.finalActive,
      finalAgentStatus: computedStatus.finalAgentStatus,
    });
    console.log('SYNC RESULT:', {
      agentId,
      finalActive: computedStatus.finalActive,
      finalAgentStatus: computedStatus.finalAgentStatus,
    });

    return NextResponse.json({
      success: true,
      agentId,
      finalActive: computedStatus.finalActive,
      finalAgentStatus: computedStatus.finalAgentStatus,
      field,
      value,
      adminUpdatedAt,
    });
  } catch (error) {
    console.error('[api/admin/update-agent-override] Unexpected error.', {
      adminUserId: adminCheck.userId,
      error,
    });

    return apiError(
      'update_agent_override_failed',
      error instanceof Error
        ? error.message
        : 'Unable to update the agent override.',
      500
    );
  }
}
