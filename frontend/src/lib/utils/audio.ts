/**
 * AI Context: Utility for playing audio notifications in the browser without requiring 
 * external audio files. It uses the Web Audio API to synthesize a double-tone "ding".
 * 
 * @warning Browser policies usually require a user interaction (click/tap) before 
 * an AudioContext can be started. Ensure the component calling this has user engagement first.
 */
export const playAlertSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();

    const playTone = (frequency: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = frequency;

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.4, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    // Doble ding: C6 + E6
    playTone(1047, ctx.currentTime, 0.3);
    playTone(1319, ctx.currentTime + 0.15, 0.3);

    // Cerrar contexto después de que terminen los sonidos
    setTimeout(() => ctx.close(), 1000);
  } catch (error) {
    console.warn('No se pudo reproducir el sonido de alerta:', error);
  }
};
