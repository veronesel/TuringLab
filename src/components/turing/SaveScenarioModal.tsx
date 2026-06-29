import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Tag, Info, Star } from 'lucide-react';

interface SaveScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, tags: string[]) => void;
  defaultName: string;
  existingTags: string[];
}

export function SaveScenarioModal({
  isOpen,
  onClose,
  onSave,
  defaultName,
  existingTags
}: SaveScenarioModalProps) {
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState(defaultName);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      setName(defaultName);
      setTags([]);
      setTagInput("");
      setShowSuggestions(false);
      setActiveIndex(0);
    }
  }, [isOpen, defaultName]);

  // Handle escape key to close
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

  // Handle click outside suggestions to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!isOpen || !mounted) return null;

  const filteredSuggestions = existingTags.filter(suggestion => {
    const query = tagInput.trim().toLowerCase();
    if (!query) return false;
    return (
      suggestion.toLowerCase().includes(query) &&
      !tags.includes(suggestion)
    );
  }).slice(0, 8); // Limit to top 8 tags for clean layout

  const addTag = (newTag: string) => {
    const cleanTag = newTag.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (cleanTag && !tags.includes(cleanTag)) {
      setTags(prev => [...prev, cleanTag]);
    }
    setTagInput("");
    setShowSuggestions(false);
    setActiveIndex(0);
    // Refocus input
    setTimeout(() => inputRef.current?.focus(), 10);
  };

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(t => t !== tagToRemove));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (showSuggestions && filteredSuggestions[activeIndex]) {
        addTag(filteredSuggestions[activeIndex]);
      } else if (tagInput.trim()) {
        addTag(tagInput);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!showSuggestions) {
        setShowSuggestions(true);
      } else {
        setActiveIndex(prev => (prev + 1) % filteredSuggestions.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (showSuggestions) {
        setActiveIndex(prev => (prev - 1 + filteredSuggestions.length) % filteredSuggestions.length);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    } else if (e.key === ',' || e.key === ' ') {
      // Create tag on comma or space
      e.preventDefault();
      if (tagInput.trim()) {
        addTag(tagInput);
      }
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      // Remove last tag if input is empty and backspace pressed
      removeTag(tags[tags.length - 1]);
    }
  };

  const handleSave = () => {
    if (!name.trim()) return;
    
    // Add any remaining tag input as tag
    let finalTags = [...tags];
    const remainingTag = tagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (remainingTag && !finalTags.includes(remainingTag)) {
      finalTags.push(remainingTag);
    }

    onSave(name.trim(), finalTags);
  };

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-bg-surface border border-border-main rounded-xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-main bg-bg-panel/50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary-base/10 rounded-lg text-primary-base">
              <Tag size={14} />
            </div>
            <div>
              <h2 className="text-xs font-extrabold text-text-primary tracking-wide uppercase">Save Custom Preset</h2>
              <p className="text-[9px] text-text-muted mt-0.5">Define name and tags for your Turing machine scenario.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-bg-element text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-4 bg-[#0d1117] overflow-visible">
          {/* Preset Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
              Scenario Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. My Custom Palindrome Checker"
              className="w-full bg-[#161b22] border border-[#30363d] focus:border-[#58a6ff] rounded px-3 py-2 text-xs outline-none text-text-primary placeholder:text-text-faint transition-colors"
              autoFocus
            />
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center justify-between">
              <span>Tags / Metadata</span>
              <span className="text-[8px] text-text-faint normal-case">Separated by comma or space</span>
            </label>
            
            <div 
              ref={containerRef}
              className="relative flex flex-wrap gap-1.5 p-2 border border-[#30363d] bg-[#161b22] rounded focus-within:border-[#58a6ff] transition-colors min-h-[38px] items-center"
            >
              {tags.map(tag => (
                <span 
                  key={tag} 
                  className="flex items-center gap-1 px-2 py-0.5 bg-primary-base/10 text-primary-base border border-primary-base/20 rounded-full text-[9px] font-bold"
                >
                  #{tag}
                  <button 
                    type="button" 
                    onClick={() => removeTag(tag)} 
                    className="hover:text-red-400 transition-colors cursor-pointer inline-flex items-center"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
              
              <input
                ref={inputRef}
                type="text"
                value={tagInput}
                onChange={e => {
                  setTagInput(e.target.value);
                  setShowSuggestions(true);
                  setActiveIndex(0);
                }}
                onKeyDown={handleTagInputKeyDown}
                onFocus={() => {
                  if (tagInput.trim()) setShowSuggestions(true);
                }}
                placeholder={tags.length === 0 ? "Add tags (e.g. palindrome, math)..." : "add tags..."}
                className="flex-1 bg-transparent border-0 outline-none p-0.5 text-xs text-text-primary placeholder:text-text-faint min-w-[80px]"
                autoComplete="off"
                spellCheck={false}
              />

              {/* Suggestions dropdown */}
              <AnimatePresence>
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute left-0 right-0 top-full mt-1 bg-[#161b22] border border-[#30363d] rounded-lg shadow-2xl z-[10005] max-h-40 overflow-y-auto py-1"
                  >
                    {filteredSuggestions.map((suggestion, idx) => {
                      const isSelected = idx === activeIndex;
                      return (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => addTag(suggestion)}
                          onMouseEnter={() => setActiveIndex(idx)}
                          className={`w-full text-left px-3 py-1.5 text-xs font-mono flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected 
                              ? "bg-primary-base/15 text-primary-base" 
                              : "text-text-secondary hover:bg-bg-panel/40"
                          }`}
                        >
                          <span className="font-semibold">#{suggestion}</span>
                          <span className="text-[8px] text-text-faint">existing tag</span>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="bg-[#161b22] border border-[#30363d]/50 rounded-lg p-2.5 flex items-start gap-2 text-[9px] text-text-muted leading-relaxed">
            <Info size={12} className="text-primary-base shrink-0 mt-0.5" />
            <p>
              Saving this scenario will store the custom ruleset, the starting input tape sequence, and positions permanently under the <strong>Custom</strong> section of your Scenario Library.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-3 border-t border-border-main bg-bg-panel/50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded text-[10px] font-bold text-text-secondary hover:text-text-primary hover:bg-bg-element border border-border-main transition-colors cursor-pointer"
          >
            CANCEL
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!name.trim()}
            className="flex items-center gap-1 bg-primary-base hover:bg-opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[10px] font-bold px-3 py-1.5 rounded transition-all active:scale-[0.98] cursor-pointer"
          >
            <Check size={12} />
            SAVE PRESET
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
