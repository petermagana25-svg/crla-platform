import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type GetStableBrowserUserOptions = {
  attempts?: number;
  delayMs?: number;
};

function sleep(delayMs: number) {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

export async function getStableBrowserUser(
  options: GetStableBrowserUserOptions = {}
): Promise<User | null> {
  const attempts = options.attempts ?? 5;
  const delayMs = options.delayMs ?? 100;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const [
      {
        data: { user },
      },
      {
        data: { session },
      },
    ] = await Promise.all([
      supabase.auth.getUser(),
      supabase.auth.getSession(),
    ]);

    if (user) {
      return user;
    }

    if (session?.user) {
      return session.user;
    }

    if (attempt < attempts - 1) {
      await sleep(delayMs);
    }
  }

  return null;
}
