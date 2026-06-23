import React from 'react';
import { BaseEdge, EdgeLabelRenderer, EdgeProps, getBezierPath, useInternalNode } from '@xyflow/react';
import { getEdgeParams } from './smartEdgeUtils';

export default function SmartEdge({
  id,
  source,
  target,
  markerEnd,
  style,
  animated,
  label,
  labelStyle,
  labelBgStyle,
}: EdgeProps) {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);

  if (!sourceNode || !targetNode) {
    return null;
  }

  const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(sourceNode, targetNode);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX: sx,
    sourceY: sy,
    sourcePosition: sourcePos,
    targetPosition: targetPos,
    targetX: tx,
    targetY: ty,
  });

  return (
    <>
      {animated && (
        <>
          <BaseEdge 
            path={edgePath} 
            style={{ stroke: 'var(--color-primary-base)', strokeWidth: 8, strokeOpacity: 0.3, filter: 'blur(3px)' }} 
            className="react-flow__edge-path"
          />
          <circle r="4" fill="var(--color-primary-base)" style={{ filter: 'drop-shadow(0 0 3px var(--color-primary-base))' }}>
            <animateMotion dur="0.8s" repeatCount="indefinite" path={edgePath} />
          </circle>
        </>
      )}
      <BaseEdge 
         path={edgePath} 
         markerEnd={markerEnd} 
         style={{
            ...style,
            strokeDasharray: animated ? 5 : 0,
            animation: animated ? 'dashdraw 0.5s linear infinite' : 'none'
         }} 
         className='react-flow__edge-path' 
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            key={id}
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              background: labelBgStyle?.fill ? String(labelBgStyle.fill) : 'var(--color-bg-surface)',
              opacity: labelStyle?.opacity !== undefined ? Number(labelStyle.opacity) : (labelBgStyle?.fillOpacity !== undefined ? Number(labelBgStyle.fillOpacity) : 0.8),
              padding: '2px 4px',
              borderRadius: 4,
              fontSize: labelStyle?.fontSize || 10,
              fontFamily: labelStyle?.fontFamily || 'monospace',
              fontWeight: labelStyle?.fontWeight || 'normal',
              color: labelStyle?.fill ? String(labelStyle.fill) : 'var(--color-text-muted)',
              border: '1px solid var(--color-border-main)',
              pointerEvents: 'all',
              zIndex: 20, // ensure label is above edge
            }}
            className="nodrag nopan"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
