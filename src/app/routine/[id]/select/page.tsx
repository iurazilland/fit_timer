"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, Plus, X, Clock, Check, ChevronRight } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useRoutines } from '@/hooks/useRoutines';
import { translate, translateInstructions } from '@/utils/translate';

interface Exercise {
  id: string;
  name: string;
  category: string;
  body_part: string;
  equipment: string;
  gif_url: string;
}

// ... existing AddExerciseModal ...

// --- Internal Add Modal ---
function AddExerciseModal({ 
  exercise, 
  onClose, 
  onConfirm 
}: { 
  exercise: Exercise, 
  onClose: () => void, 
  onConfirm: (work: number, rest: number) => void 
}) {
    const [work, setWork] = useState(30);
    const [rest, setRest] = useState(10);

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-6"
            onClick={onClose}
        >
            <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Header with Visuals */}
                <div className="p-8 pb-4 flex flex-col items-center">
                    <div className="w-32 h-32 bg-slate-950 rounded-[2rem] overflow-hidden border border-white/5 mb-4 shadow-xl">
                        <img 
                            src={exercise.gif_url ? (exercise.gif_url.startsWith('/') ? exercise.gif_url : `/${exercise.gif_url}`) : ''} 
                            alt={exercise.name} 
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <h3 className="text-2xl font-black text-white text-center leading-tight">{exercise.name}</h3>
                    <div className="flex gap-2 mt-2">
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">{exercise.body_part}</span>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">{translate(exercise.equipment)}</span>
                    </div>
                </div>

                {/* Content: Time Pickers */}
                <div className="flex-1 overflow-y-auto px-8 py-8 no-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <div className="flex flex-col items-center gap-3 p-4 bg-slate-950/50 rounded-[2rem] border border-slate-800/50">
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">운동 시간</span>
                            <div className="flex items-center gap-4">
                                <button onClick={() => setWork(Math.max(5, work - 5))} className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-white">-</button>
                                <span className="text-2xl font-black text-white w-12 text-center tabular-nums">{work}s</span>
                                <button onClick={() => setWork(work + 5)} className="w-10 h-10 rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/20">+</button>
                            </div>
                        </div>

                        <div className="flex flex-col items-center gap-3 p-4 bg-slate-950/50 rounded-[2rem] border border-slate-800/50">
                            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">휴식 시간</span>
                            <div className="flex items-center gap-4">
                                <button onClick={() => setRest(Math.max(0, rest - 5))} className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-white">-</button>
                                <span className="text-2xl font-black text-white w-12 text-center tabular-nums">{rest}s</span>
                                <button onClick={() => setRest(rest + 5)} className="w-10 h-10 rounded-xl bg-amber-600 text-white shadow-lg shadow-amber-500/20">+</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-8 pt-4 flex gap-4 bg-slate-900/50 backdrop-blur-sm">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-4 bg-slate-950 border border-slate-800 text-slate-500 font-bold rounded-2xl hover:text-white transition-colors"
                    >
                        취소
                    </button>
                    <button 
                        onClick={() => onConfirm(work, rest)}
                        className="flex-1 py-4 bg-purple-600 text-white font-black rounded-2xl shadow-lg shadow-purple-500/20 hover:bg-purple-500 transition-all"
                    >
                        추가하기
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

export default function ExerciseSelection() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { getRoutine, updateRoutine, isLoaded } = useRoutines();
  
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('전체');
  const [selectingExercise, setSelectingExercise] = useState<Exercise | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [displayCount, setDisplayCount] = useState(100);

  const categoryGroups: { [key: string]: string[] } = {
    '상체': ['back', 'chest', 'lower arms', 'shoulders', 'upper arms', 'neck'],
    '하체': ['lower legs', 'upper legs'],
    '코어/복근': ['abs', 'waist'],
    '유산소': ['cardio']
  };

  const categories = useMemo(() => ['전체', ...Object.keys(categoryGroups)], []);

  useEffect(() => {
    const loadExercises = async () => {
      try {
        const res = await fetch('/data/exercises_ko.json?v=final');
        const data = await res.json();
        setAllExercises(data);
      } catch (err) {
        console.error('Failed to load exercises:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadExercises();
  }, []);

  // Reset display count when filter or search changes
  useEffect(() => {
    setDisplayCount(100);
  }, [filter, searchTerm]);

  const handleAddExercise = (ex: Exercise, work: number, rest: number) => {
    const routine = getRoutine(id);
    if (!routine) return;

    const newEntry = {
      id: Math.random().toString(36).substr(2, 9),
      exerciseId: ex.id,
      workTime: work,
      restTime: rest
    };

    const updated = {
      ...routine,
      exercises: [...routine.exercises, newEntry]
    };

    updateRoutine(updated);
    setSelectingExercise(null);
    router.push(`/routine/${id}`);
  };

  const filteredExercises = useMemo(() => {
    return allExercises.filter(ex => {
      const matchesSearch = ex.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (filter === '전체') return matchesSearch;
      
      const allowedCategories = categoryGroups[filter] || [];
      return matchesSearch && (allowedCategories.includes(ex.category) || allowedCategories.includes(ex.body_part));
    });
  }, [allExercises, filter, searchTerm]);

  if (!isLoaded) return null;

  return (
    <main className="max-w-4xl mx-auto min-h-screen flex flex-col px-4 md:px-6 py-6 pb-32 w-full">
      <header className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => router.push(`/routine/${id}`)}
          className="p-3 bg-slate-900 rounded-2xl border border-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-white leading-tight">운동 선택</h1>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
            총 {filteredExercises.length}개의 운동 {filter !== '전체' ? `(${filter})` : ''}
          </p>
        </div>
      </header>

      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-slate-600" />
        </div>
        <input 
          type="text"
          placeholder="운동 검색 (예: 푸쉬업, 스쿼트)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-900/50 border border-slate-800 rounded-[2rem] py-4 pl-14 pr-6 text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-medium"
        />
      </div>

      <div className="relative mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-6 py-2.5 rounded-2xl text-[13px] font-black whitespace-nowrap transition-all tracking-tight border-2 ${
                filter === cat 
                  ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-500/20' 
                  : 'bg-slate-900 text-slate-500 border-slate-800 hover:border-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-slate-950 to-transparent pointer-events-none" />
      </div>

      <div className="grid grid-cols-1 gap-2 w-full min-w-0">
        {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center">
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-10 h-10 border-2 border-slate-800 border-t-purple-500 rounded-full"
                />
            </div>
        ) : filteredExercises.length === 0 ? (
            <div className="py-20 text-center text-slate-600 border-2 border-dashed border-slate-800 rounded-[2rem]">
                <p className="font-bold">일치하는 운동이 없습니다</p>
            </div>
        ) : (
            <>
                {filteredExercises.slice(0, displayCount).map(ex => (
                    <motion.div
                      key={ex.id}
                      whileTap={{ scale: 0.98 }}
                      className="w-full min-w-0 bg-slate-900/40 backdrop-blur-sm border border-slate-800/50 p-2 md:p-2.5 rounded-3xl flex items-center gap-2 md:gap-3 cursor-pointer hover:border-purple-500/30 transition-all group"
                      onClick={() => setSelectingExercise(ex)}
                    >
                      <div className="relative w-16 h-16 rounded-2xl bg-slate-950 overflow-hidden border border-white/5 flex-shrink-0">
                        <img 
                            src={ex.gif_url ? (ex.gif_url.startsWith('/') ? ex.gif_url : `/${ex.gif_url}`) : ''} 
                            alt={ex.name} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            loading="lazy"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'https://www.svgrepo.com/show/532622/fitness-center.svg';
                                target.classList.add('opacity-20', 'p-3', 'invert');
                            }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white text-sm leading-snug mb-1 truncate">{ex.name}</h3>
                        <div className="flex flex-wrap gap-1.5">
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest bg-slate-950/50 px-2 py-0.5 rounded-md border border-slate-800 truncate max-w-[80px]">{ex.body_part}</span>
                            <span className="text-[8px] font-black text-purple-500/70 uppercase tracking-widest bg-purple-500/5 px-2 py-0.5 rounded-md border border-purple-500/10 truncate max-w-[80px]">{translate(ex.equipment)}</span>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-xl bg-slate-950 text-slate-700 flex items-center justify-center border border-slate-800 group-hover:text-purple-500 group-hover:border-purple-500/30 transition-all flex-shrink-0">
                        <Plus className="w-4 h-4" />
                      </div>
                    </motion.div>
                ))}

                {filteredExercises.length > displayCount && (
                    <button
                        onClick={() => setDisplayCount(prev => prev + 100)}
                        className="mt-6 py-4 w-full bg-slate-900 border border-slate-800 rounded-3xl text-sm font-black text-slate-400 hover:text-white hover:border-slate-600 transition-all uppercase tracking-widest mb-10"
                    >
                        더 보기 ({filteredExercises.length - displayCount}개 남음)
                    </button>
                )}
            </>
        )}
      </div>

      <AnimatePresence>
        {selectingExercise && (
            <AddExerciseModal 
                exercise={selectingExercise}
                onClose={() => setSelectingExercise(null)}
                onConfirm={(work, rest) => handleAddExercise(selectingExercise, work, rest)}
            />
        )}
      </AnimatePresence>
    </main>
  );
}
