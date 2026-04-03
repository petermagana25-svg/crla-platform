import { getViewMode } from '@/lib/view-mode';

export async function getPostAuthRedirectPathClient() {
  try {
    if (typeof window !== 'undefined' && window.location.pathname === '/set-password') {
      return '/set-password';
    }

    const response = await fetch('/api/auth/access-state', {
      method: 'GET',
      cache: 'no-store',
    });

    if (!response.ok) {
      return '/dashboard';
    }

    const result = (await response.json()) as {
      isAuthenticated?: boolean;
      profileCompleted?: boolean;
      role?: string | null;
    };

    if (!result.isAuthenticated) {
      return '/login';
    }

    const mode = getViewMode();

    if (result.role === 'admin') {
      return mode === 'agent' ? '/dashboard' : '/admin';
    }

    if (result.role === 'agent' && !result.profileCompleted) {
      return '/onboarding';
    }

    return '/dashboard';
  } catch {
    return '/dashboard';
  }
}
