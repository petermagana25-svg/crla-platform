import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { apiError, getUserByEmail } from '../_utils';

export const runtime = 'nodejs';

type SetPasswordBody = {
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return apiError(
      'forbidden',
      'This testing route is only available in development.',
      403
    );
  }

  let body: SetPasswordBody;

  try {
    body = (await request.json()) as SetPasswordBody;
  } catch {
    return apiError('invalid_body', 'Invalid JSON body.', 400);
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password?.trim();

  if (!email || !password) {
    return apiError('missing_fields', 'Email and password are required.', 400);
  }

  try {
    const supabaseAdmin = createSupabaseAdminClient();
    const user = await getUserByEmail(supabaseAdmin, email);

    if (!user) {
      return apiError('user_not_found', 'User not found.', 404);
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password,
    });

    if (error) {
      return apiError(
        'password_update_failed',
        error.message || 'Unable to update password.',
        500
      );
    }

    return Response.json({
      success: true,
      userId: user.id,
    });
  } catch (error) {
    return apiError(
      'password_update_failed',
      error instanceof Error
        ? error.message
        : 'Unable to update password.',
      500
    );
  }
}
