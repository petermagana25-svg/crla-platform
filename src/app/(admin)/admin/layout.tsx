import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import AdminChrome from '@/components/admin/AdminChrome';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: string | null = null;

  if (user) {
    const { data } = await supabase
      .from('agents')
      .select('role')
      .eq('id', user.id);

    role = data?.[0]?.role ?? null;
  }

  console.log('ADMIN CHECK:', { user, role });

  if (!user) redirect('/login');

  // TEMP: allow access even if role missing
  // if (role !== 'admin') redirect('/dashboard')

  return <AdminChrome>{children}</AdminChrome>;
}
