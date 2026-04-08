export type PasswordSetupVariant = 'invite' | 'recovery';

type PasswordSetupGrant = {
  createdAt: number;
  userId: string;
  variant: PasswordSetupVariant;
};

export type PasswordSetupGrantSnapshot = PasswordSetupGrant;

export type PasswordSetupLinkContext = {
  errorCode: string | null;
  errorDescription: string | null;
  hasAuthMarkers: boolean;
  hasModeHint: boolean;
  nextPath: string;
  variant: PasswordSetupVariant;
};

export const PASSWORD_SETUP_GRANT_TTL_MS = 15 * 60 * 1000;
export const PASSWORD_SETUP_PATH = '/set-password';
export const PASSWORD_SETUP_GRANT_STORAGE_KEY = 'crla-password-setup-grant';

export function buildPasswordSetupRedirectPath(variant: PasswordSetupVariant) {
  if (variant === 'recovery') {
    return '/auth/callback?mode=recovery';
  }

  const params = new URLSearchParams({
    mode: variant,
    next: PASSWORD_SETUP_PATH,
  });

  return `/auth/callback?${params.toString()}`;
}

export function buildPasswordSetupRedirectUrl(
  baseUrl: string,
  variant: PasswordSetupVariant
) {
  return `${baseUrl.replace(/\/$/, '')}${buildPasswordSetupRedirectPath(variant)}`;
}

export function readPasswordSetupLinkContext(
  fallbackVariant: PasswordSetupVariant,
  url: URL
): PasswordSetupLinkContext {
  const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
  const searchParams = url.searchParams;
  const mode = searchParams.get('mode');
  const type = searchParams.get('type') || hashParams.get('type');
  const variant =
    mode === 'invite' || mode === 'recovery'
      ? mode
      : type === 'recovery'
        ? 'recovery'
        : type === 'invite'
          ? 'invite'
          : fallbackVariant;

  return {
    errorCode:
      searchParams.get('error_code') || hashParams.get('error_code'),
    errorDescription:
      searchParams.get('error_description') ||
      hashParams.get('error_description'),
    hasAuthMarkers:
      searchParams.has('code') ||
      searchParams.has('token_hash') ||
      hashParams.has('access_token') ||
      hashParams.has('refresh_token') ||
      hashParams.has('type') ||
      searchParams.has('type'),
    hasModeHint: mode === 'invite' || mode === 'recovery',
    nextPath: sanitizePasswordSetupNextPath(searchParams.get('next')),
    variant,
  };
}

export function storePasswordSetupGrant(
  variant: PasswordSetupVariant,
  userId: string
) {
  if (typeof window === 'undefined') {
    return;
  }

  const grant: PasswordSetupGrant = {
    createdAt: Date.now(),
    userId,
    variant,
  };

  window.sessionStorage.setItem(
    PASSWORD_SETUP_GRANT_STORAGE_KEY,
    JSON.stringify(grant)
  );
}

export function clearPasswordSetupGrant() {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.removeItem(PASSWORD_SETUP_GRANT_STORAGE_KEY);
}

export function readPasswordSetupGrant(
  variant?: PasswordSetupVariant
): PasswordSetupGrantSnapshot | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawGrant = window.sessionStorage.getItem(PASSWORD_SETUP_GRANT_STORAGE_KEY);

  if (!rawGrant) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawGrant) as PasswordSetupGrant;
    const isFresh = Date.now() - parsed.createdAt <= PASSWORD_SETUP_GRANT_TTL_MS;

    if (!isFresh) {
      clearPasswordSetupGrant();
      return null;
    }

    if (variant && parsed.variant !== variant) {
      return null;
    }

    return parsed;
  } catch {
    clearPasswordSetupGrant();
    return null;
  }
}

export function hasValidPasswordSetupGrant(
  variant: PasswordSetupVariant,
  userId: string | null | undefined
) {
  if (!userId || typeof window === 'undefined') {
    return false;
  }

  const grant = readPasswordSetupGrant(variant);

  return Boolean(grant && grant.userId === userId);
}

function sanitizePasswordSetupNextPath(nextPath: string | null) {
  if (!nextPath || !nextPath.startsWith('/')) {
    return PASSWORD_SETUP_PATH;
  }

  return nextPath;
}
