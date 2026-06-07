import React from 'react';
import { X, Command } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Space', desc: 'Play / Pause simulation' },
    { key: 'R', desc: 'Reset machine to initial state' },
    { key: 'B', desc: 'Toggle / Focus Sidebar' },
    // more shortcuts could be added here later
  ];

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4">
      <div className="bg-bg-panel border border-border-active w-full max-w-md rounded-xl shadow-2xl p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors">
          <X size={20} />
        </button>
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-primary-base/20 p-2 rounded-lg text-primary-base">
            <Command size={24} />
          </div>
          <h2 className="text-lg font-bold text-text-primary">Keyboard Shortcuts</h2>
        </div>
        
        <div className="flex flex-col gap-2">
          {shortcuts.map((s, i) => (
            <div key={i} className="flex justify-between items-center p-2 rounded hover:bg-bg-element transition-colors">
              <span className="text-text-secondary text-sm">{s.desc}</span>
              <kbd className="bg-bg-surface border border-border-main px-2 py-1 rounded text-xs font-mono font-bold text-text-primary shadow-sm">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
