// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/trpc", () => ({
  trpc: { travel: { deleteTrip: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) } } },
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { DeleteTripDialog } from "../client/src/components/DeleteTripDialog";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("DeleteTripDialog", () => {
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
});
