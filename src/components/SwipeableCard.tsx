"use client";

import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
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
  const [isOpen, setIsOpen] = useState(false);
  
  // 버튼이 나타날 임계치 및 고정 거리
  const threshold = 50;
  const snapDistance = 80;

  // 오른쪽으로 밀면(x > 0) 수정 버튼이, 왼쪽으로 밀면(x < 0) 삭제 버튼이 나타납니다.
  const deleteOpacity = useTransform(x, [-snapDistance, -20], [1, 0]);
  const deleteScale = useTransform(x, [-snapDistance, -20], [1, 0.5]);
  
  const editOpacity = useTransform(x, [20, snapDistance], [0, 1]);
  const editScale = useTransform(x, [20, snapDistance], [0.5, 1]);

  const handleDragEnd = () => {
    const currentX = x.get();
    
    if (currentX > threshold) {
      // 오른쪽으로 충분히 밀었을 때: 수정 버튼 고정
      animate(x, snapDistance, { type: "spring", stiffness: 400, damping: 40 });
      setIsOpen(true);
    } else if (currentX < -threshold) {
      // 왼쪽으로 충분히 밀었을 때: 삭제 버튼 고정
      animate(x, -snapDistance, { type: "spring", stiffness: 400, damping: 40 });
      setIsOpen(true);
    } else {
      // 어중간하게 밀었을 때: 제자리로
      animate(x, 0, { type: "spring", stiffness: 400, damping: 40 });
      setIsOpen(false);
    }
  };

  const close = () => {
    animate(x, 0, { type: "spring", stiffness: 400, damping: 40 });
    setIsOpen(false);
  };

  return (
    <div className="relative overflow-hidden rounded-[2rem] w-full group bg-slate-950">
      {/* Background Edit Area (Left) */}
      <div className="absolute inset-y-0 left-0 w-24 flex items-center justify-start pl-4">
        <motion.button
          style={{ opacity: editOpacity, scale: editScale }}
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.();
            close();
          }}
          className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-blue-500/40 active:scale-90 transition-transform"
        >
          <Edit2 className="w-6 h-6" />
        </motion.button>
      </div>

      {/* Background Delete Area (Right) */}
      <div className="absolute inset-y-0 right-0 w-24 flex items-center justify-end pr-4">
        <motion.button
          style={{ opacity: deleteOpacity, scale: deleteScale }}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
            close();
          }}
          className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-red-500/40 active:scale-90 transition-transform"
        >
          <Trash2 className="w-6 h-6" />
        </motion.button>
      </div>

      {/* Foreground Card Content */}
      <motion.div
        drag={isDragging ? false : "x"}
        dragConstraints={{ left: -snapDistance - 20, right: snapDistance + 20 }}
        dragElastic={0.1}
        style={{ x }}
        onDragEnd={handleDragEnd}
        className="relative z-10 bg-slate-950 w-full min-w-0 cursor-grab active:cursor-grabbing"
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
