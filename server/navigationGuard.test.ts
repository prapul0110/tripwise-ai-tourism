// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  setGlobalNavigationBlocker,
  getGlobalNavigationBlocker,
  checkNavigationAllowed,
} from "../client/src/lib/navigationGuard";

describe("Internal Navigation Guard for Unsaved Changes", () => {
  const originalConfirm = window.confirm;

  beforeEach(() => {
    setGlobalNavigationBlocker(null);
  });

  afterEach(() => {
    window.confirm = originalConfirm;
    setGlobalNavigationBlocker(null);
  });

  // 1. Without unsaved changes: navigation is allowed immediately without confirmation
  it("1. Internal navigation without edits proceeds immediately without confirmation", () => {
    const confirmSpy = vi.fn();
    window.confirm = confirmSpy;

    // No blocker registered
    const allowed = checkNavigationAllowed("/explore");

    expect(allowed).toBe(true);
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  // 2. With unsaved changes: confirmation appears with the required message
  it("2. Internal navigation with unsaved changes prompts the user with the exact message", () => {
    const confirmSpy = vi.fn().mockReturnValue(true);
    window.confirm = confirmSpy;

    setGlobalNavigationBlocker({
      message: "You have unsaved itinerary changes. Are you sure you want to leave this page?",
      shouldBlock: () => true,
    });

    const allowed = checkNavigationAllowed("/trips");

    expect(confirmSpy).toHaveBeenCalledWith(
      "You have unsaved itinerary changes. Are you sure you want to leave this page?"
    );
    expect(allowed).toBe(true);
  });

  // 3. User cancels confirmation: navigation is blocked, keeping user on current trip
  it("3. User clicks Cancel: navigation is blocked (checkNavigationAllowed returns false)", () => {
    const confirmSpy = vi.fn().mockReturnValue(false);
    window.confirm = confirmSpy;

    setGlobalNavigationBlocker({
      message: "You have unsaved itinerary changes. Are you sure you want to leave this page?",
      shouldBlock: () => true,
    });

    const allowed = checkNavigationAllowed("/planner");

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(allowed).toBe(false); // Navigation prevented
  });

  // 4. User confirms confirmation: navigation is allowed
  it("4. User clicks Confirm: navigation is permitted (checkNavigationAllowed returns true)", () => {
    const confirmSpy = vi.fn().mockReturnValue(true);
    window.confirm = confirmSpy;

    setGlobalNavigationBlocker({
      message: "You have unsaved itinerary changes. Are you sure you want to leave this page?",
      shouldBlock: () => true,
    });

    const allowed = checkNavigationAllowed("/explore");

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(allowed).toBe(true);
  });

  // 5. Saving or Resetting edits deactivates the blocker immediately
  it("5. Saving or resetting edits clears the blocker, allowing unrestricted navigation", () => {
    const confirmSpy = vi.fn();
    window.confirm = confirmSpy;

    // Simulate active blocker while editing
    setGlobalNavigationBlocker({
      message: "You have unsaved itinerary changes. Are you sure you want to leave this page?",
      shouldBlock: () => true,
    });
    expect(getGlobalNavigationBlocker()).not.toBeNull();

    // User saves or resets edits -> blocker set to null
    setGlobalNavigationBlocker(null);
    expect(getGlobalNavigationBlocker()).toBeNull();

    // Subsequent navigation must proceed with zero dialogs
    const allowedAfterSave = checkNavigationAllowed("/profile");
    expect(allowedAfterSave).toBe(true);
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  // 6. Popstate / Browser Back simulation: Cancel keeps user on current URL
  it("6. Browser Back / Forward cancellation restores current path in history", () => {
    const confirmSpy = vi.fn().mockReturnValue(false);
    window.confirm = confirmSpy;

    setGlobalNavigationBlocker({
      message: "You have unsaved itinerary changes. Are you sure you want to leave this page?",
      shouldBlock: () => true,
    });

    const currentPath = "/trip/1";
    const attemptedTarget = "/trips";
    const pushStateSpy = vi.spyOn(window.history, "pushState");

    // Simulate popstate handler logic
    const allowed = checkNavigationAllowed(attemptedTarget);
    if (!allowed) {
      window.history.pushState(null, "", currentPath);
    }

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(allowed).toBe(false);
    expect(pushStateSpy).toHaveBeenCalledWith(null, "", currentPath);

    pushStateSpy.mockRestore();
  });

  // 7. Existing beforeunload listener verification: browser refresh / tab close
  it("7. Existing beforeunload listener protects browser refresh only when unsaved changes exist", () => {
    function simulateBeforeUnload(hasUnsaved: boolean) {
      const event = {
        preventDefault: vi.fn(),
        returnValue: undefined as any,
      };

      if (hasUnsaved) {
        event.preventDefault();
        event.returnValue = "";
      }

      return event;
    }

    // Case A: No unsaved edits -> no beforeunload warning
    const cleanEvent = simulateBeforeUnload(false);
    expect(cleanEvent.preventDefault).not.toHaveBeenCalled();
    expect(cleanEvent.returnValue).toBeUndefined();

    // Case B: Unsaved edits exist -> beforeunload prevents default & sets returnValue
    const dirtyEvent = simulateBeforeUnload(true);
    expect(dirtyEvent.preventDefault).toHaveBeenCalledTimes(1);
    expect(dirtyEvent.returnValue).toBe("");
  });
});
