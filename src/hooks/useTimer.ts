"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

export type TimerStatus = 'idle' | 'preparing' | 'working' | 'resting' | 'paused' | 'finished';

interface UseTimerProps {
  exercises: any[];
  workDuration: number;
  restDuration: number;
  roundRestDuration?: number;
  rounds?: number;
  onStepComplete?: () => void;
  onBeep?: (type: 'prepare' | 'start' | 'rest' | 'stop') => void;
}

export const useTimer = ({
  exercises,
  workDuration,
  restDuration,
  roundRestDuration = 60,
  rounds = 1,
  onStepComplete,
  onBeep
}: UseTimerProps) => {
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [timeLeft, setTimeLeft] = useState(workDuration);
  const [totalRounds, setTotalRounds] = useState(rounds);
  const [version, setVersion] = useState(0);
  const [lastActiveStatus, setLastActiveStatus] = useState<TimerStatus>('working');

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const stateRef = useRef({ 
    status, 
    currentIndex, 
    currentRound, 
    rounds, 
    exercises, 
    workDuration, 
    restDuration, 
    roundRestDuration,
    onBeep 
  });

  // Sync stateRef
  useEffect(() => {
    stateRef.current = { 
      status, 
      currentIndex, 
      currentRound, 
      rounds, 
      exercises, 
      workDuration, 
      restDuration, 
      roundRestDuration,
      onBeep 
    };
  }, [status, currentIndex, currentRound, rounds, exercises, workDuration, restDuration, roundRestDuration, onBeep]);

  // Sync totalRounds state with rounds prop
  useEffect(() => {
    setTotalRounds(rounds);
  }, [rounds]);

  // Initial time setup
  useEffect(() => {
    if (status === 'idle' && exercises.length > 0) {
      const initialTime = exercises[0].workTime || workDuration || 30;
      setTimeLeft(initialTime);
    }
  }, [exercises, status, workDuration]);

  const beep = useCallback((type: 'prepare' | 'start' | 'rest' | 'stop') => {
    onBeep?.(type);
  }, [onBeep]);

  // Wake Lock API: Prevent screen from sleeping during active workout
  const wakeLockRef = useRef<any>(null);

  const requestWakeLock = useCallback(async () => {
    if (typeof window !== 'undefined' && 'wakeLock' in navigator) {
      try {
        if (!wakeLockRef.current) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
          wakeLockRef.current.addEventListener('release', () => {
            wakeLockRef.current = null;
          });
        }
      } catch (err) {
        console.warn('Wake Lock error:', err);
      }
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      } catch (err) {
        console.warn('Wake Lock release error:', err);
      }
    }
  }, []);

  // Manage Wake Lock based on timer status
  useEffect(() => {
    const isRunning = status === 'preparing' || status === 'working' || status === 'resting';
    if (isRunning) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    return () => {
      releaseWakeLock();
    };
  }, [status, requestWakeLock, releaseWakeLock]);

  // Handle visibility change (re-request wake lock if tab becomes visible while timer is running)
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isRunning = status === 'preparing' || status === 'working' || status === 'resting';
      if (document.visibilityState === 'visible' && isRunning) {
        requestWakeLock();
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [status, requestWakeLock]);

  // Timer Interval - ONLY decrements timeLeft
  useEffect(() => {
    if (status === 'working' || status === 'resting' || status === 'preparing') {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 0) return 0;
          
          // Beep 5 seconds before ending
          if (prev <= 6 && prev > 1) {
            beep('prepare');
          }
          
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, beep]);

  const nextStep = useCallback(() => {
    const { 
      currentIndex: idx, 
      currentRound: cr, 
      rounds: tr, 
      exercises: exs, 
      status: s,
      workDuration: wd,
      restDuration: rd,
      roundRestDuration: rrd 
    } = stateRef.current;

    // Guard: Prevent multiple calls in the same state/frame
    if (s === 'idle' || s === 'finished' || s === 'paused') return;

    if (s === 'preparing') {
      setStatus('working');
      setLastActiveStatus('working');
      setTimeLeft(Number(exs[0]?.workTime ?? wd ?? 30));
      beep('start');
    } else if (s === 'working') {
      const isLastExerciseInRound = idx === exs.length - 1;
      const isLastRound = cr === tr;
      
      if (!isLastExerciseInRound) {
        setStatus('resting');
        setLastActiveStatus('resting');
        setTimeLeft(Number(exs[idx]?.restTime ?? rd ?? 10));
        beep('rest');
      } else if (!isLastRound) {
        // Last exercise of a round (but not the final round)
        // If set rest is specified, use it. Otherwise, use normal exercise rest.
        const exerciseRest = Number(exs[idx]?.restTime ?? rd ?? 10);
        const setRest = Number(rrd);
        setStatus('resting');
        setLastActiveStatus('resting');
        setTimeLeft(setRest > 0 ? setRest : exerciseRest);
        beep('rest');
      } else {
        // Absolute last exercise of the entire workout
        setStatus('finished');
        beep('stop');
      }
    } else if (s === 'resting') {
      const isRoundRest = idx === exs.length - 1;
      
      if (!isRoundRest) {
        const nextIdx = idx + 1;
        setCurrentIndex(nextIdx);
        setStatus('working');
        setLastActiveStatus('working');
        setTimeLeft(Number(exs[nextIdx]?.workTime ?? wd ?? 30));
        beep('start');
      } else {
        setCurrentIndex(0);
        setCurrentRound(cr + 1);
        setStatus('working');
        setLastActiveStatus('working');
        setTimeLeft(Number(exs[0]?.workTime ?? wd ?? 30));
        beep('start');
      }
    }
    onStepComplete?.();
  }, [beep, onStepComplete]);

  // Transition Logic - Handles state changes when timeLeft hits 0
  useEffect(() => {
    if (timeLeft <= 0 && (status === 'working' || status === 'resting' || status === 'preparing')) {
      nextStep();
    }
  }, [timeLeft, status, nextStep]);

  const start = useCallback(() => {
    if (status === 'idle' || status === 'finished') {
      setCurrentIndex(0);
      setCurrentRound(1);
      setTimeLeft(10);
      setStatus('preparing');
      setLastActiveStatus('preparing');
      beep('prepare');
    } else if (status === 'paused') {
      setStatus(lastActiveStatus);
    }
  }, [status, lastActiveStatus, beep]);

  const pause = useCallback(() => {
    if (status === 'working' || status === 'resting' || status === 'preparing') {
      setLastActiveStatus(status);
      setStatus('paused');
    }
  }, [status]);

  const reset = useCallback(() => {
    setStatus('idle');
    setCurrentIndex(0);
    setCurrentRound(1);
    const firstTime = exercises[0]?.workTime || workDuration || 30;
    setTimeLeft(firstTime);
    setLastActiveStatus('working');
    if (timerRef.current) clearInterval(timerRef.current);
  }, [exercises, workDuration]);

  const restartStep = useCallback(() => {
    const { currentIndex: idx, exercises: exs, workDuration: wd, restDuration: rd, status: s } = stateRef.current;
    const initialTime = s === 'working' 
        ? (exs[idx]?.workTime ?? wd ?? 30)
        : (s === 'preparing' ? 10 : (exs[idx]?.restTime ?? rd ?? 10));
    setTimeLeft(initialTime);
    setVersion(v => v + 1);
  }, []);

  const prevStep = useCallback(() => {
    const { 
        status: s, 
        currentIndex: idx, 
        currentRound: cr,
        exercises: exs, 
        workDuration: wd, 
        restDuration: rd,
        roundRestDuration: rrd 
    } = stateRef.current;

    const currentTotal = s === 'working' 
        ? (exs[idx]?.workTime ?? wd ?? 30)
        : (s === 'preparing' ? 10 : (exs[idx]?.restTime ?? rd ?? 10));
    
    const elapsed = currentTotal - timeLeft;

    if (elapsed > 3) {
        restartStep();
        return;
    }

    if (s === 'preparing') {
        restartStep();
    } else if (s === 'working') {
        if (idx > 0) {
            const prevIdx = idx - 1;
            setCurrentIndex(prevIdx);
            setStatus('resting');
            setLastActiveStatus('resting');
            setTimeLeft(exs[prevIdx]?.restTime ?? rd ?? 10);
        } else if (cr > 1) {
            if (Number(rrd) > 0) {
                setStatus('resting');
                setLastActiveStatus('resting');
                setTimeLeft(Number(rrd));
                setCurrentIndex(exs.length - 1);
                setCurrentRound(cr - 1);
            } else {
                const lastIdx = exs.length - 1;
                setCurrentIndex(lastIdx);
                setCurrentRound(cr - 1);
                setStatus('working');
                setLastActiveStatus('working');
                setTimeLeft(exs[lastIdx]?.workTime ?? wd ?? 30);
            }
        } else {
            setCurrentIndex(0);
            setStatus('preparing');
            setLastActiveStatus('preparing');
            setTimeLeft(10);
        }
    } else if (s === 'resting') {
        setStatus('working');
        setLastActiveStatus('working');
        setTimeLeft(exs[idx]?.workTime ?? wd ?? 30);
    }
  }, [timeLeft, restartStep]);

  const currentTotalTime = status === 'working' 
    ? (exercises[currentIndex]?.workTime ?? workDuration ?? 30)
    : (status === 'preparing'
        ? 10 
        : (status === 'resting' && currentIndex === exercises.length - 1
            ? (roundRestDuration > 0 ? roundRestDuration : (exercises[currentIndex]?.restTime ?? restDuration ?? 10))
            : (exercises[currentIndex]?.restTime ?? restDuration ?? 10)));

  return {
    status,
    currentIndex,
    currentRound,
    totalRounds,
    timeLeft,
    totalTimeForStep: currentTotalTime,
    start,
    pause,
    reset,
    restartStep,
    nextStep,
    prevStep,
    version,
    currentExercise: exercises[currentIndex],
    nextExercise: exercises[currentIndex + 1]
  };
};
