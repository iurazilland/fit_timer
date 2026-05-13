"use client";

import React, { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Trash2, Edit2 } from 'lucide-react';

interface SwipeableCardProps {
  children: React.ReactNode;
  onDelete: () => void;
  onEdit?: () => void;
  id: string;
  dragHandleProps?: any;
  isDragging?: boolean;
}

export default function SwipeableCard({ children, onDelete, onEdit, id, dragHandleProps, isDragging }: SwipeableCardProps) {
  const x = useMotionValue(0);
  
  // 오른쪽으로 밀면(x > 0) 수정 버튼이, 왼쪽으로 밀면(x < 0) 삭제 버튼이 나타납니다.
  const deleteOpacity = useTransform(x, [-100, -20], [1, 0]);
  const deleteScale = useTransform(x, [-100, -20], [1, 0.5]);
  
  const editOpacity = useTransform(x, [20, 100], [0, 1]);
  const editScale = useTransform(x, [20, 100], [0.5, 1]);

  return (
    <div className="relative overflow-hidden rounded-[2rem] w-full group">
      {/* Background Edit Area (Left) */}
      <div className="absolute inset-y-0 left-0 w-24 flex items-center justify-center pl-4">
        <motion.button
          style={{ opacity: editOpacity, scale: editScale }}
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.();
            x.set(0);
          }}
          className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-blue-500/40 active:scale-90 transition-transform"
        >
          <Edit2 className="w-6 h-6" />
        </motion.button>
      </div>

      {/* Background Delete Area (Right) */}
      <div className="absolute inset-y-0 right-0 w-24 flex items-center justify-center pr-4">
        <motion.button
          style={{ opacity: deleteOpacity, scale: deleteScale }}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
            x.set(0);
          }}
          className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-red-500/40 active:scale-90 transition-transform"
        >
          <Trash2 className="w-6 h-6" />
        </motion.button>
      </div>

      {/* Foreground Card Content */}
      <motion.div
        drag={isDragging ? false : "x"}
        dragConstraints={{ left: -150, right: 150 }}
        dragElastic={0.2}
        style={{ x }}
        onDragEnd={() => {
            const currentX = x.get();
            if (currentX > 100) {
                onEdit?.();
            } else if (currentX < -100) {
                onDelete();
            }
            // 항상 제자리로 돌아옵니다.
            x.set(0);
        }}
        className="relative z-10 bg-slate-950 w-full cursor-grab active:cursor-grabbing"
      >
        {React.Children.map(children, child => {
            if (React.isValidElement(child)) {
                return React.cloneElement(child as React.ReactElement<any>, { dragHandleProps });
            }
            return child;
        })}
      </motion.div>
    </div>
  );
}
