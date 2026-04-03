import 'server-only';

import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { createServerSupabaseClient } from '@/lib/supabase-server';

type ApiError = {
  code: string;
  message: string;
};

export type AdminSupabaseClient = ReturnType<typeof createSupabaseAdminClient>;

export function apiError(code: string, message: string, status: number) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
      } satisfies ApiError,
    },
    { status }
  );
}

export async function requireAdmin() {
  try {
    const supabaseServer = await createServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabaseServer.auth.getUser();

    if (userError || !user) {
      return {
        ok: false as const,
        response: apiError('unauthorized', 'Authentication required.', 401),
      };
    }

    const { data: agent, error: agentError } = await supabaseServer
      .from('agents')
      .select('role')
      .or(`user_id.eq.${user.id},id.eq.${user.id}`)
      .maybeSingle();

    if (agentError) {
      return {
        ok: false as const,
        response: apiError(
          'admin_lookup_failed',
          agentError.message || 'Unable to verify admin access.',
          500
        ),
      };
    }

    if (agent?.role !== 'admin') {
      return {
        ok: false as const,
        response: apiError('forbidden', 'Admin access required.', 403),
      };
    }

    return {
      ok: true as const,
      userId: user.id,
    };
  } catch (error) {
    return {
      ok: false as const,
      response: apiError(
        'auth_check_failed',
        error instanceof Error
          ? error.message
          : 'Unable to verify admin access.',
        500
      ),
    };
  }
}

export async function getUserByEmail(
  supabaseAdmin: AdminSupabaseClient,
  email: string
) {
  // The installed Supabase JS admin client does not expose getUserByEmail,
  // so we resolve it securely on the server via paginated admin user lookup.
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw new Error(error.message || 'Unable to check for existing users.');
    }

    const existingUser = data.users.find(
      (user) => user.email?.toLowerCase() === email
    );

    if (existingUser) {
      return existingUser;
    }

    if (data.users.length < perPage) {
      return null;
    }

    page += 1;
  }
}
