import Link from 'next/link';
import { unstable_noStore as noStore } from 'next/cache';
import AgentRowActions from '@/components/admin/AgentRowActions';
import {
  AdminAgent,
  AdminAgentFilterStatus,
} from '@/lib/admin-agents';
import { computeAgentStatus } from '@/lib/agent-status';
import { Membership, selectPreferredMembership } from '@/lib/membership';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

type AdminAgentsPageProps = {
  searchParams?: Promise<{
    filter?: string;
    search?: string;
  }>;
};

type MembershipRow = Membership & {
  agent_id: string;
};

function resolveFilter(value?: string): AdminAgentFilterStatus {
  if (value === 'active' || value === 'inactive') {
    return value;
  }

  return 'all';
}

function buildAgentsHref({
  filter,
  search,
}: {
  filter: AdminAgentFilterStatus;
  search: string;
}) {
  const params = new URLSearchParams();

  if (filter !== 'all') {
    params.set('filter', filter);
  }

  if (search) {
    params.set('search', search);
  }

  const query = params.toString();

  return query ? `/admin/agents?${query}` : '/admin/agents';
}

async function loadAgents() {
  try {
    noStore();

    const supabase = await createServerSupabaseClient();

    const [{ data, error }, { data: membershipsData, error: membershipsError }] =
      await Promise.all([
        supabase
          .from('agents')
          .select(
            'admin_override_active, admin_override_membership_active, admin_override_profile_complete, admin_override_training_complete, admin_updated_at, agent_status, created_at, id, full_name, email, role, certification_status, is_active, profile_completed'
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
      console.error('[admin/agents] Unable to load agents.', { error });

      return {
        agents: [] as AdminAgent[],
        errorMessage: error.message || 'Unable to load agents.',
      };
    }

    if (membershipsError) {
      console.error('[admin/agents] Unable to load memberships.', {
        membershipsError,
      });

      return {
        agents: [] as AdminAgent[],
        errorMessage:
          membershipsError.message || 'Unable to load membership statuses.',
      };
    }

    const membershipRows = (membershipsData ?? []) as MembershipRow[];
    const membershipsByAgentId = membershipRows.reduce<Record<string, Membership[]>>(
      (collection, membership) => {
        collection[membership.agent_id] = [
          ...(collection[membership.agent_id] ?? []),
          membership,
        ];

        return collection;
      },
      {}
    );

    const agents = ((data ?? []) as Omit<AdminAgent, 'payment_status'>[]).map(
      (agent) => ({
        ...agent,
        payment_status:
          selectPreferredMembership(membershipsByAgentId[agent.id] ?? [])?.status ??
          'pending',
      })
    );

    agents.forEach((agent) => {
      const computedStatus = computeAgentStatus(agent);

      console.log('Computed status:', {
        name: agent.full_name,
        finalActive: computedStatus.finalActive,
      });
    });

    return {
      agents,
      errorMessage: null,
    };
  } catch (error) {
    console.error('[admin/agents] Unexpected load failure.', { error });

    return {
      agents: [] as AdminAgent[],
      errorMessage:
        error instanceof Error ? error.message : 'Unable to load agents.',
    };
  }
}

export default async function AdminAgentsPage({
  searchParams,
}: AdminAgentsPageProps) {
  noStore();

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const filter = resolveFilter(resolvedSearchParams?.filter);
  const search = resolvedSearchParams?.search?.trim() ?? '';
  const normalizedSearch = search.toLowerCase();
  const { agents, errorMessage } = await loadAgents();
  const filteredBySearch = normalizedSearch
    ? agents.filter((agent) => {
        const fullName = agent.full_name?.toLowerCase() ?? '';
        const email = agent.email?.toLowerCase() ?? '';

        return (
          fullName.includes(normalizedSearch) || email.includes(normalizedSearch)
        );
      })
    : agents;
  const filteredAgents =
    filter === 'all'
      ? filteredBySearch
      : filteredBySearch.filter((agent) =>
          filter === 'active'
            ? computeAgentStatus(agent).finalActive
            : !computeAgentStatus(agent).finalActive
        );

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Agents</h2>
        <p className="mt-1 text-sm text-slate-400">
          Manage certification progress, directory access, and admin overrides for
          agents.
        </p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <form action="/admin/agents" className="flex w-full max-w-xl gap-3">
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Search agents..."
            className="w-full max-w-md rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white transition-all duration-200 placeholder:text-slate-500 focus:border-white/20 focus:outline-none"
          />
          {filter !== 'all' && <input type="hidden" name="filter" value={filter} />}
          <button
            type="submit"
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-white/10"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap gap-3">
          {(['all', 'active', 'inactive'] as AdminAgentFilterStatus[]).map(
            (value) => {
              const isSelected = filter === value;

              return (
                <Link
                  key={value}
                  href={buildAgentsHref({ filter: value, search })}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    isSelected
                      ? 'bg-[var(--gold-main)] text-black shadow-[0_10px_30px_rgba(212,175,55,.25)]'
                      : 'border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {value === 'all'
                    ? 'All'
                    : value === 'active'
                      ? 'Active'
                      : 'Inactive'}
                </Link>
              );
            }
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {errorMessage}
        </div>
      )}

      <div className="space-y-4">
          {filteredAgents.map((agent) => (
            <section
              key={agent.id}
              className="rounded-lg bg-[#0B1220] p-4 transition-all duration-200 hover:bg-white/10"
            >
              <div className="mb-3 rounded-md border-b border-white/10 bg-white/10 px-3 py-2">
                <h3 className="text-base font-semibold text-white">
                  {agent.full_name || 'Unnamed agent'}
                </h3>
                <p className="text-sm text-slate-400">{agent.email || '—'}</p>
              </div>

              <AgentRowActions agent={agent} />
            </section>
          ))}

          {!errorMessage && filteredAgents.length === 0 && (
            <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-8 text-center text-sm text-slate-400">
              No agents found.
            </div>
          )}
      </div>
    </section>
  );
}
