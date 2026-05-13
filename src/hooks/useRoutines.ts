"use client";

import { useState, useEffect } from 'react';
import { Routine, RoutineExercise } from '@/types';

export const useRoutines = () => {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('homefit_routines');
    if (saved) {
      setRoutines(JSON.parse(saved));
    }
    setIsLoaded(true);
  }, []);

  const saveRoutines = (newRoutines: Routine[]) => {
    setRoutines(newRoutines);
    localStorage.setItem('homefit_routines', JSON.stringify(newRoutines));
  };

  const addRoutine = (name: string) => {
    const newRoutine: Routine = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      exercises: [],
      rounds: 1,
      createdAt: Date.now(),
    };
    saveRoutines([...routines, newRoutine]);
    return newRoutine.id;
  };

  const deleteRoutine = (id: string) => {
    saveRoutines(routines.filter(r => r.id !== id));
  };

  const updateRoutine = (updated: Routine) => {
    saveRoutines(routines.map(r => r.id === updated.id ? updated : r));
  };

  const getRoutine = (id: string) => {
    return routines.find(r => r.id === id);
  };

  return {
    routines,
    isLoaded,
    addRoutine,
    deleteRoutine,
    updateRoutine,
    getRoutine
  };
};
