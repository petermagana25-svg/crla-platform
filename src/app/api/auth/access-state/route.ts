import {
  getCurrentUserAccessState,
  resolvePostAuthRedirect,
} from '@/lib/get-current-user-access-state';

export const runtime = 'nodejs';

export async function GET() {
  const accessState = await getCurrentUserAccessState();

  return Response.json({
    isAuthenticated: accessState.isAuthenticated,
    userId: accessState.userId,
    role: accessState.role,
    profileCompleted: accessState.profileCompleted,
    redirectTo: resolvePostAuthRedirect(accessState),
  });
}
