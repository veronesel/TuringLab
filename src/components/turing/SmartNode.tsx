import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { motion } from 'motion/react';

export default function SmartNode({ data, selected, dragging }: any) {
  // Using 4 pairs of handles (source and target) so users can easily drag from any side
  // The SmartEdge will still calculate the exact visual path based on node centers!
  return (
    <motion.div 
      style={data.style} 
      animate={{
        scale: dragging ? 1.15 : (data.isActive ? 1.08 : 1),
        boxShadow: dragging ? '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 20px var(--color-primary-base)' : 'none',
        zIndex: dragging ? 100 : (data.isActive ? 10 : 1)
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25
      }}
      className={`relative group ${data.className || ''} ${selected ? 'ring-2 ring-[var(--color-primary-base)] ring-offset-2 ring-offset-[var(--color-bg-base)]' : ''}`}
    >
      {/* Outer pulsating aura for active state */}
      {data.isActive && (
        <motion.div
          className="absolute inset-x-0 inset-y-0 pointer-events-none z-0"
          style={{
            borderRadius: data.style?.borderRadius || '12px',
            border: '2px solid var(--color-primary-base)',
            boxShadow: '0 0 15px var(--color-primary-base)',
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.6, 0.2, 0.6],
          }}
          transition={{
            duration: 1.6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      <Handle type="target" position={Position.Top} id="t-top" className="opacity-0 group-hover:opacity-100 transition-opacity w-2 h-2 !bg-[var(--color-primary-base)]" />
      <Handle type="source" position={Position.Top} id="s-top" className="opacity-0 group-hover:opacity-100 transition-opacity w-2 h-2 !bg-[var(--color-primary-base)]" />
      
      <Handle type="target" position={Position.Bottom} id="t-bottom" className="opacity-0 group-hover:opacity-100 transition-opacity w-2 h-2 !bg-[var(--color-primary-base)]" />
      <Handle type="source" position={Position.Bottom} id="s-bottom" className="opacity-0 group-hover:opacity-100 transition-opacity w-2 h-2 !bg-[var(--color-primary-base)]" />
      
      <Handle type="target" position={Position.Left} id="t-left" className="opacity-0 group-hover:opacity-100 transition-opacity w-2 h-2 !bg-[var(--color-primary-base)]" />
      <Handle type="source" position={Position.Left} id="s-left" className="opacity-0 group-hover:opacity-100 transition-opacity w-2 h-2 !bg-[var(--color-primary-base)]" />
      
      <Handle type="target" position={Position.Right} id="t-right" className="opacity-0 group-hover:opacity-100 transition-opacity w-2 h-2 !bg-[var(--color-primary-base)]" />
      <Handle type="source" position={Position.Right} id="s-right" className="opacity-0 group-hover:opacity-100 transition-opacity w-2 h-2 !bg-[var(--color-primary-base)]" />
      
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-center nodrag z-10">
        {data.label}
      </div>
    </motion.div>
  );
}


