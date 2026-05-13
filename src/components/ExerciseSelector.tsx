"use client";

import React, { useState, useEffect } from 'react';
import { Search, Plus, Check, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Exercise {
  id: string;
  name: string;
  description: string;
  imagePath: string;
  category: string;
}

interface ExerciseSelectorProps {
  onSelect: (exercise: Exercise) => void;
  selectedIds: string[];
}

export default function ExerciseSelector({ onSelect, selectedIds }: ExerciseSelectorProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('전체');

  useEffect(() => {
    fetch('/data/exercises.json')
      .then(res => res.json())
      .then(data => setExercises(data));
  }, []);

  const filteredExercises = exercises.filter(ex => 
    (filter === '전체' || ex.category === filter) &&
    ex.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = ['전체', '상체', '하체', '코어', '전신'];

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 h-full flex flex-col">
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
          <input 
            type="text" 
            placeholder="운동 검색..."
            className="w-full bg-slate-800 border-none rounded-2xl py-3 pl-12 pr-4 text-slate-200 focus:ring-2 focus:ring-purple-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${
              filter === cat 
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' 
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto grid grid-cols-1 gap-3 pr-2 scrollbar-thin scrollbar-thumb-slate-800">
        {filteredExercises.map(ex => {
          const isSelected = selectedIds.includes(ex.id);
          return (
            <motion.div
              layout
              key={ex.id}
              className={`group relative p-4 rounded-2xl border transition-all cursor-pointer ${
                isSelected 
                  ? 'bg-purple-900/20 border-purple-500/50' 
                  : 'bg-slate-800/40 border-slate-700 hover:border-slate-500'
              }`}
              onClick={() => onSelect(ex)}
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-slate-700 overflow-hidden">
                  <img src={ex.imagePath} alt={ex.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-100">{ex.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-1">{ex.category}</p>
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  isSelected ? 'bg-purple-600' : 'bg-slate-700 group-hover:bg-slate-600'
                }`}>
                  {isSelected ? <Check className="w-5 h-5 text-white" /> : <Plus className="w-5 h-5 text-slate-400" />}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
