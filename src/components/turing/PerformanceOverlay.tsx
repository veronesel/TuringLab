import React from 'react';
import { useTMStore } from '../../store/tmStore';
import { Activity } from 'lucide-react';
import { motion } from 'motion/react';

export const PerformanceOverlay: React.FC = () => {
  const stepCount = useTMStore(state => state.stepCount);
  const statistics = useTMStore(state => state.statistics);
  
  const totalTapeShifts = statistics.tapeMovements.R + statistics.tapeMovements.L;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="absolute bottom-6 left-6 z-50 pointer-events-none"
    >
      <div className="bg-bg-panel/80 backdrop-blur border border-border-main rounded-lg shadow-lg p-3 flex items-center gap-4">
        <div className="flex items-center gap-2 text-primary-base">
          <Activity size={16} />
        </div>
        <div className="flex gap-4">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-widest text-text-muted font-bold">Transitions</span>
            <span className="text-sm font-mono text-text-primary">{stepCount}</span>
          </div>
          <div className="w-px h-6 bg-border-main self-center" />
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-widest text-text-muted font-bold">Tape Shifts</span>
            <span className="text-sm font-mono text-text-primary">{totalTapeShifts}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
