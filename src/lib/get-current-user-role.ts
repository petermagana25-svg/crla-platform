import 'server-only';

import { getCurrentUserAccessState } from '@/lib/get-current-user-access-state';

export async function getCurrentUserRole() {
  const accessState = await getCurrentUserAccessState();
  return accessState.role;
}
