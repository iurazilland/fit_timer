"use client";

import { useEffect, useRef, useCallback } from 'react';

export const useAudio = () => {
  const audioCtx = useRef<AudioContext | null>(null);
  const workAudio = useRef<HTMLAudioElement | null>(null);
  const restAudio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize AudioContext for beeps
    audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Initialize Music Elements
    workAudio.current = new Audio('/audio/Iron_Pulse.mp3');
    workAudio.current.loop = true;
    workAudio.current.volume = 0;

    restAudio.current = new Audio('/audio/Gravity_Break.mp3');
    restAudio.current.loop = true;
    restAudio.current.volume = 0;

    return () => {
      audioCtx.current?.close();
      workAudio.current?.pause();
      restAudio.current?.pause();
    };
  }, []);

  const fadeAudio = (audio: HTMLAudioElement | null, targetVolume: number, duration: number = 1000) => {
    if (!audio) return;
    
    const startVolume = audio.volume;
    const startTime = performance.now();

    if (targetVolume > 0 && audio.paused) {
        audio.play().catch(e => console.error("Audio play blocked:", e));
    }

    const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        audio.volume = Math.max(0, Math.min(1, startVolume + (targetVolume - startVolume) * progress));

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else if (targetVolume === 0) {
            audio.pause();
        }
    };

    requestAnimationFrame(animate);
  };

  const playBeep = (frequency: number, duration: number) => {
    if (!audioCtx.current || audioCtx.current.state === 'suspended') {
        audioCtx.current?.resume();
    }
    if (!audioCtx.current) return;

    const osc = audioCtx.current.createOscillator();
    const gain = audioCtx.current.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, audioCtx.current.currentTime);
    
    gain.gain.setValueAtTime(0.2, audioCtx.current.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.current.currentTime + duration);

    osc.connect(gain);
    gain.connect(audioCtx.current.destination);

    osc.start();
    osc.stop(audioCtx.current.currentTime + duration);
  };

  const isMuted = useRef(false);

  const setBGM = useCallback((status: 'working' | 'resting' | 'preparing' | 'finished' | 'idle' | 'paused', muteOverride?: boolean) => {
    if (muteOverride !== undefined) {
        isMuted.current = muteOverride;
    }

    if (isMuted.current || status === 'finished' || status === 'idle' || status === 'paused') {
        fadeAudio(workAudio.current, 0);
        fadeAudio(restAudio.current, 0);
        return;
    }

    switch (status) {
      case 'working':
        if (workAudio.current) workAudio.current.currentTime = 0;
        fadeAudio(workAudio.current, 0.08);
        fadeAudio(restAudio.current, 0);
        break;
      case 'resting':
      case 'preparing':
        if (restAudio.current) restAudio.current.currentTime = 0;
        fadeAudio(workAudio.current, 0);
        fadeAudio(restAudio.current, 0.05);
        break;
    }
  }, []);

  const notify = useCallback((type: 'prepare' | 'start' | 'stop') => {
    switch (type) {
      case 'prepare':
        playBeep(440, 0.1);
        break;
      case 'start':
        playBeep(880, 0.3);
        break;
      case 'stop':
        playBeep(220, 0.3);
        break;
    }
  }, []);

  return { notify, setBGM };
};
