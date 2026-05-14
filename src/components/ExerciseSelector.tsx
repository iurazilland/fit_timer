"use client";

import React, { useState, useEffect } from 'react';
import { Search, Plus, Check, X, ArrowUp, ArrowDown, Target, Zap, Circle, Dumbbell, Activity, Sparkles, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExerciseData } from '@/types';

interface ExerciseSelectorProps {
  onSelect: (exercise: ExerciseData) => void;
  selectedIds: string[];
  onClose: () => void;
}

export default function ExerciseSelector({ onSelect, selectedIds, onClose }: ExerciseSelectorProps) {
  const [exercises, setExercises] = useState<ExerciseData[]>([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    fetch('/data/exercises_all.json')
      .then(res => res.json())
      .then(data => setExercises(data));
  }, []);

  const categories = [
    { id: 'all', name: '전체', icon: <Dumbbell className="w-4 h-4" /> },
    { id: '가슴', name: '가슴', icon: <Circle className="w-4 h-4" /> },
    { id: '등', name: '등', icon: <Circle className="w-4 h-4" /> },
    { id: '어깨', name: '어깨', icon: <Circle className="w-4 h-4" /> },
    { id: '팔', name: '팔', icon: <Circle className="w-4 h-4" /> },
    { id: '하체', name: '하체', icon: <ArrowDown className="w-4 h-4" /> },
    { id: '코어', name: '코어', icon: <Target className="w-4 h-4" /> },
    { id: '유산소', name: '유산소', icon: <Zap className="w-4 h-4" /> },
    { id: '스트레칭', name: '스트레칭', icon: <Sparkles className="w-4 h-4" /> },
  ];

  const filteredExercises = exercises.filter(ex => {
    const matchesSearch = 
      (ex.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (ex.name_ko || '').toLowerCase().includes(search.toLowerCase()) ||
      (ex.body_part_ko || '').includes(search);

    if (!matchesSearch) return false;
    if (activeCategory === 'all') return true;
    
    if (activeCategory === '스트레칭') {
      return (ex.name || '').toLowerCase().includes('stretch') || 
             (ex.name_ko || '').includes('스트레칭');
    }
    
    return ex.body_part_ko === activeCategory;
  });

  const [showTopBtn, setShowTopBtn] = useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setShowTopBtn(e.currentTarget.scrollTop > 300);
  };

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col h-[90vh] bg-slate-950 rounded-t-[2.5rem] overflow-hidden border-t border-slate-800 relative">
      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showTopBtn && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            onClick={scrollToTop}
            className="absolute bottom-10 right-8 z-[100] w-12 h-12 bg-purple-600 text-white rounded-2xl shadow-2xl shadow-purple-500/40 flex items-center justify-center hover:bg-purple-500 transition-all active:scale-95"
          >
            <ChevronUp className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      <header className="p-6 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-white tracking-tight">운동 추가하기</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors group"
          >
            <X className="w-6 h-6 text-slate-500 group-hover:text-white" />
          </button>
        </div>
        
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="어떤 운동을 찾으시나요? (예: 스쿼트, 가슴)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all shadow-inner"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl border transition-all duration-300 ${
                activeCategory === cat.id
                  ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/30 scale-105'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              {cat.icon}
              <span className="text-sm font-bold whitespace-nowrap">{cat.name}</span>
            </button>
          ))}
        </div>
      </header>

      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-950 scroll-smooth"
      >
        <div className="grid gap-4">
          {filteredExercises.length > 0 ? (
            filteredExercises.map((ex) => {
              const isSelected = selectedIds.includes(ex.id);
              return (
                <motion.div
                  key={ex.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`group border rounded-[1.8rem] p-4 flex items-center gap-5 transition-all duration-300 cursor-pointer relative overflow-hidden ${
                    isSelected 
                      ? 'bg-purple-900/20 border-purple-500/50 ring-1 ring-purple-500/20' 
                      : 'bg-slate-900/40 border-slate-800 hover:border-purple-500/40 hover:bg-slate-900/60'
                  }`}
                  onClick={() => onSelect(ex)}
                >
                  <div className="w-24 h-24 bg-white rounded-2xl overflow-hidden flex-shrink-0 border border-white/5 relative">
                    <img 
                      src={ex.gif_url ? (ex.gif_url.startsWith('/') ? ex.gif_url : `/${ex.gif_url}`) : ''} 
                      alt={ex.name} 
                      className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 to-transparent pointer-events-none"></div>
                  </div>
                  
                  <div className="flex-1 min-w-0 pr-12">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2.5 py-1 bg-purple-500/10 border border-purple-500/20 rounded-lg text-[10px] font-black text-purple-400 uppercase tracking-widest">
                            {ex.body_part_ko || '기타'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                            {ex.equipment}
                        </span>
                    </div>
                    <h3 className="text-white font-bold text-xl leading-tight truncate group-hover:text-purple-400 transition-colors capitalize">
                        {ex.name}
                    </h3>
                  </div>

                  <div className={`absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${
                    isSelected 
                      ? 'bg-purple-600 rotate-0 scale-100 shadow-lg shadow-purple-500/40' 
                      : 'bg-slate-800 group-hover:bg-purple-600 group-hover:scale-110'
                  }`}>
                    {isSelected ? (
                      <Check className="w-6 h-6 text-white" />
                    ) : (
                      <Plus className="w-6 h-6 text-slate-500 group-hover:text-white" />
                    )}
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-600">
              <Search className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-lg font-medium">검색 결과가 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
