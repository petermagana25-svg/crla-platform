'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type CertificationStatus = 'none' | 'in_progress' | 'certified';

type Agent = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  certification_status: CertificationStatus | null;
  is_active: boolean | null;
};

type ActiveRowState = {
  id: string;
  action: 'status' | 'active';
} | null;

const certificationOptions: CertificationStatus[] = [
  'none',
  'in_progress',
  'certified',
];

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
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

    const { data, error } = await supabase
      .from('agents')
      .select('id, full_name, email, role, certification_status, is_active');

    if (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Unable to load agents.',
      });
      setAgents([]);
      setIsLoading(false);
      return;
    }

    setAgents(data ?? []);
    setIsLoading(false);
  }

  async function updateCertificationStatus(
    agentId: string,
    certificationStatus: CertificationStatus
  ) {
    setActiveRow({ id: agentId, action: 'status' });
    setMessage(null);

    try {
      const { error } = await supabase
        .from('agents')
        .update({ certification_status: certificationStatus })
        .eq('id', agentId);

      if (error) {
        throw new Error(error.message || 'Unable to update certification status.');
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
            : 'Unable to update certification status.',
      });
    } finally {
      setActiveRow(null);
    }
  }

  async function toggleActive(agent: Agent) {
    setActiveRow({ id: agent.id, action: 'active' });
    setMessage(null);

    try {
      const { error } = await supabase
        .from('agents')
        .update({ is_active: !agent.is_active })
        .eq('id', agent.id);

      if (error) {
        throw new Error(error.message || 'Unable to update active status.');
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

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Agents</h2>
        <p className="mt-1 text-sm text-slate-400">
          Manage certification progress and account activity for agents.
        </p>
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
                <th className="px-4 py-3 font-medium">Certification</th>
                <th className="px-4 py-3 font-medium">Active</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {agents.map((agent) => {
                const isProcessing = activeRow?.id === agent.id;
                const isUpdatingStatus =
                  isProcessing && activeRow?.action === 'status';
                const isUpdatingActive =
                  isProcessing && activeRow?.action === 'active';

                return (
                  <tr key={agent.id} className="text-sm text-slate-200">
                    <td className="px-4 py-4">{agent.full_name || '—'}</td>
                    <td className="px-4 py-4">{agent.email || '—'}</td>
                    <td className="px-4 py-4">{agent.role || '—'}</td>
                    <td className="px-4 py-4">
                      <select
                        value={agent.certification_status || 'none'}
                        onChange={(event) =>
                          updateCertificationStatus(
                            agent.id,
                            event.target.value as CertificationStatus
                          )
                        }
                        disabled={isProcessing}
                        className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition focus:border-white/20 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {certificationOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-300">
                        {agent.is_active ? 'active' : 'inactive'}
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
                      {isUpdatingStatus && (
                        <p className="mt-2 text-xs text-slate-400">Updating...</p>
                      )}
                    </td>
                  </tr>
                );
              })}

              {!isLoading && agents.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-sm text-slate-400"
                  >
                    No agents found.
                  </td>
                </tr>
              )}

              {isLoading && (
                <tr>
                  <td
                    colSpan={6}
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
