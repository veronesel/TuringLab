import React, { useState, useEffect, useRef } from 'react';

interface TooltipData {
  text: string;
  x: number;
  y: number;
  isBottom: boolean;
}

export const InstantTooltip: React.FC = () => {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const activeElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handlePointerOver = (e: PointerEvent) => {
      const target = (e.target as HTMLElement)?.closest?.('[title], [data-tooltip]') as HTMLElement | null;
      if (!target) return;

      // Ignore standard chrome/iframe helper elements if they are not part of our applet
      if (target.tagName === 'BODY' || target.tagName === 'HTML') return;

      const text = target.getAttribute('data-tooltip') || target.getAttribute('title');
      if (!text || text.trim() === '') return;

      // Remove native 'title' immediately to prevent the browser's built-in delayed rendering
      if (target.hasAttribute('title')) {
        target.setAttribute('data-tooltip', text);
        target.removeAttribute('title');
      }

      activeElementRef.current = target;

      const updatePosition = () => {
        if (!activeElementRef.current) return;
        const rect = activeElementRef.current.getBoundingClientRect();
        
        // Horizontal centering inside the window bounds
        const x = Math.max(16, Math.min(window.innerWidth - 16, rect.left + rect.width / 2));
        
        // Vertical placement: place above by default; if too close to viewport top, place below
        let y = rect.top - 6;
        let isBottom = false;
        
        if (y < 46) {
          y = rect.bottom + 6;
          isBottom = true;
        }

        setTooltip({
          text,
          x,
          y,
          isBottom,
        });
      };

      updatePosition();
      
      // Keep alignment accurate even if page layout shifts/scrolls during hover
      window.addEventListener('scroll', updatePosition, { passive: true });
      activeElementRef.current.addEventListener('pointerout', () => {
        window.removeEventListener('scroll', updatePosition);
      }, { once: true });
    };

    const handlePointerOut = (e: PointerEvent) => {
      if (activeElementRef.current && !activeElementRef.current.contains(e.target as Node)) {
        setTooltip(null);
        activeElementRef.current = null;
      }
    };

    // Use capturing phase to intercept before native elements or custom elements swallow standard hovering triggers
    document.addEventListener('pointerover', handlePointerOver, { capture: true, passive: true });
    document.addEventListener('pointerout', handlePointerOut, { capture: true, passive: true });

    return () => {
      document.removeEventListener('pointerover', handlePointerOver, { capture: true });
      document.removeEventListener('pointerout', handlePointerOut, { capture: true });
    };
  }, []);

  if (!tooltip) return null;

  return (
    <div
      className="fixed z-[999999] pointer-events-none px-2.5 py-1.5 bg-neutral-900 border border-neutral-700/80 text-neutral-100 text-[10px] whitespace-pre-line font-sans rounded-md shadow-xl select-none leading-normal font-medium max-w-xs break-words transition-opacity duration-75"
      style={{
        left: `${tooltip.x}px`,
        top: `${tooltip.y}px`,
        transform: tooltip.isBottom ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
        animation: 'instant-tooltip-appear 0.04s ease-out forwards',
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5), 0 8px 10px -6px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05) inset',
      }}
    >
      {tooltip.text}
    </div>
  );
};
