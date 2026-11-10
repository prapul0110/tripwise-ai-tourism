// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockMutateAsync = vi.fn();
let mockIsPending = false;

vi.mock("@/lib/trpc", () => ({
  trpc: {
    travel: {
      deleteTrip: {
        useMutation: () => ({
          mutateAsync: mockMutateAsync,
          isPending: mockIsPending,
        }),
      },
    },
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { toast } from "sonner";
import { DeleteTripDialog } from "../client/src/components/DeleteTripDialog";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("DeleteTripDialog Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsPending = false;
  });

  it("renders a labelled confirmation, cancellation, and destructive confirmation controls when opened", async () => {
    const mount = document.createElement("div");
    document.body.appendChild(mount);
    const root = createRoot(mount);

    await act(async () => root.render(<DeleteTripDialog tripId={42} onDeleted={vi.fn()} initiallyOpen />));

    expect(document.body.textContent).toContain("Remove this journey?");
    expect(document.body.textContent).toContain("This action cannot be undone.");
    const cancel = Array.from(document.querySelectorAll("button")).find(button => button.textContent?.includes("Keep trip"));
    const confirm = Array.from(document.querySelectorAll("button")).find(button => button.textContent?.includes("Remove trip"));
    expect(cancel).toBeTruthy();
    expect(confirm).toBeTruthy();
    cancel?.focus();
    expect(document.activeElement).toBe(cancel);

    await act(async () => root.unmount());
    mount.remove();
  });

  it("handles successful deletion: calls mutateAsync, shows success toast, and triggers onDeleted", async () => {
    mockMutateAsync.mockResolvedValueOnce({ success: true });
    const onDeleted = vi.fn();

    const mount = document.createElement("div");
    document.body.appendChild(mount);
    const root = createRoot(mount);

    await act(async () => root.render(<DeleteTripDialog tripId={42} onDeleted={onDeleted} initiallyOpen />));

    const confirm = Array.from(document.querySelectorAll("button")).find(button => button.textContent?.includes("Remove trip"));
    expect(confirm).toBeTruthy();

    await act(async () => {
      confirm?.click();
    });

    expect(mockMutateAsync).toHaveBeenCalledWith({ id: 42 });
    expect(toast.success).toHaveBeenCalledWith("Trip removed from your dashboard.");
    expect(onDeleted).toHaveBeenCalled();

    await act(async () => root.unmount());
    mount.remove();
  });

  it("handles deletion error: shows error toast and does not call onDeleted", async () => {
    mockMutateAsync.mockRejectedValueOnce(new Error("Server failed to remove trip"));
    const onDeleted = vi.fn();

    const mount = document.createElement("div");
    document.body.appendChild(mount);
    const root = createRoot(mount);

    await act(async () => root.render(<DeleteTripDialog tripId={42} onDeleted={onDeleted} initiallyOpen />));

    const confirm = Array.from(document.querySelectorAll("button")).find(button => button.textContent?.includes("Remove trip"));
    expect(confirm).toBeTruthy();

    await act(async () => {
      confirm?.click();
    });

    expect(mockMutateAsync).toHaveBeenCalledWith({ id: 42 });
    expect(toast.error).toHaveBeenCalledWith("Server failed to remove trip");
    expect(onDeleted).not.toHaveBeenCalled();

    await act(async () => root.unmount());
    mount.remove();
  });

  it("shows loading state and disables actions when mutation is pending", async () => {
    mockIsPending = true;

    const mount = document.createElement("div");
    document.body.appendChild(mount);
    const root = createRoot(mount);

    await act(async () => root.render(<DeleteTripDialog tripId={42} onDeleted={vi.fn()} initiallyOpen />));

    const confirm = Array.from(document.querySelectorAll("button")).find(button => button.textContent?.includes("Removing…"));
    const cancel = Array.from(document.querySelectorAll("button")).find(button => button.textContent?.includes("Keep trip"));

    expect(confirm).toBeTruthy();
    expect((confirm as HTMLButtonElement)?.disabled).toBe(true);
    expect((cancel as HTMLButtonElement)?.disabled).toBe(true);

    await act(async () => root.unmount());
    mount.remove();
  });
});
