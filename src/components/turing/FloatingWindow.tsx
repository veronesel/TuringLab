import React, { useState, useRef, useEffect } from 'react';
import { motion, useDragControls } from 'motion/react';
import { Maximize2, Minimize2, X } from 'lucide-react';

interface FloatingWindowProps {
  id: string;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  defaultPosition?: { x: number, y: number };
  defaultSize?: { width: number, height: number };
  icon?: React.ReactNode;
}

export function FloatingWindow({ id, title, children, onClose, defaultPosition = {x: 50, y: 50}, defaultSize = {width: 400, height: 300}, icon }: FloatingWindowProps) {
  const [isMaximized, setIsMaximized] = useState(false);
  const dragControls = useDragControls();

  return (
    <motion.div
      drag={!isMaximized}
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      initial={{ x: defaultPosition.x, y: defaultPosition.y, width: defaultSize.width, height: defaultSize.height, opacity: 0, scale: 0.95 }}
      animate={
        isMaximized 
        ? { x: 0, y: 0, width: '100vw', height: '100vh', borderRadius: 0, opacity: 1, scale: 1 } 
        : { opacity: 1, scale: 1, borderRadius: 8 }
      }
      style={{
        position: 'fixed',
        zIndex: 100,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px var(--color-border-main)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        ...(isMaximized ? { top: 0, left: 0 } : {})
      }}
      className="bg-bg-panel text-text-primary backdrop-blur-md"
    >
      <div 
        className="flex items-center justify-between px-3 py-2 bg-bg-surface border-b border-border-main cursor-grab active:cursor-grabbing select-none"
        onPointerDown={(e) => dragControls.start(e)}
      >
        <div className="flex items-center gap-2 font-mono text-[11px] font-bold text-text-secondary uppercase tracking-wider">
          {icon}
          {title}
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsMaximized(!isMaximized)}
            className="text-text-muted hover:text-text-primary transition-colors"
            title={isMaximized ? "Restore" : "Maximize"}
          >
            {isMaximized ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          </button>
          <button 
            onClick={onClose}
            className="text-text-muted hover:text-red-400 transition-colors"
            title="Attach to workspace"
          >
             <X size={14} />
          </button>
        </div>
      </div>
      <div className="flex-1 w-full h-full relative overflow-auto bg-bg-base pointer-events-auto" onPointerDownCapture={(e) => e.stopPropagation()}>
         {children}
      </div>
    </motion.div>
  );
}
