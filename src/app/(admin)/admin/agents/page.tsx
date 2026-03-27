'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Membership,
  MembershipStatus,
  selectPreferredMembership,
} from '@/lib/membership';
import { supabase } from '@/lib/supabase';

type CertificationStatus = 'not_started' | 'in_progress' | 'completed';
type AgentStatus = 'pending' | 'in_progress' | 'active';
type FilterStatus = 'all' | AgentStatus;

type Agent = {
  agent_status: AgentStatus | null;
  created_at: string | null;
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  certification_status: CertificationStatus | null;
  is_active: boolean | null;
  profile_completed: boolean | null;
  payment_status: MembershipStatus;
};

type ActiveRowState = {
  action: 'active';
  id: string;
} | null;

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [activeRow, setActiveRow] = useState<ActiveRowState>(null);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    fetchAgents();
  }, []);

  useEffect(() => {
    if (message?.type !== 'success') {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setMessage(null);
    }, 1500);

    return () => window.clearTimeout(timeoutId);
  }, [message]);

  async function fetchAgents() {
    setIsLoading(true);

    const [{ data, error }, { data: membershipsData, error: membershipsError }] =
      await Promise.all([
        supabase
          .from('agents')
          .select(
            'agent_status, created_at, id, full_name, email, role, certification_status, is_active, profile_completed'
          )
          .order('created_at', { ascending: false }),
        supabase
          .from('memberships')
          .select(
            'agent_id, id, plan_name, status, amount, currency, renewal_period, starts_at, expires_at, created_at'
          )
          .order('created_at', { ascending: false }),
      ]);

    if (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Unable to load agents.',
      });
      setAgents([]);
      setIsLoading(false);
      return;
    }

    if (membershipsError) {
      setMessage({
        type: 'error',
        text: membershipsError.message || 'Unable to load membership statuses.',
      });
      setAgents([]);
      setIsLoading(false);
      return;
    }

    const membershipRows =
      ((membershipsData ?? []) as (Membership & { agent_id: string })[]) ?? [];
    const membershipsByAgentId = membershipRows.reduce<
      Record<string, Membership[]>
    >((collection, membership) => {
      collection[membership.agent_id] = [
        ...(collection[membership.agent_id] ?? []),
        membership,
      ];

      return collection;
    }, {});

    const mappedAgents: Agent[] = ((data ?? []) as Omit<Agent, 'payment_status'>[])
      .map((agent) => ({
        ...agent,
        payment_status:
          selectPreferredMembership(membershipsByAgentId[agent.id] ?? [])?.status ??
          'pending',
      }));

    setAgents(mappedAgents);
    setIsLoading(false);
  }

  async function toggleActive(agent: Agent) {
    setActiveRow({ id: agent.id, action: 'active' });
    setMessage(null);

    try {
      const response = await fetch('/api/admin/agents/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId: agent.id,
          isActive: !agent.is_active,
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | {
            error?: { message?: string };
            success?: boolean;
          }
        | null;

      if (!response.ok || !result?.success) {
        throw new Error(result?.error?.message || 'Unable to update active status.');
      }

      await fetchAgents();
      setMessage({
        type: 'success',
        text: 'Updated ✓',
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Unable to update active status.',
      });
    } finally {
      setActiveRow(null);
    }
  }

  function getBadgeClass(value: string) {
    if (value === 'active' || value === 'completed' || value === 'complete') {
      return 'border border-emerald-400/30 bg-emerald-400/10 text-emerald-200';
    }

    if (value === 'in_progress') {
      return 'border border-yellow-400/30 bg-yellow-400/10 text-yellow-200';
    }

    return 'border border-red-400/30 bg-red-400/10 text-red-200';
  }

  function formatLabel(value: string) {
    return value.split('_').join(' ');
  }

  const filteredAgents = useMemo(() => {
    if (filter === 'all') {
      return agents;
    }

    return agents.filter((agent) => (agent.agent_status ?? 'pending') === filter);
  }, [agents, filter]);

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Agents</h2>
        <p className="mt-1 text-sm text-slate-400">
          Manage certification progress and account activity for agents.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {(['all', 'pending', 'in_progress', 'active'] as FilterStatus[]).map(
          (value) => {
            const isSelected = filter === value;

            return (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  isSelected
                    ? 'bg-[var(--gold-main)] text-black shadow-[0_10px_30px_rgba(212,175,55,.25)]'
                    : 'border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                {value === 'all' ? 'All' : formatLabel(value)}
              </button>
            );
          }
        )}
      </div>

      {message && (
        <div
          className={`rounded-2xl px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'border border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
              : 'border border-red-400/30 bg-red-400/10 text-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10 text-left">
            <thead className="bg-white/5">
              <tr className="text-xs uppercase tracking-[0.2em] text-slate-400">
                <th className="px-4 py-3 font-medium">Full Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Profile</th>
                <th className="px-4 py-3 font-medium">Certification</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 font-medium">Agent Status</th>
                <th className="px-4 py-3 font-medium">Directory</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredAgents.map((agent) => {
                const isProcessing = activeRow?.id === agent.id;
                const isUpdatingActive =
                  isProcessing && activeRow?.action === 'active';

                return (
                  <tr key={agent.id} className="text-sm text-slate-200">
                    <td className="px-4 py-4">{agent.full_name || '—'}</td>
                    <td className="px-4 py-4">{agent.email || '—'}</td>
                    <td className="px-4 py-4">{agent.role || '—'}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] ${getBadgeClass(
                          agent.profile_completed ? 'complete' : 'incomplete'
                        )}`}
                      >
                        {agent.profile_completed ? 'complete' : 'incomplete'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] ${getBadgeClass(
                          agent.certification_status ?? 'not_started'
                        )}`}
                      >
                        {formatLabel(agent.certification_status ?? 'not_started')}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] ${getBadgeClass(
                          agent.payment_status ?? 'pending'
                        )}`}
                      >
                        {formatLabel(agent.payment_status ?? 'pending')}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] ${getBadgeClass(
                          agent.agent_status ?? 'pending'
                        )}`}
                      >
                        {formatLabel(agent.agent_status ?? 'pending')}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-300">
                        {agent.is_active ? 'enabled' : 'disabled'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => toggleActive(agent)}
                        disabled={isProcessing}
                        className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isUpdatingActive
                          ? 'Updating...'
                          : agent.is_active
                            ? 'Deactivate'
                            : 'Activate'}
                      </button>
                    </td>
                  </tr>
                );
              })}

              {!isLoading && filteredAgents.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-8 text-center text-sm text-slate-400"
                  >
                    No agents found.
                  </td>
                </tr>
              )}

              {isLoading && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-8 text-center text-sm text-slate-400"
                  >
                    Loading agents...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
