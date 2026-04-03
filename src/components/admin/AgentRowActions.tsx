'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
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

type ConfirmAction = 'reset' | 'delete';

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
  const router = useRouter();
  const updateOverride = useUpdateOverride();
  const [pendingField, setPendingField] = useState<AgentOverrideField | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [pendingMutation, setPendingMutation] = useState<ConfirmAction | null>(null);
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

  const isProtectedAgent = agent.role === 'admin';
  const isBusy = pendingField !== null || isPending || pendingMutation !== null;

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
    setSuccessMessage(null);
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
          setSuccessMessage('Override updated.');
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

  async function handleAgentAction(action: ConfirmAction) {
    setPendingMutation(action);
    setErrorMessage(null);
    setSuccessMessage(null);

    const route =
      action === 'delete'
        ? '/api/admin/agents/delete'
        : '/api/admin/agents/reset';
    const method = action === 'delete' ? 'DELETE' : 'POST';

    console.log('[AgentRowActions] Admin agent action started.', {
      action,
      agentId: agent.id,
    });

    try {
      const response = await fetch(route, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId: agent.id,
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | {
            error?: {
              message?: string;
            };
            success?: boolean;
          }
        | null;

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.error?.message ||
            `Unable to ${action === 'delete' ? 'delete' : 'reset'} agent.`
        );
      }

      setSuccessMessage(
        action === 'delete' ? 'Agent deleted.' : 'Agent reset for re-onboarding.'
      );
      setConfirmAction(null);
      router.refresh();
    } catch (error) {
      console.error('[AgentRowActions] Admin agent action failed.', {
        action,
        agentId: agent.id,
        error,
      });

      setErrorMessage(
        error instanceof Error
          ? error.message
          : `Unable to ${action === 'delete' ? 'delete' : 'reset'} agent.`
      );
    } finally {
      setPendingMutation(null);
    }
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
              disabled={isDisabled || isBusy}
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

      <div className="border-t border-white/10 pt-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setErrorMessage(null);
              setSuccessMessage(null);
              setConfirmAction('reset');
            }}
            disabled={isBusy || isProtectedAgent}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pendingMutation === 'reset' ? 'Resetting...' : 'Reset Agent'}
          </button>

          <button
            type="button"
            onClick={() => {
              setErrorMessage(null);
              setSuccessMessage(null);
              setConfirmAction('delete');
            }}
            disabled={isBusy || isProtectedAgent}
            className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs font-medium text-red-200 transition hover:bg-red-400/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pendingMutation === 'delete' ? 'Deleting...' : 'Delete Agent'}
          </button>

          {isProtectedAgent && (
            <span className="text-xs text-slate-400">
              Protected admin account
            </span>
          )}
        </div>
      </div>

      {successMessage && (
        <p className="pt-2 text-xs text-emerald-300">{successMessage}</p>
      )}

      {errorMessage && (
        <p className="pt-2 text-xs text-red-300">{errorMessage}</p>
      )}

      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[var(--navy-dark)] p-6 shadow-[0_30px_90px_rgba(0,0,0,.45)]">
            <p
              className={`text-xs uppercase tracking-[0.2em] ${
                confirmAction === 'delete' ? 'text-red-300' : 'text-[var(--gold-main)]'
              }`}
            >
              {confirmAction === 'delete'
                ? 'Permanent Delete'
                : 'Reset For Testing'}
            </p>
            <h3 className="mt-3 text-2xl font-semibold text-white">
              {confirmAction === 'delete'
                ? 'Delete this agent permanently?'
                : 'Reset this agent for re-onboarding?'}
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {confirmAction === 'delete'
                ? 'This will permanently delete the agent, related membership/payment records, and auth access.'
                : 'This keeps the auth user but disconnects the agent from onboarding so you can test the invite and setup flow again.'}
            </p>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
              <p>Name: {agent.full_name || 'Unnamed agent'}</p>
              <p className="mt-1">Email: {agent.email || '—'}</p>
              <p className="mt-1">Role: {agent.role || 'agent'}</p>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                disabled={pendingMutation !== null}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleAgentAction(confirmAction)}
                disabled={pendingMutation !== null}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  confirmAction === 'delete'
                    ? 'bg-red-500 text-white hover:bg-red-400'
                    : 'bg-[var(--gold-main)] text-black hover:bg-[var(--gold-soft)]'
                }`}
              >
                {pendingMutation === confirmAction
                  ? confirmAction === 'delete'
                    ? 'Deleting...'
                    : 'Resetting...'
                  : confirmAction === 'delete'
                    ? 'Delete Agent'
                    : 'Reset Agent'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
