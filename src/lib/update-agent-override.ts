import {
  AgentOverrideField,
  AgentOverrideValue,
  isAgentOverrideField,
  isAgentOverrideValue,
} from '@/lib/agent-overrides';

type UpdateAgentOverrideError = {
  code?: string;
  message?: string;
};

export type UpdateAgentOverrideResult = {
  agentId: string;
  adminUpdatedAt: string;
  finalActive: boolean;
  finalAgentStatus: 'active' | 'inactive';
  field: AgentOverrideField;
  value: AgentOverrideValue;
};

type UpdateAgentOverrideResponse =
  | {
      success: true;
      agentId: string;
      adminUpdatedAt: string;
      finalActive: boolean;
      finalAgentStatus: 'active' | 'inactive';
      field: AgentOverrideField;
      value: AgentOverrideValue;
    }
  | {
      success: false;
      error?: UpdateAgentOverrideError;
    };

export async function updateOverride(
  agentId: string,
  field: AgentOverrideField,
  value: AgentOverrideValue
) {
  const trimmedAgentId = agentId.trim();

  if (!trimmedAgentId) {
    throw new Error('agentId is required.');
  }

  if (!isAgentOverrideField(field)) {
    throw new Error('Invalid override field.');
  }

  if (!isAgentOverrideValue(value)) {
    throw new Error('Invalid override value.');
  }

  const response = await fetch('/api/admin/update-agent-override', {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      agentId: trimmedAgentId,
      field,
      value,
    }),
  });

  const result = (await response.json().catch(() => null)) as
    | UpdateAgentOverrideResponse
    | null;
  const errorMessage =
    result && 'error' in result
      ? result.error?.message
      : null;

  if (!response.ok || !result?.success) {
    throw new Error(errorMessage || 'Unable to update the agent override.');
  }

  return {
    adminUpdatedAt: result.adminUpdatedAt,
    agentId: result.agentId,
    field: result.field,
    finalActive: result.finalActive,
    finalAgentStatus: result.finalAgentStatus,
    value: result.value,
  } satisfies UpdateAgentOverrideResult;
}
