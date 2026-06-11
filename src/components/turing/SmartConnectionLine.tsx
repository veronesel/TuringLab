import React from 'react';
import { getBezierPath, ConnectionLineComponentProps, useInternalNode } from '@xyflow/react';
import { getEdgeParams } from './smartEdgeUtils';

export default function SmartConnectionLine({
  fromX,
  fromY,
  toX,
  toY,
  fromPosition,
  toPosition,
  fromNode,
}: ConnectionLineComponentProps) {
  // If we don't have the internal node, we just use the default path
  if (!fromNode) {
    const [edgePath] = getBezierPath({
      sourceX: fromX,
      sourceY: fromY,
      sourcePosition: fromPosition,
      targetX: toX,
      targetY: toY,
      targetPosition: toPosition,
    });
    return (
      <g>
        <path
          fill="none"
          stroke="var(--color-primary-base)"
          strokeWidth={1.5}
          className="animated"
          d={edgePath}
        />
        <circle cx={toX} cy={toY} fill="#fff" r={3} stroke="var(--color-primary-base)" strokeWidth={1.5} />
      </g>
    );
  }

  // To do a floating edge connection line, we'd need the target node.
  // But during drag, the target node isn't defined yet! So we just draw to mouse.
  
  // We can calculate exactly where the edge should leave the source node
  // The 'targetNode' is conceptually a 1x1 point at the mouse position
  const targetFakeNode = {
    internals: { positionAbsolute: { x: toX, y: toY } },
    measured: { width: 1, height: 1 }
  } as any;

  const { sx, sy, sourcePos } = getEdgeParams(fromNode as any, targetFakeNode);

  const [edgePath] = getBezierPath({
    sourceX: sx,
    sourceY: sy,
    sourcePosition: sourcePos,
    targetX: toX,
    targetY: toY,
    targetPosition: toPosition,
  });

  return (
    <g>
      <path
        fill="none"
        stroke="var(--color-primary-base)"
        strokeWidth={1.5}
        className="animated"
        d={edgePath}
      />
      <circle cx={toX} cy={toY} fill="#fff" r={3} stroke="var(--color-primary-base)" strokeWidth={1.5} />
    </g>
  );
}
