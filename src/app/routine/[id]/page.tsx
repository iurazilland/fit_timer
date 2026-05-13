"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Play, Trash2, Clock, Dumbbell, Music, GripVertical } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useRoutines } from '@/hooks/useRoutines';
import TimerDisplay from '@/components/TimerDisplay';
import SwipeableCard from '@/components/SwipeableCard';
import { useTimer } from '@/hooks/useTimer';
import { useAudio } from '@/hooks/useAudio';
import { translate } from '@/utils/translate';
import { 
    DndContext, 
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Sub Components ---

function EditExerciseModal({ 
  exercise, 
  onClose, 
  onSave 
}: { 
  exercise: any, 
  onClose: () => void, 
  onSave: (workTime: number, restTime: number) => void 
}) {
    const [work, setWork] = useState(exercise.workTime || 30);
    const [rest, setRest] = useState(exercise.restTime || 10);

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6"
            onClick={onClose}
        >
            <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <h3 className="text-xl font-black text-white mb-8 text-center">운동 시간 설정</h3>
                
                <div className="space-y-8 mb-10">
                    <div className="flex flex-col items-center gap-4">
                        <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">운동 시간 (WORK)</span>
                        <div className="flex items-center gap-6">
                            <button 
                                onClick={() => setWork(Math.max(5, work - 5))}
                                className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 text-white text-2xl font-light hover:bg-slate-800"
                            >
                                -
                            </button>
                            <span className="text-4xl font-black text-white min-w-[3.5rem] text-center">{work}s</span>
                            <button 
                                onClick={() => setWork(work + 5)}
                                className="w-12 h-12 rounded-2xl bg-emerald-600 text-white text-2xl font-light hover:bg-emerald-500"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-4">
                        <span className="text-xs font-black text-amber-500 uppercase tracking-widest">휴식 시간 (REST)</span>
                        <div className="flex items-center gap-6">
                            <button 
                                onClick={() => setRest(Math.max(0, rest - 5))}
                                className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 text-white text-2xl font-light hover:bg-slate-800"
                            >
                                -
                            </button>
                            <span className="text-4xl font-black text-white min-w-[3.5rem] text-center">{rest}s</span>
                            <button 
                                onClick={() => setRest(rest + 5)}
                                className="w-12 h-12 rounded-2xl bg-amber-600 text-white text-2xl font-light hover:bg-amber-500"
                            >
                                +
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-4 bg-slate-950 border border-slate-800 text-slate-500 font-bold rounded-2xl hover:text-white transition-colors"
                    >
                        취소
                    </button>
                    <button 
                        onClick={() => onSave(work, rest)}
                        className="flex-1 py-4 bg-purple-600 text-white font-black rounded-2xl shadow-lg shadow-purple-500/20 hover:bg-purple-500 transition-all"
                    >
                        저장하기
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

function SortableItem({ id, children, isDragging: isDndDragging }: { id: string, children: React.ReactNode, isDragging?: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
    position: 'relative' as const,
  };

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? 'opacity-50' : ''}>
        {React.Children.map(children, child => {
            if (React.isValidElement(child)) {
                return React.cloneElement(child as React.ReactElement<any>, { 
                    dragHandleProps: { ...attributes, ...listeners },
                    isDragging: isDragging || isDndDragging
                });
            }
            return child;
        })}
    </div>
  );
}

function ExerciseCardContent({ 
    re, 
    idx, 
    base, 
    dragHandleProps 
  }: { 
    re: any, 
    idx: number, 
    base: any, 
    dragHandleProps?: any
  }) {
      const assetPath = base ? (base.gif_url || base.image) : null;
      const finalSrc = assetPath ? (assetPath.startsWith('/') ? assetPath : `/${assetPath}`) : null;

      return (
          <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800/50 p-2.5 rounded-3xl flex items-center gap-3 group hover:border-slate-700 transition-all">
              <div className="relative w-16 h-16 bg-slate-950 rounded-2xl overflow-hidden flex-shrink-0 border border-white/5">
                  {finalSrc ? (
                      <img 
                          src={finalSrc} 
                          alt={base?.name} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              console.error(`Routine Image Error: ${target.src}`);
                              target.src = 'https://www.svgrepo.com/show/532622/fitness-center.svg';
                              target.classList.add('opacity-20', 'p-4', 'invert');
                          }}
                      />
                  ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-900">
                          <Dumbbell className="w-8 h-8 text-slate-800" />
                      </div>
                  )}
                  <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-md px-1.5 py-0.5 rounded-lg text-[10px] font-black text-slate-500 italic">
                      {idx + 1}
                  </div>
              </div>
              
              <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-white text-base leading-tight mb-1.5 truncate tracking-tight">{base ? (base.name_ko || base.name) : 'Unknown Exercise'}</h4>
                  <div className="flex items-center gap-2">
                      <div className="flex flex-col items-start bg-emerald-500/5 border border-emerald-500/10 px-3 py-1.5 rounded-xl">
                          <span className="text-[9px] font-black text-emerald-500/50 uppercase tracking-tighter leading-none mb-0.5">운동</span>
                          <span className="text-sm font-black text-emerald-400">{re.workTime}S</span>
                      </div>
                      
                      <div className="flex flex-col items-start bg-amber-500/5 border border-amber-500/10 px-3 py-1.5 rounded-xl">
                          <span className="text-[9px] font-black text-amber-500/50 uppercase tracking-tighter leading-none mb-0.5">휴식</span>
                          <span className="text-sm font-black text-amber-400">{re.restTime}S</span>
                      </div>
                  </div>
              </div>
  
              <div className="pr-2" {...(dragHandleProps || {})}>
                  <div className="p-2 text-slate-800 cursor-grab active:cursor-grabbing hover:text-slate-400 transition-colors">
                      <GripVertical className="w-5 h-5" />
                  </div>
              </div>
          </div>
      );
  }

// --- Main Page Component ---

export default function RoutineDetail() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { getRoutine, updateRoutine, isLoaded } = useRoutines();
  
  const [routine, setRoutine] = useState<any>(null);
  const [isTimerMode, setIsTimerMode] = useState(false);
  const [exerciseData, setExerciseData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [editingExercise, setEditingExercise] = useState<any>(null);
  const [isMusicMuted, setIsMusicMuted] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (isLoaded) {
      const r = getRoutine(id);
      console.log("Routine fetched:", r);
      if (!r) {
          router.push('/');
      } else {
          setRoutine(r);
          setIsLoading(false); // 루틴만 찾아지면 일단 로딩 해제
      }
    }
  }, [id, isLoaded, getRoutine, router]);

  useEffect(() => {
    console.log("Fetching exercise data (KO)...");
    fetch('/data/exercises_ko.json?v=final')
      .then(res => res.json())
      .then(data => {
          console.log("Exercise data loaded:", data.length, "items");
          setExerciseData(data);
      })
      .catch(err => {
          console.error("Failed to load exercises:", err);
      });
  }, []);

  const routineExercises = useMemo(() => {
    if (!routine) return [];
    return routine.exercises.map((re: any) => {
        const base = exerciseData.find(ex => ex.id === re.exerciseId);
        if (!base && exerciseData.length > 0) {
            console.warn(`Exercise base data not found for ID: ${re.exerciseId}`);
        }
        return { ...base, ...re };
    });
  }, [routine, exerciseData]);

  const { notify, setBGM } = useAudio();

  const timer = useTimer({
    exercises: routineExercises,
    workDuration: 0,
    restDuration: 0,
    rounds: routine?.rounds || 1,
    onBeep: notify
  });

  useEffect(() => {
    setBGM(timer.status, isMusicMuted);
  }, [timer.status, isMusicMuted, setBGM]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
        const oldIndex = routine.exercises.findIndex((ex: any) => ex.id === active.id);
        const newIndex = routine.exercises.findIndex((ex: any) => ex.id === over.id);
        const newExercises = arrayMove(routine.exercises, oldIndex, newIndex);
        const updated = { ...routine, exercises: newExercises };
        setRoutine(updated);
        updateRoutine(updated);
    }
  };

  const removeExercise = (instanceId: string) => {
    const updated = {
      ...routine,
      exercises: routine.exercises.filter((ex: any) => ex.id !== instanceId)
    };
    setRoutine(updated);
    updateRoutine(updated);
  };

  if (!routine) return null;

  // Calculate Total Time: (Sum of work + rest) * Rounds
  const totalSecondsPerRound = routine.exercises.reduce((acc: number, ex: any) => acc + (ex.workTime || 30) + (ex.restTime || 10), 0);
  const totalSeconds = totalSecondsPerRound * (routine.rounds || 1);
  const totalMins = Math.floor(totalSeconds / 60);
  const totalSecs = totalSeconds % 60;

  return (
    <main className="max-w-4xl mx-auto min-h-screen flex flex-col px-4 md:px-6">
      <AnimatePresence mode="wait">
        {!isTimerMode ? (
          <motion.div 
            key="setup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full flex-1 flex flex-col py-6 pb-32"
          >
            <header className="w-full py-6 flex items-center justify-between mb-2">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => router.push('/')}
                  className="p-3 bg-slate-900 rounded-2xl border border-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-2xl font-black text-white">{routine.name}</h1>
              </div>
              <button 
                onClick={() => setIsMusicMuted(!isMusicMuted)}
                className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all ${
                    isMusicMuted 
                    ? 'bg-slate-950 border-slate-800 text-slate-700' 
                    : 'bg-slate-900 border-slate-800 text-purple-500 shadow-lg shadow-purple-500/10'
                }`}
              >
                <Music className={`w-6 h-6 ${isMusicMuted ? 'opacity-20' : 'opacity-100'}`} />
              </button>
            </header>

            <div className="w-full bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 mb-10 flex items-center justify-between shadow-2xl shadow-black/20">
                {/* Total Time Section */}
                <div className="flex-1 min-w-0 flex flex-col items-start gap-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">총 운동 시간</p>
                    <div className="flex items-baseline gap-1 whitespace-nowrap">
                        <span className="text-3xl font-black text-white tabular-nums tracking-tight inline-block min-w-[1.1em] text-right">
                            {totalMins}
                        </span>
                        <span className="text-xs font-bold text-slate-500 mr-2">분</span>
                        <span className="text-3xl font-black text-white tabular-nums tracking-tight">
                            {totalSecs.toString().padStart(2, '0')}
                        </span>
                        <span className="text-xs font-bold text-slate-500">초</span>
                    </div>
                </div>

                <div className="w-px h-12 bg-gradient-to-b from-transparent via-slate-800 to-transparent mx-8 opacity-50"></div>

                {/* Rounds Selector Section */}
                <div className="flex-1 flex flex-col items-end gap-2">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mr-1">반복 루틴</p>
                    <div className="flex items-center bg-slate-950/50 rounded-2xl p-1 border border-white/5">
                        <button 
                            onClick={() => {
                                const newRounds = Math.max(1, (routine.rounds || 1) - 1);
                                updateRoutine({ ...routine, rounds: newRounds });
                            }}
                            className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-90 hover:bg-slate-800"
                        >
                            <span className="text-xl font-light">-</span>
                        </button>
                        <span className="text-2xl font-black text-white min-w-[3rem] text-center tabular-nums">
                            {routine.rounds || 1}
                        </span>
                        <button 
                            onClick={() => {
                                const newRounds = (routine.rounds || 1) + 1;
                                updateRoutine({ ...routine, rounds: newRounds });
                            }}
                            className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white hover:bg-purple-500 transition-all shadow-lg shadow-purple-500/20 active:scale-90"
                        >
                            <span className="text-xl font-light">+</span>
                        </button>
                    </div>
                </div>
            </div>

            <section className="flex-1">
              <h2 className="text-lg font-black text-slate-300 mb-4 flex items-center justify-between">
                운동 순서
                <span className="text-sm font-black text-slate-500 bg-slate-900 px-3 py-1 rounded-full">
                    {routine.exercises.length}
                </span>
              </h2>

              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext 
                  items={routine.exercises.map((ex: any) => ex.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {isLoading ? (
                        <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-[2rem] text-slate-600">
                            <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="w-8 h-8 border-2 border-slate-700 border-t-purple-500 rounded-full mb-4"
                            />
                            <p className="text-sm font-bold">운동 정보를 불러오는 중...</p>
                        </div>
                    ) : routine.exercises.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-[2rem] text-slate-600">
                            <Dumbbell className="w-12 h-12 mb-4 opacity-10" />
                            <p>아직 추가된 운동이 없습니다</p>
                        </div>
                    ) : (
                        routine.exercises.map((re: any, idx: number) => {
                            const base = exerciseData.find(ex => ex.id === re.exerciseId);
                            return (
                              <SortableItem key={re.id} id={re.id}>
                                <SwipeableCard
                                    id={re.id}
                                    onDelete={() => removeExercise(re.id)}
                                    onEdit={() => setEditingExercise({ ...re, idx })}
                                >
                                    <ExerciseCardContent 
                                        re={re} 
                                        idx={idx} 
                                        base={base} 
                                    />
                                </SwipeableCard>
                              </SortableItem>
                            );
                        })
                    )}
                  </div>
                </SortableContext>
              </DndContext>

              <button 
                onClick={() => router.push(`/routine/${id}/select`)}
                className="w-full py-5 border-2 border-dashed border-slate-800 rounded-2xl flex items-center justify-center gap-2 text-slate-500 hover:text-purple-500 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all mt-6"
              >
                <Plus className="w-5 h-5" />
                <span className="font-bold">운동 추가하기</span>
              </button>
            </section>

            <div className="fixed bottom-0 left-0 right-0 px-4 md:px-6 py-6 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent pt-12 z-50">
                <button 
                    onClick={() => {
                        if (routine.exercises.length === 0) return;
                        setIsTimerMode(true);
                        timer.start();
                    }}
                    disabled={routine.exercises.length === 0}
                    className="max-w-4xl mx-auto w-full py-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black rounded-2xl shadow-2xl shadow-purple-500/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale"
                >
                    <Play className="w-6 h-6 fill-white" />
                    운동 시작하기
                </button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="timer"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="fixed inset-0 z-[100] bg-slate-950"
          >
            <TimerDisplay 
                status={timer.status}
                timeLeft={timer.timeLeft}
                totalTimeForStep={timer.totalTimeForStep}
                currentRound={timer.currentRound}
                totalRounds={timer.totalRounds}
                currentExercise={timer.currentExercise}
                nextExercise={timer.nextExercise}
                onToggle={() => {
                    if (timer.status === 'paused') timer.start();
                    else timer.pause();
                }}
                onRestartStep={timer.restartStep}
                onReset={() => {
                    timer.reset();
                    setIsTimerMode(false);
                }}
                isMusicMuted={isMusicMuted}
                onToggleMusic={() => setIsMusicMuted(!isMusicMuted)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingExercise && (
            <EditExerciseModal 
                exercise={editingExercise}
                onClose={() => setEditingExercise(null)}
                onSave={(work, rest) => {
                    const newExercises = [...routine.exercises];
                    newExercises[editingExercise.idx] = {
                        ...newExercises[editingExercise.idx],
                        workTime: work,
                        restTime: rest
                    };
                    const updated = { ...routine, exercises: newExercises };
                    setRoutine(updated);
                    updateRoutine(updated);
                    setEditingExercise(null);
                }}
            />
        )}
      </AnimatePresence>
    </main>
  );
}
