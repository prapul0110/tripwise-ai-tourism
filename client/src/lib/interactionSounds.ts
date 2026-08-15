const preferenceKey = "tripwise-selection-sound";

let audioContext: AudioContext | null = null;

function getContext() {
  if (typeof window === "undefined") return null;
  const AudioContextConstructor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextConstructor) return null;
  if (!audioContext) audioContext = new AudioContextConstructor();
  return audioContext;
}

export function isSelectionSoundEnabled() {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(preferenceKey) !== "off";
}

export function setSelectionSoundEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(preferenceKey, enabled ? "on" : "off");
}

export function playSelectionSound() {
  if (!isSelectionSoundEnabled()) return;
  const context = getContext();
  if (!context) return;
  if (context.state === "suspended") void context.resume();

  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(522.25, context.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(783.99, context.currentTime + 0.065);
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.045, context.currentTime + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.105);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.11);
}
