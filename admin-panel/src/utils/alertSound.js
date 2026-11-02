let audioContext = null;

function getAudioContext() {
  if (audioContext) return audioContext;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  audioContext = new Ctx();
  return audioContext;
}

// Browsers block audio until a user gesture; call this from the first click or key press.
export function unlockAlertAudio() {
  const ctx = getAudioContext();
  if (ctx?.state === 'suspended') ctx.resume().catch(() => {});
}

// Each alert type has its own tone pattern so staff can tell them apart by ear.
const CHIME_PATTERNS = {
  order: [
    { freq: 880, duration: 0.18 },
    { freq: 1175, duration: 0.25 },
  ],
  kitchen: [
    { freq: 660, duration: 0.2 },
    { freq: 660, duration: 0.2 },
    { freq: 990, duration: 0.35 },
  ],
  waiter: [
    { freq: 1046, duration: 0.15 },
    { freq: 784, duration: 0.15 },
    { freq: 1046, duration: 0.15 },
    { freq: 784, duration: 0.35 },
  ],
};

export function playAlertChime(kind = 'order') {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});

  const notes = CHIME_PATTERNS[kind] || CHIME_PATTERNS.order;
  let start = ctx.currentTime;
  notes.forEach(({ freq, duration }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.3, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
    start += duration + 0.05;
  });
}
