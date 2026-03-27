'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type AgentApplication = {
  id: string;
  full_name: string | null;
  email: string | null;
  license_number: string | null;
  status: string | null;
};

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<AgentApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [activeRow, setActiveRow] = useState<{
    id: string;
    action: 'approve' | 'reject';
  } | null>(null);

  useEffect(() => {
    fetchApplications();
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

  async function fetchApplications() {
    setIsLoading(true);

    const { data, error } = await supabase
      .from('agent_applications')
      .select('id, full_name, email, license_number, status');

    if (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Unable to load applications.',
      });
      setApplications([]);
      setIsLoading(false);
      return;
    }

    setApplications(data ?? []);
    setIsLoading(false);
  }

  function readApiError(result: unknown, fallbackMessage: string) {
    if (
      typeof result === 'object' &&
      result !== null &&
      'error' in result &&
      typeof result.error === 'object' &&
      result.error !== null &&
      'message' in result.error &&
      typeof result.error.message === 'string'
    ) {
      if (
        result.error.message.includes('Missing Supabase admin configuration') ||
        result.error.message.includes('SUPABASE_SERVICE_ROLE_KEY')
      ) {
        return 'Admin actions are temporarily unavailable.';
      }

      return result.error.message;
    }

    return fallbackMessage;
  }

  async function handleApprove(application: AgentApplication) {
    if (!application.email || !application.full_name || !application.license_number) {
      setMessage({
        type: 'error',
        text: 'This application is missing required approval details.',
      });
      return;
    }

    setActiveRow({ id: application.id, action: 'approve' });
    setMessage(null);

    try {
      const response = await fetch('/api/admin/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationId: application.id,
          email: application.email,
          full_name: application.full_name,
          license_number: application.license_number,
        }),
      });

      const result = (await response.json()) as unknown;

      if (
        !response.ok ||
        typeof result !== 'object' ||
        result === null ||
        !('success' in result) ||
        result.success !== true
      ) {
        throw new Error(
          readApiError(result, 'Unable to approve application.')
        );
      }

      const successMessage =
        typeof result === 'object' &&
        result !== null &&
        'message' in result &&
        typeof result.message === 'string'
          ? result.message
          : 'Updated ✓';

      await fetchApplications();
      setMessage({
        type: 'success',
        text: successMessage,
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Unable to approve application.',
      });
    } finally {
      setActiveRow(null);
    }
  }

  async function handleReject(applicationId: string) {
    setActiveRow({ id: applicationId, action: 'reject' });
    setMessage(null);

    try {
      const response = await fetch('/api/admin/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ applicationId }),
      });

      const result = (await response.json()) as unknown;

      if (
        !response.ok ||
        typeof result !== 'object' ||
        result === null ||
        !('success' in result) ||
        result.success !== true
      ) {
        throw new Error(
          readApiError(result, 'Unable to reject application.')
        );
      }

      await fetchApplications();
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
            : 'Unable to reject application.',
      });
    } finally {
      setActiveRow(null);
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Applications</h2>
        <p className="mt-1 text-sm text-slate-400">
          Review submitted applications and decide who can join the platform.
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
                <th className="px-4 py-3 font-medium">License Number</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {applications.map((application) => {
                const isPending = application.status === 'pending';
                const isProcessing = activeRow?.id === application.id;
                const isApproving =
                  isProcessing && activeRow?.action === 'approve';
                const isRejecting =
                  isProcessing && activeRow?.action === 'reject';

                return (
                  <tr key={application.id} className="text-sm text-slate-200">
                    <td className="px-4 py-4">{application.full_name || '—'}</td>
                    <td className="px-4 py-4">{application.email || '—'}</td>
                    <td className="px-4 py-4">
                      {application.license_number || '—'}
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-300">
                        {application.status || 'unknown'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {isPending ? (
                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => handleApprove(application)}
                            disabled={isProcessing}
                            className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isApproving ? 'Saving...' : 'Approve'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(application.id)}
                            disabled={isProcessing}
                            className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isRejecting ? 'Saving...' : 'Reject'}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs uppercase tracking-[0.16em] text-slate-500">
                          No actions
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {!isLoading && applications.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-sm text-slate-400"
                  >
                    No applications found.
                  </td>
                </tr>
              )}

              {isLoading && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-sm text-slate-400"
                  >
                    Loading applications...
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
