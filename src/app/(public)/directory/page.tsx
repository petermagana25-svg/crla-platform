import { unstable_noStore as noStore } from 'next/cache';
import DirectoryClient, {
  DirectoryAgentCardData,
} from '@/components/public/DirectoryClient';
import { computeAgentStatus } from '@/lib/agent-status';
import { selectPreferredMembership } from '@/lib/membership';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

type AgentRow = {
  admin_override_active: boolean | null;
  admin_override_membership_active: boolean | null;
  admin_override_profile_complete: boolean | null;
  admin_override_training_complete: boolean | null;
  certification_status: 'not_started' | 'in_progress' | 'completed' | 'certified' | null;
  city: string | null;
  created_at: string | null;
  full_name: string | null;
  id: string;
  is_active: boolean | null;
  license_number: string | null;
  profile_completed: boolean | null;
  state: string | null;
};

type ProfileRow = {
  avatar_url: string | null;
  bio: string | null;
  id: string;
};

type ListingCountRow = {
  agent_id: string;
};

type MembershipRow = {
  agent_id: string;
  created_at: string | null;
  expires_at: string | null;
  id: string;
  starts_at: string | null;
  status: 'active' | 'expired' | 'pending' | 'cancelled' | null;
};

const minimumDirectoryAgents = 6;

const placeholderAgents = [
  {
    avatar_url:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e',
    city: 'Los Angeles',
    full_name: 'Michael Carter',
    state: 'CA',
  },
  {
    avatar_url:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2',
    city: 'San Diego',
    full_name: 'Sophia Martinez',
    state: 'CA',
  },
  {
    avatar_url:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d',
    city: 'San Francisco',
    full_name: 'Daniel Kim',
    state: 'CA',
  },
  {
    avatar_url:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1',
    city: 'Sacramento',
    full_name: 'Emily Johnson',
    state: 'CA',
  },
  {
    avatar_url:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
    city: 'Irvine',
    full_name: 'James Anderson',
    state: 'CA',
  },
  {
    avatar_url:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
    city: 'San Jose',
    full_name: 'Olivia Chen',
    state: 'CA',
  },
] as const;

async function loadDirectoryAgents(): Promise<DirectoryAgentCardData[]> {
  noStore();

  const supabase = await createServerSupabaseClient();
  const { data: realAgentData, error: realAgentError } = await supabase
    .from('agents')
    .select(
      'id, full_name, city, state, created_at, license_number, is_active, profile_completed, certification_status, admin_override_active, admin_override_profile_complete, admin_override_training_complete, admin_override_membership_active'
    )
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  const realAgents = (realAgentData ?? []) as AgentRow[];
  const sortedRealAgents = [...realAgents].sort((a, b) => {
    const aCreatedAt = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bCreatedAt = b.created_at ? new Date(b.created_at).getTime() : 0;

    return bCreatedAt - aCreatedAt;
  });

  const agentIds = sortedRealAgents.map((agent) => agent.id);
  const { data: membershipsData } = agentIds.length
    ? await supabase
        .from('memberships')
        .select('agent_id, created_at, expires_at, id, starts_at, status')
        .in('agent_id', agentIds)
        .order('created_at', { ascending: false })
    : { data: [] as MembershipRow[] };
  const { data: listingCountsData } = agentIds.length
    ? await supabase.from('listings').select('agent_id').in('agent_id', agentIds)
    : { data: [] as ListingCountRow[] };

  const { data: profileData } = agentIds.length
    ? await supabase
        .from('profiles')
        .select('id, bio, avatar_url')
        .in('id', agentIds)
    : { data: [] as ProfileRow[] };

  const profilesById = ((profileData ?? []) as ProfileRow[]).reduce<
    Record<string, ProfileRow>
  >((collection, profile) => {
    collection[profile.id] = profile;
    return collection;
  }, {});
  const membershipsByAgentId = ((membershipsData ?? []) as MembershipRow[]).reduce<
    Record<string, MembershipRow[]>
  >((collection, membership) => {
    collection[membership.agent_id] = [
      ...(collection[membership.agent_id] ?? []),
      membership,
    ];
    return collection;
  }, {});
  const listingCountsByAgent = ((listingCountsData ?? []) as ListingCountRow[]).reduce<
    Record<string, number>
  >((collection, listing) => {
    collection[listing.agent_id] = (collection[listing.agent_id] ?? 0) + 1;
    return collection;
    }, {});

  if (process.env.NODE_ENV === 'development') {
    const mismatch = sortedRealAgents.filter((agent) => {
      const preferredMembership = selectPreferredMembership(
        (membershipsByAgentId[agent.id] ?? []).map((membership) => ({
          amount: null,
          created_at: membership.created_at,
          currency: null,
          expires_at: membership.expires_at,
          id: membership.id,
          plan_name: null,
          renewal_period: null,
          starts_at: membership.starts_at,
          status: membership.status,
        }))
      );

      return (
        agent.is_active !==
        computeAgentStatus({
          ...agent,
          membership_status: preferredMembership?.status ?? 'pending',
        }).finalActive
      );
    });

    if (mismatch.length) {
      console.warn('STATUS MISMATCH', mismatch);
    }
  }

  const mappedRealAgents: DirectoryAgentCardData[] = sortedRealAgents.map((agent) => {
    const profile = profilesById[agent.id];
    const state = agent.state?.trim() || 'State not set';
    const city = agent.city?.trim() || 'Location not set';

    return {
      bio: profile?.bio,
      city,
      id: agent.id,
      image: profile?.avatar_url || '/images/agent-1.jpg',
      isPlaceholder: false,
      licenseNumber: agent.license_number,
      listingCount: listingCountsByAgent[agent.id] ?? 0,
      location: agent.city ? `${city}, ${state}` : state,
      name: agent.full_name || 'Certified Agent',
      rating: null,
      region: state,
      specialty: profile?.bio ?? null,
    };
  });

  const placeholderCount = Math.max(
    minimumDirectoryAgents - mappedRealAgents.length,
    0
  );

  const mappedPlaceholderAgents: DirectoryAgentCardData[] = placeholderAgents
    .slice(0, placeholderCount)
    .map((agent, index) => ({
      bio: 'Certified renovation listing specialist joining the CRLA directory soon.',
      city: agent.city,
      id: `placeholder-${index + 1}`,
      image: agent.avatar_url,
      isPlaceholder: true,
      licenseNumber: null,
      listingCount: 0,
      location: `${agent.city}, ${agent.state}`,
      name: agent.full_name,
      rating: null,
      region: agent.state,
      specialty: 'Coming soon to the CRLA network',
    }));

  if (realAgentError) {
    console.error('[directory] Unable to load visible agents.', {
      error: realAgentError,
    });
    console.log('Visible agents:', mappedPlaceholderAgents.length);
    return mappedPlaceholderAgents;
  }

  const visibleAgents = [...mappedRealAgents, ...mappedPlaceholderAgents];

  console.log('Visible agents:', visibleAgents.length);

  return visibleAgents;
}

export default async function DirectoryPage() {
  const agents = await loadDirectoryAgents();

  return <DirectoryClient initialAgents={agents} />;
}
