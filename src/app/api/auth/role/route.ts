import { getCurrentUserAccessState } from '@/lib/get-current-user-access-state';

export const runtime = 'nodejs';

export async function GET() {
  const accessState = await getCurrentUserAccessState();

  if (!accessState.isAuthenticated) {
    console.log('ROLE API:', { userId: null, role: null });
    return Response.json({ role: null });
  }

  const role = accessState.role;

  console.log('ROLE API:', { userId: accessState.userId, role });

  return Response.json({ role });
}
