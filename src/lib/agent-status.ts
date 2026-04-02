import { AgentOverrideValue } from '@/lib/agent-overrides';
import { MembershipStatus } from '@/lib/membership';

export type AgentCertificationStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'certified'
  | null;

export type AgentStatus = 'pending' | 'in_progress' | 'active';

type ActivationInputs = {
  certificationStatus: AgentCertificationStatus;
  membershipStatus: MembershipStatus;
  profileCompleted: boolean;
};

type AgentStatusSource = {
  admin_override_active?: AgentOverrideValue;
  admin_override_membership_active?: AgentOverrideValue;
  admin_override_profile_complete?: AgentOverrideValue;
  admin_override_training_complete?: AgentOverrideValue;
  certification_status: AgentCertificationStatus;
  is_active: boolean | null;
  membership_status?: MembershipStatus;
  payment_status?: MembershipStatus;
  profile_completed: boolean | null;
};

export type ComputedAgentStatus = {
  finalActive: boolean;
  finalAgentStatus: 'active' | 'inactive';
  membershipComplete: boolean;
  profileComplete: boolean;
  canonicalAgentStatus: AgentStatus;
  systemActive: boolean;
  trainingComplete: boolean;
};

function resolveOverrideValue(
  systemValue: boolean,
  overrideValue: AgentOverrideValue | undefined
) {
  if (overrideValue === null || overrideValue === undefined) {
    return systemValue;
  }

  return overrideValue;
}

function computeCanonicalAgentStatus({
  membershipComplete,
  profileComplete,
  trainingComplete,
}: {
  membershipComplete: boolean;
  profileComplete: boolean;
  trainingComplete: boolean;
}): AgentStatus {
  if (!profileComplete) {
    return 'pending';
  }

  if (trainingComplete && membershipComplete) {
    return 'active';
  }

  return 'in_progress';
}

function computeBaseAgentStatus({
  certificationStatus,
  membershipStatus,
  profileCompleted,
}: ActivationInputs): AgentStatus {
  return computeCanonicalAgentStatus({
    membershipComplete: membershipStatus === 'active',
    profileComplete: profileCompleted,
    trainingComplete:
      certificationStatus === 'completed' || certificationStatus === 'certified',
  });
}

function isActivationInputs(
  value: ActivationInputs | AgentStatusSource
): value is ActivationInputs {
  return 'certificationStatus' in value;
}

export function computeAgentStatus(inputs: ActivationInputs): AgentStatus;
export function computeAgentStatus(agent: AgentStatusSource): ComputedAgentStatus;
// SINGLE SOURCE OF TRUTH
// DO NOT replicate this logic elsewhere
export function computeAgentStatus(inputs: ActivationInputs | AgentStatusSource) {
  if (isActivationInputs(inputs)) {
    return computeBaseAgentStatus(inputs);
  }

  const profileComplete = resolveOverrideValue(
    Boolean(inputs.profile_completed),
    inputs.admin_override_profile_complete
  );
  const trainingComplete = resolveOverrideValue(
    inputs.certification_status === 'completed' ||
      inputs.certification_status === 'certified',
    inputs.admin_override_training_complete
  );
  const membershipStatus = inputs.membership_status ?? inputs.payment_status ?? 'pending';
  const membershipComplete = resolveOverrideValue(
    membershipStatus === 'active',
    inputs.admin_override_membership_active
  );
  const systemActive =
    profileComplete && trainingComplete && membershipComplete;
  const finalActive = resolveOverrideValue(
    systemActive,
    inputs.admin_override_active
  );
  const canonicalAgentStatus = computeCanonicalAgentStatus({
    membershipComplete,
    profileComplete,
    trainingComplete,
  });

  return {
    finalActive,
    finalAgentStatus: finalActive ? 'active' : 'inactive',
    membershipComplete,
    profileComplete,
    canonicalAgentStatus,
    systemActive,
    trainingComplete,
  };
}
