type AuthModalListener = (open: boolean) => void;
const listeners = new Set<AuthModalListener>();

export function openAuthModal() {
  listeners.forEach(fn => fn(true));
}

export function closeAuthModal() {
  listeners.forEach(fn => fn(false));
}

export function subscribeAuthModal(listener: AuthModalListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
