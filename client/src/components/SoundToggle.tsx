import { useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { isSelectionSoundEnabled, setSelectionSoundEnabled } from "@/lib/interactionSounds";

export function SoundToggle() {
  const [enabled, setEnabled] = useState(isSelectionSoundEnabled);
  const toggle = () => {
    const nextValue = !enabled;
    setSelectionSoundEnabled(nextValue);
    setEnabled(nextValue);
  };

  return <button type="button" className="sound-toggle" data-sound-control onClick={toggle} aria-pressed={enabled} aria-label={enabled ? "Turn selection sounds off" : "Turn selection sounds on"} title={enabled ? "Selection sounds on" : "Selection sounds off"}>
    {enabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
  </button>;
}
