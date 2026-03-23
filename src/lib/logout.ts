import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { supabase } from '@/lib/supabase';

export async function logout(router: AppRouterInstance) {
  await supabase.auth.signOut();
  router.replace('/');
}
