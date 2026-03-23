import { createServerSupabaseClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.log('ROLE API:', { userId: null, role: null });
    return Response.json({ role: null });
  }

  const { data } = await supabase
    .from('agents')
    .select('role')
    .eq('id', user.id);

  const role = data?.[0]?.role ?? null;

  console.log('ROLE API:', { userId: user?.id, role });

  return Response.json({ role });
}
