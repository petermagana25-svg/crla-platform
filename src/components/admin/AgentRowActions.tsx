'use client';

import { useMemo, useState, useTransition } from 'react';
import StatusToggle from '@/components/admin/StatusToggle';
import { AdminAgent } from '@/lib/admin-agents';
import { computeAgentStatus } from '@/lib/agent-status';
import useUpdateOverride from '@/lib/use-update-override';
import { AgentOverrideField, AgentOverrideValue } from '@/lib/agent-overrides';

type AgentRowActionsProps = {
  agent: AdminAgent;
};

type ToggleRow = {
  field: AgentOverrideField;
  systemValue: boolean;
  value: boolean;
  valueLabel: string;
  label: string;
  icon?: string;
  overrideValue: AgentOverrideValue;
};

function getNextOverrideValue(
  currentOverride: AgentOverrideValue,
  systemValue: boolean
) {
  if (currentOverride === null) {
    return !systemValue;
  }

  return !currentOverride;
}

export default function AgentRowActions({ agent }: AgentRowActionsProps) {
  const updateOverride = useUpdateOverride();
  const [pendingField, setPendingField] = useState<AgentOverrideField | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const {
    finalActive,
    membershipComplete,
    profileComplete,
    systemActive,
    trainingComplete,
  } = computeAgentStatus(agent);

  const rows = useMemo<ToggleRow[]>(
    () => [
      {
        field: 'admin_override_profile_complete',
        label: 'Profile',
        overrideValue: agent.admin_override_profile_complete,
        systemValue: Boolean(agent.profile_completed),
        value: profileComplete,
        valueLabel: profileComplete ? 'Complete' : 'Incomplete',
      },
      {
        field: 'admin_override_training_complete',
        label: 'Training',
        overrideValue: agent.admin_override_training_complete,
        systemValue:
          agent.certification_status === 'completed' ||
          agent.certification_status === 'certified',
        value: trainingComplete,
        valueLabel: trainingComplete ? 'Complete' : 'Incomplete',
      },
      {
        field: 'admin_override_membership_active',
        label: 'Membership',
        overrideValue: agent.admin_override_membership_active,
        systemValue: agent.payment_status === 'active',
        value: membershipComplete,
        valueLabel: membershipComplete ? 'Complete' : 'Incomplete',
      },
      {
        field: 'admin_override_active',
        icon: finalActive ? '🟢' : '🔴',
        label: 'Directory',
        overrideValue: agent.admin_override_active,
        systemValue: systemActive,
        value: finalActive,
        valueLabel: finalActive ? '🟢 Active' : '🔴 Inactive',
      },
    ],
    [agent, finalActive, membershipComplete, profileComplete, systemActive, trainingComplete]
  );

  function handleOverrideUpdate(
    field: AgentOverrideField,
    nextValue: AgentOverrideValue
  ) {
    console.log('[AgentRowActions] Override clicked.', {
      agentId: agent.id,
      field,
      nextValue,
    });

    setErrorMessage(null);
    setPendingField(field);

    startTransition(() => {
      void (async () => {
        try {
          const result = await updateOverride(agent.id, field, nextValue);

          console.log('[AgentRowActions] Override response.', {
            agentId: agent.id,
            field,
            nextValue,
            result,
          });
        } catch (error) {
          console.error('[AgentRowActions] Override update failed.', {
            agentId: agent.id,
            field,
            nextValue,
            error,
          });

          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'Unable to update the override.'
          );
        } finally {
          setPendingField(null);
        }
      })();
    });
  }

  return (
    <div className="space-y-0">
      {rows.map((row, index) => {
        const isUpdating = pendingField === row.field;
        const isDisabled = pendingField !== null || isPending;

        return (
          <div
            key={row.field}
            className={`${
              index === rows.length - 1 ? '' : 'border-b border-white/5'
            }`}
          >
            <StatusToggle
              disabled={isDisabled}
              icon={row.icon}
              isLoading={isUpdating}
              label={row.label}
              overrideValue={row.overrideValue}
              value={row.value}
              valueLabel={row.valueLabel}
              onReset={
                row.overrideValue !== null
                  ? () => handleOverrideUpdate(row.field, null)
                  : undefined
              }
              onToggle={() =>
                handleOverrideUpdate(
                  row.field,
                  getNextOverrideValue(row.overrideValue, row.systemValue)
                )
              }
            />
          </div>
        );
      })}

      {errorMessage && (
        <p className="pt-2 text-xs text-red-300">{errorMessage}</p>
      )}
    </div>
  );
}
