import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import AdminChrome from '@/components/admin/AdminChrome';
import {
  getCurrentUserAccessState,
  resolvePostAuthRedirect,
} from '@/lib/get-current-user-access-state';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const accessState = await getCurrentUserAccessState();

  if (!accessState.isAuthenticated) {
    redirect('/login');
  }

  if (accessState.role !== 'admin') {
    redirect(resolvePostAuthRedirect(accessState));
  }

  return <AdminChrome>{children}</AdminChrome>;
}
