import React, { useState, useEffect } from 'react';
import { useTMStore } from '../../store/tmStore';
import { X, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const SymbolAliasesPanel: React.FC<Props> = ({ isOpen, onClose }) => {
  const symbolAliases = useTMStore(state => state.symbolAliases);
  const setSymbolAliases = useTMStore(state => state.setSymbolAliases);

  const [newSymbol, setNewSymbol] = useState('');
  const [newAlias, setNewAlias] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleAdd = () => {
    if (!newSymbol.trim() || !newAlias.trim()) return;
    setSymbolAliases({ ...symbolAliases, [newSymbol.trim()]: newAlias.trim() });
    setNewSymbol('');
    setNewAlias('');
  };

  const handleRemove = (sym: string) => {
    const next = { ...symbolAliases };
    delete next[sym];
    setSymbolAliases(next);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] bg-black/60 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-bg-panel border border-border-active w-full max-w-sm rounded-xl shadow-2xl p-6 relative"
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors">
              <X size={20} />
            </button>
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-widest mb-6 border-b border-border-main pb-2">Symbol Aliases</h2>
            
            <div className="space-y-4 max-h-[300px] overflow-y-auto mb-4 border-b border-border-main pb-4">
               {Object.entries(symbolAliases).length === 0 ? (
                 <p className="text-xs text-text-faint text-center">No aliases defined.</p>
               ) : (
                 Object.entries(symbolAliases).map(([sym, alias]) => (
                   <div key={sym} className="flex flex-row items-center justify-between bg-bg-element p-2 rounded border border-border-main">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-primary-base font-bold bg-bg-surface px-1.5 py-0.5 rounded border border-border-main">{sym}</span>
                        <span className="text-xs text-text-muted">➔</span>
                        <span className="font-sans text-xs text-text-primary font-bold">{alias}</span>
                      </div>
                      <button onClick={() => handleRemove(sym)} className="text-text-faint hover:text-red-400 p-1 transition-colors">
                        <Trash2 size={12} />
                      </button>
                   </div>
                 ))
               )}
            </div>

            <div className="flex gap-2 items-center">
              <div className="flex flex-col gap-1 w-1/3">
                 <label className="text-[9px] uppercase font-bold text-text-muted">Symbol</label>
                 <input 
                   type="text" 
                   value={newSymbol} 
                   onChange={e => setNewSymbol(e.target.value)} 
                   placeholder="e.g. 0" 
                   className="w-full bg-bg-surface border border-border-main rounded px-2 py-1 text-xs outline-none focus:border-primary-base text-text-primary font-mono"
                 />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                 <label className="text-[9px] uppercase font-bold text-text-muted">Alias / Note</label>
                 <input 
                   type="text" 
                   value={newAlias} 
                   onChange={e => setNewAlias(e.target.value)} 
                   onKeyDown={e => e.key === 'Enter' && handleAdd()}
                   placeholder="e.g. Empty" 
                   className="w-full bg-bg-surface border border-border-main rounded px-2 py-1 text-xs outline-none focus:border-primary-base text-text-primary"
                 />
              </div>
              <button 
                onClick={handleAdd}
                disabled={!newSymbol.trim() || !newAlias.trim()}
                className="mt-4 p-1.5 bg-primary-base hover:bg-primary-hover disabled:opacity-50 text-bg-base rounded transition-colors self-end"
              >
                <Plus size={14} />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
