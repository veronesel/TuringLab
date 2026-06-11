import React from 'react';
import { Handle, Position } from '@xyflow/react';

export default function SmartNode({ data, selected }: any) {
  // Using 4 pairs of handles (source and target) so users can easily drag from any side
  // The SmartEdge will still calculate the exact visual path based on node centers!
  return (
    <div style={data.style} className={`relative group ${data.className || ''} ${selected ? 'ring-2 ring-[var(--color-primary-base)] ring-offset-2 ring-offset-[var(--color-bg-base)]' : ''}`}>
      <Handle type="target" position={Position.Top} id="t-top" className="opacity-0 group-hover:opacity-100 transition-opacity w-2 h-2 !bg-[var(--color-primary-base)]" />
      <Handle type="source" position={Position.Top} id="s-top" className="opacity-0 group-hover:opacity-100 transition-opacity w-2 h-2 !bg-[var(--color-primary-base)]" />
      
      <Handle type="target" position={Position.Bottom} id="t-bottom" className="opacity-0 group-hover:opacity-100 transition-opacity w-2 h-2 !bg-[var(--color-primary-base)]" />
      <Handle type="source" position={Position.Bottom} id="s-bottom" className="opacity-0 group-hover:opacity-100 transition-opacity w-2 h-2 !bg-[var(--color-primary-base)]" />
      
      <Handle type="target" position={Position.Left} id="t-left" className="opacity-0 group-hover:opacity-100 transition-opacity w-2 h-2 !bg-[var(--color-primary-base)]" />
      <Handle type="source" position={Position.Left} id="s-left" className="opacity-0 group-hover:opacity-100 transition-opacity w-2 h-2 !bg-[var(--color-primary-base)]" />
      
      <Handle type="target" position={Position.Right} id="t-right" className="opacity-0 group-hover:opacity-100 transition-opacity w-2 h-2 !bg-[var(--color-primary-base)]" />
      <Handle type="source" position={Position.Right} id="s-right" className="opacity-0 group-hover:opacity-100 transition-opacity w-2 h-2 !bg-[var(--color-primary-base)]" />
      
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-center nodrag">
        {data.label}
      </div>
    </div>
  );
}

