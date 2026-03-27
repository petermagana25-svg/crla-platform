import 'server-only';

import { createServerSupabaseClient } from '@/lib/supabase-server';

export type UserRole = 'admin' | 'agent' | null;

export type CurrentUserAccessState = {
  isAuthenticated: boolean;
  userId: string | null;
  role: UserRole;
  profileCompleted: boolean;
};

export function resolvePostAuthRedirect(
  accessState: CurrentUserAccessState
) {
  if (!accessState.isAuthenticated) {
    return '/login';
  }

  if (accessState.role === 'admin') {
    return '/admin';
  }

  if (accessState.role === 'agent' && !accessState.profileCompleted) {
    return '/onboarding/profile';
  }

  return '/dashboard';
}

export async function getCurrentUserAccessState(): Promise<CurrentUserAccessState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      isAuthenticated: false,
      userId: null,
      role: null,
      profileCompleted: false,
    };
  }

  const { data: agent } = await supabase
    .from('agents')
    .select('role, profile_completed')
    .eq('id', user.id)
    .maybeSingle();

  const role = (agent?.role as UserRole | undefined) ?? null;

  return {
    isAuthenticated: true,
    userId: user.id,
    role,
    profileCompleted: role === 'admin' ? true : Boolean(agent?.profile_completed),
  };
}
