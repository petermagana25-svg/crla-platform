'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type AgentApplication = {
  id: string;
  full_name: string | null;
  email: string | null;
  license_number: string | null;
  status: string | null;
};

function getStatusBadgeClass(status: string | null) {
  switch (status) {
    case 'pending':
      return 'border-amber-400/30 bg-amber-400/10 text-amber-200';
    case 'approved':
      return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200';
    case 'rejected':
      return 'border-red-400/30 bg-red-400/10 text-red-200';
    default:
      return 'border-white/10 bg-white/5 text-slate-300';
  }
}

export default function AdminApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<AgentApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [activeRow, setActiveRow] = useState<{
    id: string;
    action: 'approve' | 'reject' | 'delete';
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AgentApplication | null>(null);

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
      .select('id, full_name, email, license_number, status')
      .eq('status', 'pending');

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
      router.refresh();
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
      router.refresh();
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

  async function handleDeleteApplication(application: AgentApplication) {
    setActiveRow({ id: application.id, action: 'delete' });
    setMessage(null);

    try {
      const response = await fetch('/api/admin/applications/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ applicationId: application.id }),
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
          readApiError(result, 'Unable to delete application.')
        );
      }

      await fetchApplications();
      router.refresh();
      setDeleteTarget(null);
      setMessage({
        type: 'success',
        text: 'Application deleted.',
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Unable to delete application.',
      });
    } finally {
      setActiveRow(null);
    }
  }

  return (
    <section className="space-y-6 pb-[calc(env(safe-area-inset-bottom)+80px)] md:pb-0">
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

      <div className="space-y-4 md:hidden">
        {applications.map((application) => {
          const isPending = application.status === 'pending';
          const isProcessing = activeRow?.id === application.id;
          const isApproving = isProcessing && activeRow?.action === 'approve';
          const isRejecting = isProcessing && activeRow?.action === 'reject';
          const isDeleting = isProcessing && activeRow?.action === 'delete';

          return (
            <article
              key={application.id}
              className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_16px_40px_rgba(0,0,0,.18)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-white">
                    {application.full_name || 'Unnamed applicant'}
                  </h3>
                  <p className="mt-1 break-words text-sm text-slate-400">
                    {application.email || application.id}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] ${getStatusBadgeClass(
                    application.status
                  )}`}
                >
                  {application.status || 'unknown'}
                </span>
              </div>

              <dl className="mt-4 space-y-3">
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                    License Number
                  </dt>
                  <dd className="mt-1 text-sm text-slate-200">
                    {application.license_number || '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                    Application ID
                  </dt>
                  <dd className="mt-1 break-all text-sm text-slate-400">
                    {application.id}
                  </dd>
                </div>
              </dl>

              <div className="mt-5 space-y-2">
                {isPending ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleApprove(application)}
                      disabled={isProcessing}
                      className="min-h-11 w-full rounded-xl bg-emerald-400 px-4 py-3 text-sm font-medium text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isApproving ? 'Saving...' : 'Approve'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReject(application.id)}
                      disabled={isProcessing}
                      className="min-h-11 w-full rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isRejecting ? 'Saving...' : 'Reject'}
                    </button>
                  </>
                ) : (
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    No actions available
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => setDeleteTarget(application)}
                  disabled={isProcessing}
                  className="min-h-11 w-full rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm font-medium text-red-200 transition hover:bg-red-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </article>
          );
        })}

        {!isLoading && applications.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-8 text-center text-sm text-slate-400">
            No applications found.
          </div>
        )}

        {isLoading && (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-8 text-center text-sm text-slate-400">
            Loading applications...
          </div>
        )}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-white/10 bg-white/5 md:block">
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
                const isDeleting =
                  isProcessing && activeRow?.action === 'delete';

                return (
                  <tr key={application.id} className="text-sm text-slate-200">
                    <td className="px-4 py-4">{application.full_name || '—'}</td>
                    <td className="px-4 py-4">{application.email || '—'}</td>
                    <td className="px-4 py-4">
                      {application.license_number || '—'}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] ${getStatusBadgeClass(
                          application.status
                        )}`}
                      >
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
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(application)}
                            disabled={isProcessing}
                            className="rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-xs uppercase tracking-[0.16em] text-slate-500">
                            No actions
                          </span>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(application)}
                            disabled={isProcessing}
                            className="rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
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

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[var(--navy-dark)] p-6 shadow-[0_30px_90px_rgba(0,0,0,.45)]">
            <p className="text-xs uppercase tracking-[0.2em] text-red-300">
              Final Confirmation
            </p>
            <h3 className="mt-3 text-2xl font-semibold text-white">
              Delete this application?
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              You are permanently deleting the application for{' '}
              <span className="font-medium text-white">
                {deleteTarget.full_name || deleteTarget.email || 'this applicant'}
              </span>
              . This cannot be undone.
            </p>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
              <p>Email: {deleteTarget.email || '—'}</p>
              <p className="mt-1">License: {deleteTarget.license_number || '—'}</p>
              <p className="mt-1">Status: {deleteTarget.status || 'unknown'}</p>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={
                  activeRow?.id === deleteTarget.id &&
                  activeRow?.action === 'delete'
                }
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteApplication(deleteTarget)}
                disabled={
                  activeRow?.id === deleteTarget.id &&
                  activeRow?.action === 'delete'
                }
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {activeRow?.id === deleteTarget.id &&
                activeRow?.action === 'delete'
                  ? 'Deleting...'
                  : 'Delete Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
