"use client";

import { useEffect, useRef, useCallback } from 'react';

export const useAudio = () => {
  const audioCtx = useRef<AudioContext | null>(null);
  const workAudio = useRef<HTMLAudioElement | null>(null);
  const restAudio = useRef<HTMLAudioElement | null>(null);
  const workGain = useRef<GainNode | null>(null);
  const restGain = useRef<GainNode | null>(null);
  const currentStatus = useRef<string>('idle');

  useEffect(() => {
    // Initialize AudioContext
    const Context = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx.current = new Context();
    
    // Initialize Music Elements
    const wAudio = new Audio('/audio/Iron_Pulse.mp3');
    wAudio.loop = true;
    wAudio.crossOrigin = "anonymous";
    workAudio.current = wAudio;

    const rAudio = new Audio('/audio/Gravity_Break.mp3');
    rAudio.loop = true;
    rAudio.crossOrigin = "anonymous";
    restAudio.current = rAudio;

    // Connect to AudioContext for better volume control on mobile
    const sourceW = audioCtx.current.createMediaElementSource(wAudio);
    workGain.current = audioCtx.current.createGain();
    sourceW.connect(workGain.current).connect(audioCtx.current.destination);
    workGain.current.gain.value = 0;

    const sourceR = audioCtx.current.createMediaElementSource(rAudio);
    restGain.current = audioCtx.current.createGain();
    sourceR.connect(restGain.current).connect(audioCtx.current.destination);
    restGain.current.gain.value = 0;

    // Handle Background/Foreground
    const handleVisibilityChange = () => {
      if (document.hidden) {
        audioCtx.current?.suspend();
        workAudio.current?.pause();
        restAudio.current?.pause();
      } else {
        audioCtx.current?.resume();
        // Resume playback if it was supposed to be playing
        if (currentStatus.current === 'working') {
            workAudio.current?.play().catch(() => {});
        } else if (['resting', 'preparing'].includes(currentStatus.current)) {
            restAudio.current?.play().catch(() => {});
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      audioCtx.current?.close();
      wAudio.pause();
      rAudio.pause();
    };
  }, []);

  const fadeAudio = (gainNode: GainNode | null, audio: HTMLAudioElement | null, targetVolume: number) => {
    if (!gainNode || !audio || !audioCtx.current) return;
    
    const now = audioCtx.current.currentTime;
    
    if (targetVolume > 0) {
        if (audio.paused) {
            audio.play().catch(e => console.error("Audio play blocked:", e));
        }
        gainNode.gain.setTargetAtTime(targetVolume, now, 0.5);
    } else {
        gainNode.gain.setTargetAtTime(0, now, 0.5);
        // Pause after a short delay to allow fade out
        setTimeout(() => {
            if (gainNode.gain.value < 0.01) audio.pause();
        }, 1000);
    }
  };

  const playBeep = (frequency: number, duration: number) => {
    if (!audioCtx.current) return;
    if (audioCtx.current.state === 'suspended') audioCtx.current.resume();

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
    
    currentStatus.current = status;

    if (isMuted.current || status === 'finished' || status === 'idle' || status === 'paused') {
        fadeAudio(workGain.current, workAudio.current, 0);
        fadeAudio(restGain.current, restAudio.current, 0);
        return;
    }

    switch (status) {
      case 'working':
        if (workAudio.current) workAudio.current.currentTime = 0;
        fadeAudio(workGain.current, workAudio.current, 0.2); // Restore to 0.2
        fadeAudio(restGain.current, restAudio.current, 0);
        break;
      case 'resting':
      case 'preparing':
        if (restAudio.current) restAudio.current.currentTime = 0;
        fadeAudio(workGain.current, workAudio.current, 0);
        fadeAudio(restGain.current, restAudio.current, 0.15); // Restore to 0.15
        break;
    }
  }, []);

  const notify = useCallback((type: 'prepare' | 'start' | 'stop' | 'rest' | 'finish') => {
    switch (type) {
      case 'prepare':
        playBeep(440, 0.1);
        break;
      case 'start':
        playBeep(880, 0.3);
        break;
      case 'stop':
      case 'rest':
        playBeep(220, 0.3);
        break;
      case 'finish':
        if (!audioCtx.current) return;
        if (audioCtx.current.state === 'suspended') audioCtx.current.resume();
        const now = audioCtx.current.currentTime;
        const notes = [
          { freq: 523.25, time: 0, dur: 0.15 },    // C5
          { freq: 659.25, time: 0.15, dur: 0.15 }, // E5
          { freq: 783.99, time: 0.3, dur: 0.15 },  // G5
          { freq: 1046.50, time: 0.45, dur: 0.4 }  // C6
        ];
        notes.forEach(note => {
          const osc = audioCtx.current!.createOscillator();
          const gain = audioCtx.current!.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(note.freq, now + note.time);
          gain.gain.setValueAtTime(0.3, now + note.time);
          gain.gain.exponentialRampToValueAtTime(0.01, now + note.time + note.dur);
          osc.connect(gain);
          gain.connect(audioCtx.current!.destination);
          osc.start(now + note.time);
          osc.stop(now + note.time + note.dur);
        });
        break;
    }
  }, []);

  return { notify, setBGM };
};
