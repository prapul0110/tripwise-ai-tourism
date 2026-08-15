// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { isSelectionSoundEnabled, setSelectionSoundEnabled } from "../client/src/lib/interactionSounds";

describe("selection sound preference", () => {
  beforeEach(() => window.localStorage.clear());

  it("defaults to enabled and persists explicit opt-out and opt-in choices", () => {
    expect(isSelectionSoundEnabled()).toBe(true);
    setSelectionSoundEnabled(false);
    expect(isSelectionSoundEnabled()).toBe(false);
    setSelectionSoundEnabled(true);
    expect(isSelectionSoundEnabled()).toBe(true);
  });
});
