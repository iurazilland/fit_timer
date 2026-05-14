"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Play, Trash2, Clock, Dumbbell, ChevronRight, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRoutines } from '@/hooks/useRoutines';
import SwipeableCard from '@/components/SwipeableCard';

export default function Home() {
  const router = useRouter();
  const { routines, isLoaded, addRoutine, deleteRoutine } = useRoutines();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRoutineName, setNewRoutineName] = useState('');

  const handleCreateRoutine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoutineName.trim()) return;
    
    const id = addRoutine(newRoutineName);
    setIsModalOpen(false);
    setNewRoutineName('');
    router.push(`/routine/${id}`);
  };

  const calculateTotalTime = (routine: any) => {
    const totalSeconds = routine.exercises.reduce((acc: number, ex: any) => acc + ex.workTime + ex.restTime, 0);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}분 ${secs}초`;
  };

  if (!isLoaded) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">Loading...</div>;

  return (
    <main className="max-w-xl mx-auto min-h-screen flex flex-col px-3 md:px-6 py-6">
      <header className="py-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-white">HOMEFIT <span className="text-purple-500">TIMER</span></h1>
          <p className="text-slate-500 text-sm font-medium mt-1">나만의 루틴으로 건강을 관리하세요</p>
        </div>
        <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-800">
          <Dumbbell className="w-6 h-6 text-purple-500" />
        </div>
      </header>

      <section className="flex-1">
        <h2 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-purple-500 rounded-full"></span>
            나의 루틴 목록
        </h2>

        <div className="grid gap-4">
          {routines.length === 0 ? (
            <motion.button
              onClick={() => setIsModalOpen(true)}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group h-64 border-2 border-dashed border-slate-800 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all"
            >
              <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-8 h-8 text-slate-500 group-hover:text-purple-500" />
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-slate-400 group-hover:text-white">첫 번째 루틴을 만들어보세요</p>
                <p className="text-sm text-slate-600 mt-1">운동을 조합하여 최적의 인터벌을 설정할 수 있습니다</p>
              </div>
            </motion.button>
          ) : (
            <>
              {routines.map((routine) => (
                <SwipeableCard
                    key={routine.id}
                    id={routine.id}
                    onDelete={() => deleteRoutine(routine.id)}
                >
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-6 rounded-[2rem] hover:border-slate-700 transition-all cursor-pointer group relative overflow-hidden"
                    onClick={() => router.push(`/routine/${routine.id}`)}
                  >
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform">
                          <Play className="w-6 h-6 text-white fill-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">{routine.name}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="flex items-center gap-1 text-xs font-medium text-slate-400 bg-slate-800 px-2 py-1 rounded-lg">
                              <Clock className="w-3 h-3" /> {calculateTotalTime(routine)}
                            </span>
                            <span className="flex items-center gap-1 text-xs font-medium text-slate-400 bg-slate-800 px-2 py-1 rounded-lg">
                              <Dumbbell className="w-3 h-3" /> {routine.exercises.length}개 운동
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                          <ChevronRight className="w-6 h-6 text-slate-700 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                    
                    {/* Decorative Background */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-purple-500/10 transition-colors"></div>
                  </motion.div>
                </SwipeableCard>
              ))}
              
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full py-6 border-2 border-dashed border-slate-800 rounded-[2rem] flex items-center justify-center gap-3 text-slate-500 hover:text-purple-500 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all mt-4"
              >
                <Plus className="w-5 h-5" />
                <span className="font-bold">새 루틴 추가하기</span>
              </button>
            </>
          )}
        </div>
      </section>

      {/* Routine Creation Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            ></motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl p-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">새 루틴 생성</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-500 hover:bg-slate-800 rounded-full">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleCreateRoutine}>
                <div className="mb-8">
                  <label className="block text-sm font-medium text-slate-400 mb-2 ml-1">루틴 이름</label>
                  <input
                    autoFocus
                    type="text"
                    value={newRoutineName}
                    onChange={(e) => setNewRoutineName(e.target.value)}
                    placeholder="예: 아침 전신 유산소"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white placeholder:text-slate-700 focus:outline-none focus:border-purple-500 transition-colors text-lg"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={!newRoutineName.trim()}
                  className="w-full py-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-purple-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                >
                  루틴 만들기
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
