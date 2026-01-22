import { useCallback, useRef, useState } from 'react';

type SoundType = 'warning' | 'timeUp';

export function useTimerSound() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playBeep = useCallback((frequency: number, duration: number, volume: number = 0.3) => {
    try {
      const audioContext = getAudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      console.warn('Could not play sound:', error);
    }
  }, [getAudioContext]);

  const playSound = useCallback((type: SoundType) => {
    if (isMuted) return;
    
    switch (type) {
      case 'warning':
        // Two gentle beeps for 5-minute warning
        playBeep(880, 0.15, 0.25); // A5
        setTimeout(() => playBeep(880, 0.15, 0.25), 200);
        break;
      case 'timeUp':
        // Three urgent beeps for time up
        playBeep(1047, 0.2, 0.4); // C6
        setTimeout(() => playBeep(1047, 0.2, 0.4), 250);
        setTimeout(() => playBeep(1319, 0.3, 0.4), 500); // E6
        break;
    }
  }, [isMuted, playBeep]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  return { playSound, isMuted, toggleMute };
}
