import {
  isPasswordSetupMode,
  isPublicAuthRoute,
} from '@/lib/public-auth-routes';
import { getViewMode } from '@/lib/view-mode';

type GetPostAuthRedirectPathClientOptions = {
  preserveSetPasswordPath?: boolean;
};

export async function getPostAuthRedirectPathClient(
  options: GetPostAuthRedirectPathClientOptions = {}
) {
  try {
    if (typeof window !== 'undefined') {
      const currentUrl = new URL(window.location.href);
      const pathname = currentUrl.pathname;
      const mode = currentUrl.searchParams.get('mode');

      if (
        isPublicAuthRoute(pathname) &&
        (options.preserveSetPasswordPath ||
          pathname === '/auth/callback' ||
          isPasswordSetupMode(mode))
      ) {
        return pathname === '/set-password' && isPasswordSetupMode(mode)
          ? `/set-password?mode=${mode}`
          : pathname;
      }
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
