import 'server-only';

import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function getCurrentUserRole() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data } = await supabase
    .from('agents')
    .select('role')
    .eq('id', user.id);

  return data?.[0]?.role ?? null;
}
