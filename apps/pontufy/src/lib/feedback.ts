'use client';

// Feedback sensorial MD3 (TAREFA 5): som sutil via Web Audio API + vibração
// háptica. Preferência "som" persistida em localStorage ('pontufy-sound')
// controla ambos. Sem top-level window access — tudo lazy dentro das funções.

export type FeedbackType = 'success' | 'points' | 'quiz-correct' | 'quiz-wrong';

const SOUND_KEY = 'pontufy-sound-enabled';

export function isSoundEnabled(): boolean {
  try {
    return localStorage.getItem(SOUND_KEY) !== '0';
  } catch {
    return true;
  }
}

export function setSoundEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(SOUND_KEY, enabled ? '1' : '0');
  } catch {
    // storage indisponível (SSR/privacy) — silencioso
  }
}

// Beeps curtos sintetizados (sem assets externos). Frequências da escala
// pentatônica para não soar "alarme".
export function playFeedbackSound(type: FeedbackType): void {
  if (!isSoundEnabled() || typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes: Record<FeedbackType, [number, number, number?]> = {
      success: [523.25, 0.12, 659.25], // C5 → E5
      points: [659.25, 0.1, 783.99], // E5 → G5
      'quiz-correct': [783.99, 0.09, 1046.5], // G5 → C6
      'quiz-wrong': [196, 0.18], // G3 grave
    };
    const [f0, dur, f1] = notes[type];
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = f0;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur + 0.05);
    if (f1) {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.value = f1;
      gain2.gain.setValueAtTime(0.0001, ctx.currentTime + dur * 0.7);
      gain2.gain.exponentialRampToValueAtTime(0.1, ctx.currentTime + dur * 0.7 + 0.02);
      gain2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur + 0.15);
      osc2.connect(gain2).connect(ctx.destination);
      osc2.start(ctx.currentTime + dur * 0.7);
      osc2.stop(ctx.currentTime + dur + 0.2);
    }
  } catch {
    // áudio indisponível — não é fatal
  }
}

// Vibração háptica (mobile). Respeita a mesma preferência + preferências do SO.
export function haptic(pattern: number | number[] = 30): void {
  if (!isSoundEnabled() || typeof navigator === 'undefined' || !('vibrate' in navigator)) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // navegador sem suporte — ignorar
  }
}

// Helper combinado para momentos de conquista (conclusão de lição, resgate).
export function celebrateFeedback(): void {
  playFeedbackSound('success');
  haptic([40, 60, 40]);
}