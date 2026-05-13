"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

export type TimerStatus = 'idle' | 'preparing' | 'working' | 'resting' | 'paused' | 'finished';

interface UseTimerProps {
  exercises: any[];
  workDuration: number;
  restDuration: number;
  rounds?: number;
  onStepComplete?: () => void;
  onBeep?: (type: 'prepare' | 'start' | 'stop') => void;
}

export const useTimer = ({
  exercises,
  workDuration,
  restDuration,
  rounds = 1,
  onStepComplete,
  onBeep
}: UseTimerProps) => {
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [timeLeft, setTimeLeft] = useState(0);
  const [lastActiveStatus, setLastActiveStatus] = useState<'working' | 'resting'>('working');
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Latest values for interval access without re-running effect
  const stateRef = useRef({
    status,
    currentIndex,
    currentRound,
    rounds,
    exercises,
    workDuration,
    restDuration,
    onBeep
  });

  useEffect(() => {
    stateRef.current = { status, currentIndex, currentRound, rounds, exercises, workDuration, restDuration, onBeep };
  }, [status, currentIndex, currentRound, rounds, exercises, workDuration, restDuration, onBeep]);

  // Initial time setup
  useEffect(() => {
    if (status === 'idle' && exercises.length > 0) {
      setTimeLeft(exercises[0].workTime || workDuration);
    }
  }, [exercises, status, workDuration]);

  const start = useCallback(() => {
    if (status === 'idle' || status === 'finished') {
      setCurrentIndex(0);
      setCurrentRound(1);
      setTimeLeft(10); // 10 seconds prep time
      setStatus('preparing');
      setLastActiveStatus('preparing' as any);
      onBeep?.('prepare');
    } else if (status === 'paused') {
      setStatus(lastActiveStatus);
    }
  }, [status, lastActiveStatus, onBeep]);

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
    const firstTime = exercises[0]?.workTime || workDuration;
    setTimeLeft(firstTime);
    setLastActiveStatus('working');
    if (timerRef.current) clearInterval(timerRef.current);
  }, [exercises, workDuration]);

  useEffect(() => {
    if (status === 'working' || status === 'resting' || status === 'preparing') {
      timerRef.current = setInterval(() => {
        const { 
            status: s, 
            currentIndex: idx, 
            currentRound: cr,
            rounds: tr,
            exercises: exs, 
            workDuration: wd, 
            restDuration: rd, 
            onBeep: beep 
        } = stateRef.current;
        
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (s === 'preparing') {
              setStatus('working');
              setLastActiveStatus('working');
              beep?.('start');
              return exs[0]?.workTime ?? wd;
            } else if (s === 'working') {
              if (idx < exs.length - 1) {
                // Next exercise in round
                setStatus('resting');
                setLastActiveStatus('resting');
                beep?.('stop');
                return exs[idx]?.restTime ?? rd;
              } else {
                // Last exercise in round
                if (cr < tr) {
                  // Move to next round
                  setStatus('resting');
                  setLastActiveStatus('resting');
                  beep?.('stop');
                  return exs[idx]?.restTime ?? rd;
                } else {
                  // All rounds completed
                  setStatus('finished');
                  beep?.('stop');
                  return 0;
                }
              }
            } else {
              // Current state is resting
              if (idx < exs.length - 1) {
                // Next exercise in current round
                const nextIdx = idx + 1;
                setCurrentIndex(nextIdx);
                setStatus('working');
                setLastActiveStatus('working');
                beep?.('start');
                return exs[nextIdx]?.workTime ?? wd;
              } else {
                // Start next round
                setCurrentIndex(0);
                setCurrentRound(prevRound => prevRound + 1);
                setStatus('working');
                setLastActiveStatus('working');
                beep?.('start');
                return exs[0]?.workTime ?? wd;
              }
            }
          }
          
          if (prev <= 4 && prev > 1) {
            beep?.('prepare');
          }
          
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]); // Only re-run when status changes

  const restartStep = useCallback(() => {
    const { currentIndex: idx, exercises: exs, workDuration: wd, restDuration: rd, status: s } = stateRef.current;
    const initialTime = s === 'working' 
        ? (exs[idx]?.workTime ?? wd)
        : (exs[idx]?.restTime ?? rd);
    setTimeLeft(initialTime);
  }, []);

  const currentTotalTime = status === 'working' 
    ? (exercises[currentIndex]?.workTime ?? workDuration)
    : (exercises[currentIndex]?.restTime ?? restDuration);

  return {
    status,
    currentIndex,
    currentRound,
    totalRounds: rounds,
    timeLeft,
    totalTimeForStep: currentTotalTime,
    start,
    pause,
    reset,
    restartStep,
    currentExercise: exercises[currentIndex],
    nextExercise: exercises[currentIndex + 1]
  };
};
