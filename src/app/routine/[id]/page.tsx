"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
    <div ref={setNodeRef} style={style} className={`w-full min-w-0 ${isDragging ? 'opacity-50' : ''}`}>
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
      const assetPath = base ? base.gif_url : null;
      const finalSrc = assetPath ? (assetPath.startsWith('/') ? assetPath : `/${assetPath}`) : null;

      return (
          <div className="w-full min-w-0 bg-slate-900/40 backdrop-blur-sm border border-slate-800/50 p-2 md:p-3 rounded-3xl flex items-center gap-2 md:gap-3 group hover:border-slate-700 transition-all">
              <div className="relative w-16 h-16 bg-white rounded-2xl overflow-hidden flex-shrink-0 border border-white/5">
                  {finalSrc ? (
                      <img 
                          src={finalSrc} 
                          alt={base?.name} 
                          className="w-full h-full object-contain bg-white"
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
                  <div className="flex items-center gap-2 mb-1">
                      <span className="px-1.5 py-0.5 bg-slate-950/50 border border-slate-800 rounded-md text-[8px] font-black text-slate-500 uppercase tracking-widest">
                          {base?.body_part_ko || '기타'}
                      </span>
                  </div>
                  <h4 className="font-bold text-white text-base leading-tight mb-2 truncate tracking-tight capitalize">
                      {base ? base.name : 'Unknown Exercise'}
                  </h4>
                  <div className="flex items-center gap-2">
                      <div className="flex flex-col items-start bg-emerald-500/5 border border-emerald-500/10 px-2 md:px-3 py-1 md:py-1.5 rounded-xl">
                          <span className="text-[9px] font-black text-emerald-500/50 uppercase tracking-tighter leading-none mb-0.5">운동</span>
                          <span className="text-sm font-black text-emerald-400">{re.workTime}S</span>
                      </div>
                      
                      <div className="flex flex-col items-start bg-amber-500/5 border border-amber-500/10 px-2 md:px-3 py-1 md:py-1.5 rounded-xl">
                          <span className="text-[9px] font-black text-amber-500/50 uppercase tracking-tighter leading-none mb-0.5">휴식</span>
                          <span className="text-sm font-black text-amber-400">{re.restTime}S</span>
                      </div>
                  </div>
              </div>
  
              <div className="pr-2 flex-shrink-0" {...(dragHandleProps || {})}>
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
      if (id.startsWith('p-')) {
        fetch('/data/default_routines.json')
          .then(res => res.json())
          .then(presets => {
            const preset = presets.find((p: any) => p.id === id);
            if (preset) {
              const mappedExercises = preset.exercises.map((ex: any) => ({
                ...ex,
                exerciseId: ex.id,
                workTime: ex.workTime || 30,
                restTime: ex.restTime || 10,
                id: `preset-${preset.id}-${ex.id}`
              }));

              setRoutine({
                id: preset.id,
                name: preset.title,
                exercises: mappedExercises,
                rounds: preset.rounds || 1,
                roundRest: preset.roundRest ?? 0
              });
              
              if (exerciseData.length > 0) {
                setIsLoading(false);
              }
            } else {
              router.push('/');
            }
          })
          .catch(() => router.push('/'));
      } else {
        const r = getRoutine(id);
        if (!r) {
          router.push('/');
        } else {
          setRoutine(r);
          if (exerciseData.length > 0) {
            setIsLoading(false);
          }
        }
      }
    }
  }, [id, isLoaded, exerciseData.length, getRoutine, router]);

  useEffect(() => {
    if (exerciseData.length === 0) {
      fetch('/data/exercises_all.json')
        .then(res => res.json())
        .then(data => {
            setExerciseData(data);
        });
    }
  }, [exerciseData.length]);

  // Handle loading state when exerciseData finally arrives
  useEffect(() => {
    if (routine && exerciseData.length > 0 && isLoading) {
      setIsLoading(false);
    }
  }, [routine, exerciseData, isLoading]);

  const routineExercises = useMemo(() => {
    if (!routine) return [];
    return routine.exercises.map((re: any) => {
        const base = exerciseData.find(ex => String(ex.id) === String(re.exerciseId));
        if (!base && exerciseData.length > 0) {
            console.warn(`Exercise base data not found for ID: ${re.exerciseId}`);
        }
        return { ...base, ...re };
    });
  }, [routine, exerciseData]);

  const { notify, setBGM } = useAudio();

  const timer = useTimer({
    exercises: routineExercises,
    workDuration: 30,
    restDuration: 10,
    roundRestDuration: routine?.roundRest ?? 0,
    rounds: routine?.rounds || 1,
    onBeep: notify
  });

  useEffect(() => {
    setBGM(timer.status, isMusicMuted);
  }, [timer.status, isMusicMuted, setBGM]);

  const hasRecordedAttendance = useRef(false);

  useEffect(() => {
    if (timer.status === 'finished') {
      if (!hasRecordedAttendance.current) {
        hasRecordedAttendance.current = true;
        try {
          const sumW = routine.exercises.reduce((acc: number, ex: any) => acc + (ex.workTime || 30), 0);
          const sumR = routine.exercises.length > 1 
            ? routine.exercises.slice(0, -1).reduce((acc: number, ex: any) => acc + (ex.restTime || 10), 0)
            : 0;
          const lastR = routine.exercises.length > 0 ? (routine.exercises[routine.exercises.length - 1].restTime || 10) : 0;
          const rRest = routine.roundRest ?? 0;
          const rds = routine.rounds || 1;
          
          const effRest = rRest > 0 ? rRest : lastR;
          const totalSecs = (sumW + sumR + effRest) * (rds - 1) + (sumW + sumR);

          const todayStr = new Date().toISOString().split('T')[0];
          const stored = localStorage.getItem('homefit_attendance');
          const attendanceData = stored ? JSON.parse(stored) : {};

          const existing = attendanceData[todayStr] || { totalSeconds: 0, count: 0 };
          attendanceData[todayStr] = {
            totalSeconds: existing.totalSeconds + totalSecs,
            count: existing.count + 1
          };

          localStorage.setItem('homefit_attendance', JSON.stringify(attendanceData));
          window.dispatchEvent(new Event('attendance_updated'));
        } catch (err) {
          console.error('Failed to record attendance:', err);
        }
      }
    } else if (timer.status === 'idle') {
      hasRecordedAttendance.current = false;
    }
  }, [timer.status, routine]);

  const handleDragEnd = (event: DragEndEvent) => {
    if (id.startsWith('p-')) return;
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
    if (id.startsWith('p-')) return;
    const updated = {
      ...routine,
      exercises: routine.exercises.filter((ex: any) => ex.id !== instanceId)
    };
    setRoutine(updated);
    updateRoutine(updated);
  };

  if (!routine) return null;

  // Calculate Total Time:
  // Each round except the last: (Sum of work + rest for all but last + last work + roundRest)
  // Last round: (Sum of work + rest for all but last + last work)
  const sumWork = routine.exercises.reduce((acc: number, ex: any) => acc + (ex.workTime || 30), 0);
  const sumRestExceptLast = routine.exercises.length > 1 
    ? routine.exercises.slice(0, -1).reduce((acc: number, ex: any) => acc + (ex.restTime || 10), 0)
    : 0;
  const lastRest = routine.exercises.length > 0 ? (routine.exercises[routine.exercises.length - 1].restTime || 10) : 0;
  const roundRest = routine.roundRest ?? 0;
  const rounds = routine.rounds || 1;
  
  const effectiveRoundEndRest = roundRest > 0 ? roundRest : lastRest;
  const totalSeconds = (sumWork + sumRestExceptLast + effectiveRoundEndRest) * (rounds - 1) + (sumWork + sumRestExceptLast);

  const totalMins = Math.floor(totalSeconds / 60);
  const totalSecs = totalSeconds % 60;

  return (
    <main className="w-full min-h-screen bg-slate-950 flex flex-col items-center">
      <div className="w-full max-w-4xl flex flex-col min-h-screen relative px-0">
        <AnimatePresence mode="wait">
          {!isTimerMode ? (
            <motion.div 
              key="setup"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full flex-1 flex flex-col py-6 pb-32 px-4 md:px-6"
            >
              <header className="w-full py-6 flex items-center justify-between mb-2">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => router.push('/')}
                  className="p-3 bg-slate-900 rounded-2xl border border-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-2xl font-black text-white truncate max-w-[200px] md:max-w-none">{routine.name}</h1>
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

            <div className="w-full bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-4 md:p-6 mb-10 grid grid-cols-3 gap-2 md:gap-4 shadow-2xl shadow-black/20">
                {/* Total Time Section */}
                <div className="flex flex-col items-center justify-center gap-1">
                    <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">총 운동 시간</p>
                    <div className="flex items-baseline gap-1 whitespace-nowrap">
                        <span className="text-xl md:text-3xl font-black text-white tabular-nums tracking-tight">
                            {totalMins}
                        </span>
                        <span className="text-[10px] md:text-xs font-bold text-slate-500">분</span>
                        <span className="text-xl md:text-3xl font-black text-white tabular-nums tracking-tight ml-1">
                            {totalSecs.toString().padStart(2, '0')}
                        </span>
                        <span className="text-[10px] md:text-xs font-bold text-slate-500">초</span>
                    </div>
                </div>

                {/* Rounds Selector Section */}
                <div className="flex flex-col items-center justify-center gap-2 border-x border-white/5">
                    <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">반복 세트</p>
                    <div className="flex items-center gap-1.5 md:gap-3 bg-slate-950/50 rounded-xl md:rounded-2xl p-1 border border-white/5">
                        <button 
                            onClick={() => {
                                const newRounds = Math.max(1, (routine.rounds || 1) - 1);
                                const updated = { ...routine, rounds: newRounds };
                                setRoutine(updated);
                                if (!id.startsWith('p-')) updateRoutine(updated);
                            }}
                            className="w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-90"
                        >
                            <span className="text-lg md:text-xl font-light">-</span>
                        </button>
                        <span className="text-lg md:text-2xl font-black text-white min-w-[1.2rem] md:min-w-[2rem] text-center tabular-nums">
                            {routine.rounds || 1}
                        </span>
                        <button 
                            onClick={() => {
                                const newRounds = (routine.rounds || 1) + 1;
                                const updated = { ...routine, rounds: newRounds };
                                setRoutine(updated);
                                if (!id.startsWith('p-')) updateRoutine(updated);
                            }}
                            className="w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-purple-600 flex items-center justify-center text-white hover:bg-purple-500 transition-all active:scale-90"
                        >
                            <span className="text-lg md:text-xl font-light">+</span>
                        </button>
                    </div>
                </div>

                {/* Round Rest Selector Section */}
                <div className="flex flex-col items-center justify-center gap-2">
                    <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">세트 휴식</p>
                    <div className="flex items-center gap-1.5 md:gap-3 bg-slate-950/50 rounded-xl md:rounded-2xl p-1 border border-white/5">
                        <button 
                            onClick={() => {
                                const newRest = Math.max(0, (routine.roundRest || 0) - 5);
                                const updated = { ...routine, roundRest: newRest };
                                setRoutine(updated);
                                if (!id.startsWith('p-')) updateRoutine(updated);
                            }}
                            className="w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-90"
                        >
                            <span className="text-lg md:text-xl font-light">-</span>
                        </button>
                        <span className="text-lg md:text-2xl font-black text-white min-w-[1.2rem] md:min-w-[2.5rem] text-center tabular-nums">
                            {routine.roundRest ?? 0}s
                        </span>
                        <button 
                            onClick={() => {
                                const newRest = (routine.roundRest ?? 0) + 5;
                                const updated = { ...routine, roundRest: newRest };
                                setRoutine(updated);
                                if (!id.startsWith('p-')) updateRoutine(updated);
                            }}
                            className="w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-emerald-600 flex items-center justify-center text-white hover:bg-emerald-500 transition-all active:scale-90"
                        >
                            <span className="text-lg md:text-xl font-light">+</span>
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
                  <div className="space-y-3 w-full">
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

              {!id.startsWith('p-') && (
                <button 
                  onClick={() => router.push(`/routine/${id}/select`)}
                  className="w-full py-5 border-2 border-dashed border-slate-800 rounded-2xl flex items-center justify-center gap-2 text-slate-500 hover:text-purple-500 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all mt-6"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-bold">운동 추가하기</span>
                </button>
              )}
            </section>

            </motion.div>
          ) : (
            <motion.div 
              key={`timer-${routine.id}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="fixed inset-0 z-[100] bg-slate-950"
            >
              <TimerDisplay 
                  key={`display-${routine.id}-${exerciseData.length}`}
                  status={timer.status}
                  timeLeft={timer.timeLeft}
                  totalTimeForStep={timer.totalTimeForStep}
                  currentRound={timer.currentRound}
                  totalRounds={timer.totalRounds}
                  currentExercise={timer.currentExercise}
                  nextExercise={timer.nextExercise || (timer.currentRound < timer.totalRounds ? routineExercises[0] : null)}
                  onToggle={() => {
                      if (timer.status === 'paused') timer.start();
                      else timer.pause();
                  }}
                  onRestartStep={timer.restartStep}
                  onNextStep={timer.nextStep}
                  onPrevStep={timer.prevStep}
                  currentIndex={timer.currentIndex}
                  version={timer.version}
                  onReset={() => {
                      timer.reset();
                      setIsTimerMode(false);
                  }}
                  isMusicMuted={isMusicMuted}
                  onToggleMusic={() => setIsMusicMuted(!isMusicMuted)}
                  isSetRest={timer.status === 'resting' && timer.currentIndex === (routineExercises.length - 1)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {!isTimerMode && (
          <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
            <div className="max-w-4xl mx-auto w-full px-4 md:px-6 py-6 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent pt-12 pointer-events-auto">
                <button 
                    onClick={() => {
                        if (routine.exercises.length === 0 || exerciseData.length === 0) return;
                        setIsTimerMode(true);
                        timer.start();
                    }}
                    disabled={routine.exercises.length === 0 || exerciseData.length === 0}
                    className="w-full py-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black rounded-2xl shadow-2xl shadow-purple-500/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale"
                >
                    <Play className="w-6 h-6 fill-white" />
                    {exerciseData.length === 0 ? '데이터 로딩 중...' : '운동 시작하기'}
                </button>
            </div>
          </div>
        )}
      </div>

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
