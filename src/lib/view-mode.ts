export type ViewMode = 'admin' | 'agent';

export function getViewMode(): ViewMode {
  if (typeof window === 'undefined') {
    return 'admin';
  }

  const storedMode = window.localStorage.getItem('view_mode');
  return storedMode === 'agent' ? 'agent' : 'admin';
}

export function setViewMode(mode: ViewMode) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem('view_mode', mode);
}
