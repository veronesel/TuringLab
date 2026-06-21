import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Wand2 } from 'lucide-react';
import { useTMStore } from '../../store/tmStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const PatternGeneratorPanel: React.FC<Props> = ({ isOpen, onClose }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  
  const injectTapePattern = useTMStore(state => state.injectTapePattern);
  const [customPattern, setCustomPattern] = useState("");
  const [selectedGenerator, setSelectedGenerator] = useState<'custom' | 'fibonacci' | 'primes' | 'powersOfTwo'>('custom');
  const [count, setCount] = useState(5);

  const generateFibonacci = (n: number) => {
    // Generate n fibonacci numbers represented in unary (1s separated by 0)
    let fib = [1, 1];
    for (let i = 2; i < n; i++) {
      fib.push(fib[i-1] + fib[i-2]);
    }
    return fib.slice(0, n).map(num => '1'.repeat(num)).join('0');
  };

  const generatePrimes = (n: number) => {
    const primes = [];
    let num = 2;
    while (primes.length < n) {
      let isPrime = true;
      for (let i = 2; i <= Math.sqrt(num); i++) {
        if (num % i === 0) { isPrime = false; break; }
      }
      if (isPrime) primes.push(num);
      num++;
    }
    return primes.map(p => '1'.repeat(p)).join('0');
  };

  const generatePowersOfTwo = (n: number) => {
    return Array.from({length: n}, (_, i) => Math.pow(2, i)).map(p => '1'.repeat(p)).join('0');
  };

  const handleInject = () => {
    let pattern = "";
    if (selectedGenerator === 'custom') {
      pattern = customPattern;
    } else if (selectedGenerator === 'fibonacci') {
      pattern = generateFibonacci(count);
    } else if (selectedGenerator === 'primes') {
      pattern = generatePrimes(count);
    } else if (selectedGenerator === 'powersOfTwo') {
      pattern = generatePowersOfTwo(count);
    }

    if (pattern) {
      injectTapePattern(pattern);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && mounted && createPortal(
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
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-widest mb-6 border-b border-border-main pb-2 flex items-center gap-2">
              <Wand2 size={16} className="text-primary-base"/> Pattern Generator
            </h2>

            <div className="space-y-4 mb-6">
              <div className="flex bg-bg-surface border border-border-main rounded p-1">
                {(['custom', 'fibonacci', 'primes', 'powersOfTwo'] as const).map(type => (
                  <button 
                    key={type}
                    onClick={() => setSelectedGenerator(type)}
                    className={`flex-1 py-1.5 text-[10px] uppercase font-bold rounded transition-colors ${selectedGenerator === type ? 'bg-bg-element text-primary-base shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
                  >
                    {type === 'powersOfTwo' ? 'POWERS (2^N)' : type}
                  </button>
                ))}
              </div>

              {selectedGenerator === 'custom' ? (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-muted uppercase">Pattern String</label>
                  <input
                    type="text"
                    value={customPattern}
                    onChange={(e) => setCustomPattern(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleInject(); }}
                    placeholder="e.g. 01010101"
                    className="w-full bg-bg-surface border border-border-main rounded px-3 py-2 text-xs outline-none focus:border-primary-base text-text-primary font-mono"
                  />
                  <div className="text-[9px] text-text-faint">Enter a sequence of characters to place on the tape. Underscores '_' denote blanks.</div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase">Number of Elements (N)</label>
                    <input
                      type="number"
                      min={1} max={50}
                      value={count}
                      onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                      className="w-full bg-bg-surface border border-border-main rounded px-3 py-2 text-xs outline-none focus:border-primary-base text-text-primary font-mono"
                    />
                  </div>
                  <div className="text-[9px] text-text-faint leading-relaxed">
                    {selectedGenerator === 'fibonacci' && "Generates the first N Fibonacci numbers represented in unary (blocks of '1's separated by '0'). Example: 1, 1, 2, 3, 5 becomes 1010110111011111."}
                    {selectedGenerator === 'primes' && "Generates the first N Prime numbers represented in unary. Example: 2, 3, 5, 7 becomes 11011101111101111111."}
                    {selectedGenerator === 'powersOfTwo' && "Generates the first N powers of two (1, 2, 4, 8) represented in unary."}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button 
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-text-muted hover:text-text-primary transition-colors"
              >
                CANCEL
              </button>
              <button 
                onClick={handleInject}
                className="px-4 py-2 bg-primary-base hover:bg-primary-hover text-bg-base text-xs font-bold rounded transition-colors"
              >
                INJECT PATTERN
              </button>
            </div>
          </motion.div>
        </div>,
        document.body
      )}
    </AnimatePresence>
  );
};
