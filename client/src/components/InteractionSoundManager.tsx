import { useEffect } from "react";
import { playSelectionSound } from "@/lib/interactionSounds";

const selectable = "button:not([data-sound-control]), a, [role='button'], [role='option'], select, input[type='checkbox'], input[type='radio']";

function closestSelectable(target: EventTarget | null) {
  return target instanceof Element ? target.closest(selectable) : null;
}

export function InteractionSoundManager() {
  useEffect(() => {
    const playFromPointer = (event: PointerEvent) => {
      const item = closestSelectable(event.target);
      if (item && !(item as HTMLButtonElement).disabled) playSelectionSound();
    };
    const playFromKeyboard = (event: KeyboardEvent) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const item = closestSelectable(event.target);
      if (item && !(item as HTMLButtonElement).disabled) playSelectionSound();
    };
    document.addEventListener("pointerdown", playFromPointer, true);
    document.addEventListener("keydown", playFromKeyboard, true);
    return () => {
      document.removeEventListener("pointerdown", playFromPointer, true);
      document.removeEventListener("keydown", playFromKeyboard, true);
    };
  }, []);
  return null;
}
