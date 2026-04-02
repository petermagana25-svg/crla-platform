import {
  AgentCertificationStatus,
  AgentStatus,
  computeAgentStatus,
} from '@/lib/agent-status';
import { AgentOverrideValue } from '@/lib/agent-overrides';
import { MembershipStatus } from '@/lib/membership';

export type AdminAgent = {
  admin_override_active: AgentOverrideValue;
  admin_override_membership_active: AgentOverrideValue;
  admin_override_profile_complete: AgentOverrideValue;
  admin_override_training_complete: AgentOverrideValue;
  admin_updated_at: string | null;
  agent_status: AgentStatus | null;
  created_at: string | null;
  email: string | null;
  full_name: string | null;
  id: string;
  is_active: boolean | null;
  payment_status: MembershipStatus;
  profile_completed: boolean | null;
  role: string | null;
  certification_status: AgentCertificationStatus;
};

export type AdminAgentFilterStatus = 'all' | 'active' | 'inactive';
export type AdminAgentFinalStatus = AgentStatus | 'disabled';

export function getSystemTrainingComplete(
  certificationStatus: AgentCertificationStatus
) {
  return certificationStatus === 'completed' || certificationStatus === 'certified';
}

export function getSystemMembershipActive(status: MembershipStatus) {
  return status === 'active';
}

export function getFinalProfileComplete(agent: AdminAgent) {
  return computeAgentStatus(agent).profileComplete;
}

export function getFinalTrainingComplete(agent: AdminAgent) {
  return computeAgentStatus(agent).trainingComplete;
}

export function getFinalMembershipActive(agent: AdminAgent) {
  return computeAgentStatus(agent).membershipComplete;
}

export function getFinalDirectoryActive(agent: AdminAgent) {
  return computeAgentStatus(agent).finalActive;
}

export function getFinalAgentStatus(agent: AdminAgent): AdminAgentFinalStatus {
  const computed = computeAgentStatus(agent);

  if (!computed.finalActive) {
    return 'disabled';
  }

  return computed.canonicalAgentStatus;
}

export function getBooleanStatusLabel(value: boolean) {
  return value ? 'Yes' : 'No';
}

export function getFinalStatusLabel(status: AdminAgentFinalStatus) {
  if (status === 'disabled') {
    return 'Disabled';
  }

  return status.split('_').join(' ');
}

export function getOverrideBadgeLabel(value: AgentOverrideValue | undefined) {
  if (value !== true) {
    return 'No override';
  }

  return 'Override on';
}
