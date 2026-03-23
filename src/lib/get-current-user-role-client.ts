export async function getCurrentUserRoleClient() {
  try {
    const response = await fetch('/api/auth/role', {
      method: 'GET',
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const result = (await response.json()) as { role?: string | null };
    return result.role ?? null;
  } catch {
    return null;
  }
}
