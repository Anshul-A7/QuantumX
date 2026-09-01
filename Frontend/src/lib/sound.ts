/**
 * QuantumX Bespoke Medical Audio Engine
 * Uses Web Audio API to synthesize a multi-harmonic quantum completion acoustic chord.
 */

export function playQuantumCompletionSound(force: boolean = false): void {
  if (typeof window === "undefined") return;

  // Check if user has audio feedback enabled (default: true)
  if (!force) {
    const audioSetting = localStorage.getItem("quantumx_setting_audio");
    if (audioSetting === "false") return;
  }

  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Master Volume Limiter
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.09, now);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
    masterGain.connect(ctx.destination);

    // Layer 1: Fundamental Melodic Arpeggio (C5 -> E5 -> C6)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(523.25, now); // C5
    osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.08); // E5
    osc1.frequency.exponentialRampToValueAtTime(1046.5, now + 0.22); // C6

    gain1.gain.setValueAtTime(0.7, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
    osc1.connect(gain1);
    gain1.connect(masterGain);

    // Layer 2: Harmonic Fifth Resonance (G5 783.99Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(783.99, now + 0.06); // G5
    osc2.frequency.exponentialRampToValueAtTime(1318.51, now + 0.25); // E6

    gain2.gain.setValueAtTime(0.0001, now);
    gain2.gain.setValueAtTime(0.45, now + 0.06);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.52);
    osc2.connect(gain2);
    gain2.connect(masterGain);

    // Layer 3: Warm Quantum Sub-Pulse (C4 261.63Hz)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = "triangle";
    osc3.frequency.setValueAtTime(261.63, now); // C4
    gain3.gain.setValueAtTime(0.35, now);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
    osc3.connect(gain3);
    gain3.connect(masterGain);

    // Trigger Synthesis
    osc1.start(now);
    osc2.start(now + 0.06);
    osc3.start(now);

    osc1.stop(now + 0.50);
    osc2.stop(now + 0.54);
    osc3.stop(now + 0.40);
  } catch {
    // Graceful fallback for browser autoplay policies
  }
}

export function playSound(type: "quantum" | "click" | "success" | "error" = "quantum", force: boolean = false): void {
  if (type === "quantum" || type === "success") {
    playQuantumCompletionSound(force);
  } else if (type === "click" || type === "error") {
    if (typeof window === "undefined") return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(type === "click" ? 880 : 330, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    } catch {}
  }
}

