import 'server-only';

import {
  AgentCertificationStatus,
  AgentStatus,
  computeAgentStatus,
} from '@/lib/agent-status';
import { MembershipStatus, selectPreferredMembership } from '@/lib/membership';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';

type RefreshResult = {
  agentStatus: AgentStatus;
  certificationStatus: AgentCertificationStatus;
  membershipStatus: MembershipStatus;
  profileCompleted: boolean;
};

type ActivationClient = ReturnType<typeof createSupabaseAdminClient>;

export async function refreshAgentActivationStatus(
  agentIdentifier: string,
  supabaseAdmin: ActivationClient = createSupabaseAdminClient()
): Promise<RefreshResult> {
  const { data: agent, error: agentError } = await supabaseAdmin
    .from('agents')
    .select('id, profile_completed, certification_status')
    .or(`id.eq.${agentIdentifier},user_id.eq.${agentIdentifier}`)
    .maybeSingle();

  if (agentError) {
    throw new Error(agentError.message || 'Unable to load agent activation data.');
  }

  if (!agent) {
    throw new Error('Agent not found.');
  }

  const [{ data: memberships, error: membershipsError }] =
    await Promise.all([
      supabaseAdmin
        .from('memberships')
        .select('id, status, starts_at, expires_at, created_at')
        .eq('agent_id', agent.id)
        .order('created_at', { ascending: false }),
    ]);

  if (membershipsError) {
    throw new Error(
      membershipsError.message || 'Unable to load membership activation data.'
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
      status: membership.status as MembershipStatus,
    }))
  );

  const profileCompleted = Boolean(agent.profile_completed);
  const certificationStatus =
    (agent.certification_status as AgentCertificationStatus | undefined) ??
    'not_started';
  const membershipStatus = preferredMembership?.status ?? 'pending';
  const agentStatus = computeAgentStatus({
    certificationStatus,
    membershipStatus,
    profileCompleted,
  });

  const { error: updateError } = await supabaseAdmin
    .from('agents')
    .update({ agent_status: agentStatus })
    .eq('id', agent.id);

  if (updateError) {
    throw new Error(updateError.message || 'Unable to refresh agent status.');
  }

  return {
    agentStatus,
    certificationStatus,
    membershipStatus,
    profileCompleted,
  };
}
