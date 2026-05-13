"use client";

import React, { useRef, useEffect, useState } from 'react';

interface TimePickerProps {
  value: number; // seconds
  onChange: (value: number) => void;
  label: string;
}

export default function TimePicker({ value, onChange, label }: TimePickerProps) {
  const mins = Math.floor(value / 60);
  const secs = value % 60;

  const handleMinChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(Number(e.target.value) * 60 + secs);
  };

  const handleSecChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(mins * 60 + Number(e.target.value));
  };

  // For a true iOS-style scroll, we'd need a more complex implementation.
  // For now, I'll use stylized selects that look premium.
  
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-slate-400">{label}</span>
      <div className="flex items-center gap-2 bg-slate-800/50 p-2 rounded-2xl border border-slate-700">
        <div className="flex-1 flex flex-col items-center">
            <select 
                value={mins} 
                onChange={handleMinChange}
                className="w-full bg-transparent text-center text-xl font-bold focus:outline-none appearance-none cursor-pointer"
            >
                {Array.from({ length: 60 }, (_, i) => (
                    <option key={i} value={i} className="bg-slate-900">{i}분</option>
                ))}
            </select>
        </div>
        <span className="text-slate-600 font-black">:</span>
        <div className="flex-1 flex flex-col items-center">
            <select 
                value={secs} 
                onChange={handleSecChange}
                className="w-full bg-transparent text-center text-xl font-bold focus:outline-none appearance-none cursor-pointer"
            >
                {Array.from({ length: 60 }, (_, i) => (
                    <option key={i} value={i} className="bg-slate-900">{i}초</option>
                ))}
            </select>
        </div>
      </div>
    </div>
  );
}
