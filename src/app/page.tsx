"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Play, Trash2, Clock, Dumbbell, ChevronRight, ChevronLeft, X, Sparkles, Flame, Zap, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRoutines } from '@/hooks/useRoutines';
import SwipeableCard from '@/components/SwipeableCard';

export default function Home() {
  const router = useRouter();
  const { routines, isLoaded, addRoutine, deleteRoutine } = useRoutines();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRoutineName, setNewRoutineName] = useState('');
  const [recommendedRoutines, setRecommendedRoutines] = useState<any[]>([]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState<Record<string, { totalSeconds: number, count: number }>>({});

  const loadAttendance = () => {
    try {
      const stored = localStorage.getItem('homefit_attendance');
      if (stored) {
        setAttendanceData(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Failed to load attendance:', err);
    }
  };

  React.useEffect(() => {
    loadAttendance();
    const handleUpdate = () => loadAttendance();
    window.addEventListener('attendance_updated', handleUpdate);
    return () => window.removeEventListener('attendance_updated', handleUpdate);
  }, []);

  const calendarDays = React.useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ day: i, dateStr: dayStr });
    }
    return days;
  }, [currentMonth]);

  const monthlySummary = React.useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    
    let totalSecs = 0;
    let daysCount = 0;
    
    Object.entries(attendanceData).forEach(([dateStr, data]) => {
      if (dateStr.startsWith(prefix)) {
        totalSecs += data.totalSeconds;
        daysCount += 1;
      }
    });
    
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    
    return { hours, mins, daysCount };
  }, [currentMonth, attendanceData]);


  const handleCreateRoutine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoutineName.trim()) return;
    
    const id = addRoutine(newRoutineName);
    setIsModalOpen(false);
    setNewRoutineName('');
    router.push(`/routine/${id}`);
  };

  const calculateTotalTime = (routine: any) => {
    const sumWork = routine.exercises.reduce((acc: number, ex: any) => acc + (ex.workTime || 30), 0);
    const sumRestExceptLast = routine.exercises.length > 1 
      ? routine.exercises.slice(0, -1).reduce((acc: number, ex: any) => acc + (ex.restTime || 10), 0)
      : 0;
    const lastRest = routine.exercises.length > 0 ? (routine.exercises[routine.exercises.length - 1].restTime || 10) : 0;
    const roundRest = routine.roundRest ?? 0;
    const rounds = routine.rounds || 1;
    
    const effectiveRoundEndRest = roundRest > 0 ? roundRest : lastRest;
    const totalSeconds = (sumWork + sumRestExceptLast + effectiveRoundEndRest) * (rounds - 1) + (sumWork + sumRestExceptLast);
    
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}분 ${secs}초`;
  };

  React.useEffect(() => {
    fetch('/data/default_routines.json')
      .then(res => res.json())
      .then(data => setRecommendedRoutines(data))
      .catch(err => console.error('Failed to load recommended routines:', err));
  }, []);

  if (!isLoaded) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">Loading...</div>;

  return (
    <main className="w-full min-h-screen bg-slate-950 flex flex-col items-center">
      <div className="w-full max-w-4xl flex flex-col min-h-screen px-4 md:px-6 py-6">
      <header className="py-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-white">HOMEFIT <span className="text-purple-500">TIMER</span></h1>
          <p className="text-slate-500 text-sm font-medium mt-1">나만의 루틴으로 건강을 관리하세요</p>
        </div>
        <button 
          onClick={() => setIsCalendarOpen(true)}
          className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 hover:text-white hover:border-purple-500/50 transition-all flex items-center gap-2 shadow-lg shadow-black/20 group"
        >
          <Calendar className="w-6 h-6 text-purple-500 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold hidden sm:inline text-slate-300 group-hover:text-white">출석 캘린더</span>
        </button>
      </header>

      <section className="mb-12">
        <h2 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
            추천 루틴 프로그램
        </h2>
        <div className="grid gap-4">
          {recommendedRoutines.map((routine) => (
            <motion.div
              key={routine.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-6 rounded-[2rem] transition-all cursor-pointer group relative overflow-hidden ${
                routine.id === 'p-stretching' ? 'hover:border-emerald-500/30 shadow-emerald-500/5' :
                routine.id === 'p-foundation' ? 'hover:border-blue-500/30 shadow-blue-500/5' :
                routine.id === 'p-cardio' ? 'hover:border-orange-500/30 shadow-orange-500/5' :
                'hover:border-purple-500/30 shadow-purple-500/5'
              } hover:shadow-2xl`}
              onClick={() => router.push(`/routine/${routine.id}`)}
            >
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                  {/* Icon Box with Dynamic Color Handling */}
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${
                    routine.id === 'p-stretching' ? 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-emerald-500/20' :
                    routine.id === 'p-foundation' ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/20' :
                    routine.id === 'p-cardio' ? 'bg-gradient-to-br from-orange-400 to-red-500 shadow-orange-500/20' :
                    'bg-gradient-to-br from-purple-600 to-slate-900 shadow-purple-500/20'
                  }`}>
                    {routine.icon === 'Sparkles' && <Sparkles className="w-6 h-6 text-white fill-white" />}
                    {routine.icon === 'Dumbbell' && <Dumbbell className="w-6 h-6 text-white" />}
                    {routine.icon === 'Flame' && <Flame className="w-6 h-6 text-white fill-white" />}
                    {routine.icon === 'Zap' && <Zap className="w-6 h-6 text-white fill-white" />}
                    {!routine.icon && <Play className="w-6 h-6 text-white fill-white" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className={`text-xl font-bold text-white transition-colors ${
                        routine.id === 'p-stretching' ? 'group-hover:text-emerald-400' :
                        routine.id === 'p-foundation' ? 'group-hover:text-blue-400' :
                        routine.id === 'p-cardio' ? 'group-hover:text-orange-400' :
                        'group-hover:text-purple-400'
                      }`}>{routine.title}</h3>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs font-medium text-slate-400 bg-slate-800 px-2 py-1 rounded-lg">
                        <Clock className="w-3 h-3" /> 
                        {(() => {
                          const sumWork = routine.exercises.reduce((acc: number, ex: any) => acc + (ex.workTime || 30), 0);
                          const sumRestExceptLast = routine.exercises.length > 1 
                            ? routine.exercises.slice(0, -1).reduce((acc: number, ex: any) => acc + (ex.restTime || 10), 0)
                            : 0;
                          const lastRest = routine.exercises.length > 0 ? (routine.exercises[routine.exercises.length - 1].restTime || 10) : 0;
                          const roundRest = routine.roundRest ?? 0;
                          const rounds = routine.rounds || 1;
                          
                          const effectiveRoundEndRest = roundRest > 0 ? roundRest : lastRest;
                          const totalSeconds = (sumWork + sumRestExceptLast + effectiveRoundEndRest) * (rounds - 1) + (sumWork + sumRestExceptLast);
                            
                          return `${Math.floor(totalSeconds / 60)}분 ${totalSeconds % 60}초`;
                        })()}
                      </span>
                      <span className="flex items-center gap-1 text-xs font-medium text-slate-400 bg-slate-800 px-2 py-1 rounded-lg">
                        <Dumbbell className="w-3 h-3" /> {routine.exercises.length}개 운동
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                    <ChevronRight className="w-6 h-6 text-slate-700 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
              
              {/* Decorative Background */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-colors"></div>
            </motion.div>
          ))}
        </div>
      </section>

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

        {/* Attendance Calendar Modal */}
        {isCalendarOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCalendarOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            ></motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl p-6 md:p-8 overflow-hidden"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-center text-purple-500 shadow-inner">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">운동 출석부</h3>
                    <p className="text-xs text-slate-400 mt-0.5">나의 꾸준한 운동 기록을 확인하세요</p>
                  </div>
                </div>
                <button onClick={() => setIsCalendarOpen(false)} className="p-2 text-slate-500 hover:bg-slate-800 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Month Navigation */}
              <div className="flex items-center justify-between bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4 mb-6">
                <button 
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                  className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-lg font-black text-white tracking-tight">
                  {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
                </span>
                <button 
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                  className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Monthly Summary Cards */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-4 flex flex-col items-center justify-center">
                  <span className="text-xs font-bold text-slate-500 mb-1">이번 달 출석 일수</span>
                  <span className="text-2xl font-black text-white tabular-nums">{monthlySummary.daysCount}<span className="text-sm text-purple-400 ml-1 font-bold">일</span></span>
                </div>
                <div className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-4 flex flex-col items-center justify-center">
                  <span className="text-xs font-bold text-slate-500 mb-1">이번 달 누적 시간</span>
                  <span className="text-2xl font-black text-white tabular-nums">
                    {monthlySummary.hours > 0 ? `${monthlySummary.hours}h ` : ''}{monthlySummary.mins}<span className="text-sm text-emerald-400 ml-1 font-bold">m</span>
                  </span>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
                <div className="grid grid-cols-7 gap-1 mb-2 text-center">
                  {['일', '월', '화', '수', '목', '금', '토'].map((d, idx) => (
                    <span key={d} className={`text-xs font-bold py-1 ${idx === 0 ? 'text-red-400/80' : idx === 6 ? 'text-blue-400/80' : 'text-slate-500'}`}>
                      {d}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1.5 text-center">
                  {calendarDays.map((item, idx) => {
                    if (!item) return <div key={`empty-${idx}`} className="h-14"></div>;
                    const record = attendanceData[item.dateStr];
                    const hasAttended = !!record;
                    const durationMins = hasAttended ? Math.round(record.totalSeconds / 60) : 0;
                    
                    return (
                      <div 
                        key={item.dateStr}
                        className={`h-14 rounded-xl flex flex-col items-center justify-center border transition-all ${
                          hasAttended 
                            ? 'bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border-purple-500/40 text-white shadow-lg shadow-purple-500/10' 
                            : 'bg-slate-900/30 border-slate-800/40 text-slate-600'
                        }`}
                      >
                        <span className={`text-xs font-black ${hasAttended ? 'text-white' : 'text-slate-500'}`}>
                          {item.day}
                        </span>
                        {hasAttended && (
                          <span className="text-[10px] font-black text-purple-300 mt-0.5 bg-purple-500/30 px-1 rounded border border-purple-400/20">
                            {durationMins}m
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
    </main>
  );
}
