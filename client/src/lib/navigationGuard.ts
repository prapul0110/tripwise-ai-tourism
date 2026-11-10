/**
 * NAVIGATION GUARD & LOCATION INTERCEPTOR - TRIPWISE AI
 *
 * Provides a reliable client-side navigation blocker for Wouter:
 * 1. Intercepts all internal <Link> clicks (TripNav, back-links, brand links).
 * 2. Intercepts programmatic useLocation() navigation calls.
 * 3. Intercepts browser Back / Forward buttons (popstate).
 * 4. Leaves external links, new tabs, Ctrl+click, and middle-clicks untouched.
 * 5. Integrates seamlessly with Wouter's <Router hook={useGuardedLocation}>.
 */

import { useCallback, useEffect, useRef } from "react";
import { useBrowserLocation } from "wouter/use-browser-location";

export interface NavigationBlocker {
  message: string;
  shouldBlock: () => boolean;
}

let activeBlocker: NavigationBlocker | null = null;

export function setGlobalNavigationBlocker(blocker: NavigationBlocker | null) {
  activeBlocker = blocker;
}

export function getGlobalNavigationBlocker(): NavigationBlocker | null {
  return activeBlocker;
}

/**
 * Checks whether navigation to a new destination path is permitted.
 * If a blocker is registered and active, presents the confirmation dialog.
 */
export function checkNavigationAllowed(_to?: string): boolean {
  if (!activeBlocker || !activeBlocker.shouldBlock()) {
    return true;
  }

  const defaultMsg =
    "You have unsaved itinerary changes. Are you sure you want to leave this page?";
  const message = activeBlocker.message || defaultMsg;

  if (typeof window !== "undefined" && typeof window.confirm === "function") {
    return window.confirm(message);
  }

  return true;
}

/**
 * React hook for pages with unsaved changes.
 * Registers an active blocker whenever `active` is true.
 */
export function useNavigationBlocker(active: boolean, message?: string) {
  useEffect(() => {
    if (!active) {
      setGlobalNavigationBlocker(null);
      return;
    }

    setGlobalNavigationBlocker({
      message:
        message ||
        "You have unsaved itinerary changes. Are you sure you want to leave this page?",
      shouldBlock: () => active,
    });

    return () => {
      setGlobalNavigationBlocker(null);
    };
  }, [active, message]);
}

/**
 * Custom Wouter location hook providing guarded navigation.
 * Compatible with <Router hook={useGuardedLocation}> in App.tsx.
 */
export function useGuardedLocation(opts: any = {}) {
  const [pathname, baseNavigate] = useBrowserLocation(opts);
  const currentPathRef = useRef(pathname);
  currentPathRef.current = pathname;

  const guardedNavigate = useCallback(
    (to: string, navOpts?: any) => {
      if (!to || to === currentPathRef.current) return;

      if (!checkNavigationAllowed(to)) {
        return; // Navigation cancelled by user
      }

      baseNavigate(to, navOpts);
    },
    [baseNavigate]
  );

  // Guard browser back / forward buttons (popstate events)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePopState = () => {
      const targetPath = window.location.pathname;
      if (targetPath === currentPathRef.current) return;

      if (!checkNavigationAllowed(targetPath)) {
        // User cancelled: push current path back to history stack to stay on the page
        window.history.pushState(null, "", currentPathRef.current);
      } else {
        currentPathRef.current = targetPath;
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return [pathname, guardedNavigate] as [string, typeof baseNavigate];
}
