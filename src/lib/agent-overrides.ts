export const AGENT_OVERRIDE_FIELDS = [
  'admin_override_active',
  'admin_override_profile_complete',
  'admin_override_training_complete',
  'admin_override_membership_active',
] as const;

export type AgentOverrideField = (typeof AGENT_OVERRIDE_FIELDS)[number];
export type AgentOverrideValue = boolean | null;

export function isAgentOverrideField(value: unknown): value is AgentOverrideField {
  return (
    typeof value === 'string' &&
    AGENT_OVERRIDE_FIELDS.includes(value as AgentOverrideField)
  );
}

export function isAgentOverrideValue(value: unknown): value is AgentOverrideValue {
  return value === null || typeof value === 'boolean';
}
