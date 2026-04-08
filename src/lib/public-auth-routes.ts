export const PUBLIC_AUTH_ROUTES = ['/set-password', '/auth/callback'] as const;

export function isPublicAuthRoute(pathname: string | null | undefined) {
  if (!pathname) {
    return false;
  }

  return PUBLIC_AUTH_ROUTES.includes(
    pathname as (typeof PUBLIC_AUTH_ROUTES)[number]
  );
}

export function isPasswordSetupMode(mode: string | null | undefined) {
  return mode === 'recovery' || mode === 'invite';
}
