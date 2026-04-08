import { createSupabaseAdminClient } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as {
      email?: string;
    } | null;
    const email = body?.email?.trim();

    if (!email) {
      return Response.json(
        {
          error: 'Email is required.',
        },
        {
          status: 400,
        }
      );
    }

    const redirectBaseUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');

    if (!redirectBaseUrl) {
      return Response.json(
        {
          error: 'Password reset is temporarily unavailable.',
        },
        {
          status: 500,
        }
      );
    }

    const supabaseAdmin = createSupabaseAdminClient();
    const redirectTo = `${redirectBaseUrl}/auth/callback?mode=recovery`;
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      return Response.json(
        {
          error: error.message || 'Could not send reset link.',
        },
        {
          status: 500,
        }
      );
    }

    return Response.json({
      success: true,
    });
  } catch {
    return Response.json(
      {
        error: 'Could not send reset link.',
      },
      {
        status: 500,
      }
    );
  }
}
