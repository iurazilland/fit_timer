"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, SkipForward, Check, X, Music } from 'lucide-react';
import { TimerStatus } from '@/hooks/useTimer';

interface TimerDisplayProps {
  status: TimerStatus;
  timeLeft: number;
  totalTimeForStep: number;
  currentRound: number;
  totalRounds: number;
  currentExercise?: any;
  nextExercise?: any;
  onToggle: () => void;
  onReset: () => void;
  onRestartStep: () => void;
  onNextStep?: () => void;
  onPrevStep?: () => void;
  isMusicMuted?: boolean;
  onToggleMusic?: () => void;
}

export default function TimerDisplay({
  status,
  timeLeft,
  totalTimeForStep,
  currentRound,
  totalRounds,
  currentExercise,
  nextExercise,
  onToggle,
  onReset,
  onRestartStep,
  onNextStep,
  onPrevStep,
  isMusicMuted,
  onToggleMusic
}: TimerDisplayProps) {
  const isWorking = status === 'working';
  const isResting = status === 'resting';
  const isPreparing = status === 'preparing';
  const isFinished = status === 'finished';

  const activeExercise = (isResting || isPreparing) ? nextExercise : currentExercise;
  const displayExercise = isResting ? nextExercise : currentExercise;
  const progress = (timeLeft / totalTimeForStep) * 100;

  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-hidden relative">
      {/* Top Left Exit Button */}
      <button 
        onClick={onReset}
        className="absolute top-6 left-6 z-[110] w-10 h-10 bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-all"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Center Round Indicator */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[110] px-5 h-10 bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-full flex items-center justify-center text-white/90 shadow-lg shadow-black/20">
        <span className="text-[10px] font-black tracking-[0.2em] uppercase">
            ROUND <span className="text-white ml-1.5">{currentRound}</span> / {totalRounds}
        </span>
      </div>

      {/* Top Right Music Toggle */}
      <button 
        onClick={onToggleMusic}
        className={`absolute top-6 right-6 z-[110] w-10 h-10 backdrop-blur-md border rounded-full flex items-center justify-center transition-all ${
            isMusicMuted 
            ? 'bg-slate-950/50 border-slate-800 text-slate-700' 
            : 'bg-purple-600/20 border-purple-500/30 text-purple-400 shadow-lg shadow-purple-500/10'
        }`}
      >
        <Music className={`w-5 h-5 ${isMusicMuted ? 'opacity-20' : 'opacity-100'}`} />
      </button>

      <AnimatePresence mode="wait">
        {!isFinished ? (
          <motion.div 
            key="active-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col"
          >
            {/* Top Area: Image */}
            <div className="relative h-[55vh] w-full bg-slate-900 flex items-center justify-center overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={(displayExercise?.id || 'none') + status}
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.5 }}
                        className="w-full h-full"
                    >
                        {displayExercise ? (
                            <img 
                                src={displayExercise.gif_url ? (displayExercise.gif_url.startsWith('/') ? displayExercise.gif_url : `/${displayExercise.gif_url}`) : ''} 
                                alt="" 
                                className={`w-full h-full object-contain ${(isResting || isPreparing) ? 'opacity-30 blur-sm grayscale' : 'opacity-100'}`} 
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-800">
                                <Check className="w-20 h-20" />
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Status Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
                

                {/* Pop Countdown Effect */}
                <AnimatePresence>
                    {timeLeft <= 5 && timeLeft > 0 && (
                        <motion.div
                            key={timeLeft}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 2, opacity: 1 }}
                            exit={{ scale: 3, opacity: 0 }}
                            className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
                        >
                            <div className="w-32 h-32 bg-slate-950/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 shadow-2xl">
                                <span className="font-black text-8xl text-white tabular-nums leading-none">
                                    {timeLeft}
                                </span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom Area: Controls & Info */}
            <div className="flex-1 bg-slate-950 px-8 py-6 flex flex-col justify-between">
                <div>
                    <h2 className="text-3xl font-black text-white mb-2 leading-tight">
                        {isWorking ? currentExercise?.name : (isPreparing ? `곧 시작: ${currentExercise?.name}` : (nextExercise ? `다음: ${nextExercise.name}` : '마지막 운동입니다!'))}
                    </h2>
                </div>

                {/* Progress Bar Area */}
                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <span className="text-7xl font-black text-white tabular-nums tracking-tighter">
                            {timeLeft}<span className="text-xl text-slate-600 ml-1">S</span>
                        </span>
                        <span className="text-slate-500 font-black tracking-widest text-sm">
                            {isWorking ? 'WORK PHASE' : isPreparing ? 'PREPARATION' : 'REST PHASE'}
                        </span>
                    </div>

                    <div className="h-4 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                        <motion.div 
                            initial={{ width: '100%' }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1, ease: "linear" }}
                            className={`h-full rounded-full ${
                                isWorking ? 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 
                                isPreparing ? 'bg-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]' :
                                'bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                            }`}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between gap-4 mt-2">
                    <button 
                        onClick={onPrevStep}
                        className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-slate-500 hover:text-white transition-all active:scale-95"
                    >
                        <SkipForward className="w-5 h-5 mb-1 rotate-180" />
                        <span className="text-[10px] font-bold">PREV</span>
                    </button>
                    
                    <button 
                        onClick={onToggle}
                        className={`flex-1 h-16 rounded-2xl flex items-center justify-center gap-3 font-black text-lg transition-all active:scale-95 ${
                        status === 'paused' 
                            ? 'bg-purple-600 text-white shadow-xl shadow-purple-500/20' 
                            : 'bg-slate-900 border border-slate-800 text-white'
                        }`}
                    >
                        {status === 'paused' ? (
                            <>
                                <Play className="w-6 h-6 fill-white" />
                                RESUME
                            </>
                        ) : (
                            <>
                                <Pause className="w-6 h-6 fill-white" />
                                PAUSE
                            </>
                        )}
                    </button>

                    <button 
                        onClick={onNextStep}
                        className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-slate-500 hover:text-white transition-all active:scale-95"
                    >
                        <SkipForward className="w-5 h-5 mb-1" />
                        <span className="text-[10px] font-bold">NEXT</span>
                    </button>
                </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="finished"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center h-full p-8"
          >
            <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-emerald-500/30">
              <Check className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-5xl font-black text-white mb-4">AWESOME!</h2>
            <p className="text-slate-400 text-lg mb-12">오늘의 루틴을 모두 완료했습니다.</p>
            <button 
              onClick={onReset}
              className="w-full max-w-xs py-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black rounded-2xl shadow-2xl shadow-purple-500/30 hover:scale-[1.02] active:scale-95 transition-all"
            >
              홈으로 돌아가기
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
