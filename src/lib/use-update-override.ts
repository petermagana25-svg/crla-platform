'use client';

import { useRouter } from 'next/navigation';
import { AgentOverrideField, AgentOverrideValue } from '@/lib/agent-overrides';
import { updateOverride as requestOverrideUpdate } from '@/lib/update-agent-override';

export default function useUpdateOverride() {
  const router = useRouter();

  async function updateOverride(
    agentId: string,
    field: AgentOverrideField,
    value: AgentOverrideValue
  ) {
    const data = await requestOverrideUpdate(agentId, field, value);
    router.refresh();
    return data;
  }

  return updateOverride;
}

export { useUpdateOverride };
