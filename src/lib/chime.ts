"use client";

// A soft two-note chime made with Web Audio, so there's no sound file to load.
export function playChime(kind: "focus" | "break") {
  try {
    const ctx = new AudioContext();
    const notes = kind === "break" ? [659.25, 880] : [880, 659.25];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime + i * 0.22;
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.18, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.9);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 1);
    });
    setTimeout(() => ctx.close(), 1600);
  } catch {
    // Audio blocked or unsupported: the visual change is enough.
  }
}
