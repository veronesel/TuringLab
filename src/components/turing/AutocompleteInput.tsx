import React, { useState, useRef, useEffect } from 'react';

interface AutocompleteInputProps {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  className?: string;
  field: 'currentState' | 'readSymbol' | 'writeSymbol' | 'nextState';
  maxLength?: number;
  title?: string;
  suggestions: string[];
  symbolAliases?: Record<string, string>;
  stateColor?: string;
  stateColors?: Record<string, string>;
}

export const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  value,
  onChange,
  disabled = false,
  className = '',
  field,
  maxLength,
  title,
  suggestions,
  symbolAliases = {},
  stateColor,
  stateColors,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter and prioritize suggestions
  const filteredSuggestions = React.useMemo(() => {
    const query = value.trim().toLowerCase();
    
    let list = suggestions;
    if (field === 'readSymbol' || field === 'writeSymbol') {
      // For symbols, provide clean default suggestions like '_' (blank) if empty,
      // and filter matching symbol keys or their readable aliases.
      list = suggestions.filter(sym => {
        if (!sym) return false;
        if (!query) return true;
        const alias = (symbolAliases[sym] || '').toLowerCase();
        return sym.toLowerCase().includes(query) || alias.includes(query);
      });
    } else {
      // For states, filter matching state names.
      list = suggestions.filter(st => {
        if (!st) return false;
        if (!query) return true;
        return st.toLowerCase().includes(query) && st.toLowerCase() !== query;
      });
    }

    return list.slice(0, 10); // Limit to top 10 suggestions for density
  }, [value, suggestions, field, symbolAliases]);

  // Handle outside click to shut the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Sync index boundary when suggestions list updates
  useEffect(() => {
    setActiveIndex(0);
  }, [filteredSuggestions]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1) % filteredSuggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 + filteredSuggestions.length) % filteredSuggestions.length);
    } else if (e.key === 'Enter') {
      if (filteredSuggestions[activeIndex]) {
        e.preventDefault();
        selectValue(filteredSuggestions[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      e.preventDefault();
    }
  };

  const selectValue = (val: string) => {
    onChange(val);
    setIsOpen(false);
    // Keep focus in input bar
    setTimeout(() => inputRef.current?.focus(), 10);
  };

  return (
    <div ref={containerRef} className="relative w-full flex items-center">
      {stateColor && stateColor !== '' && (
        <span 
          className="absolute left-2 w-2.5 h-2.5 rounded-full border border-black/40 shadow-sm shrink-0 z-10" 
          style={{ backgroundColor: stateColor }}
          title="State Color"
        />
      )}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        maxLength={maxLength}
        title={title}
        className={className}
        style={{ paddingLeft: stateColor && stateColor !== '' ? '22px' : undefined }}
        autoComplete="off"
        spellCheck={false}
      />

      {isOpen && filteredSuggestions.length > 0 && !disabled && (
        <div 
          className="absolute left-0 right-0 z-50 mt-1 max-h-36 overflow-y-auto rounded-md border border-border-main bg-[#0d1117] shadow-2xl py-1 font-mono text-[10px]"
          style={{ minWidth: field === 'currentState' || field === 'nextState' ? '110px' : '90px' }}
        >
          {filteredSuggestions.map((item, idx) => {
            const isSelected = idx === activeIndex;
            const alias = symbolAliases[item];
            const isSymbol = field === 'readSymbol' || field === 'writeSymbol';
            const itemColor = !isSymbol && stateColors ? stateColors[item] : undefined;
            
            return (
              <div
                key={item}
                onMouseDown={(e) => {
                  e.preventDefault(); // Prevents input blur event before selection triggers
                  selectValue(item);
                }}
                onMouseEnter={() => setActiveIndex(idx)}
                className={`cursor-pointer px-2 py-1 flex items-center justify-between transition-colors ${
                  isSelected 
                    ? 'bg-primary-base/20 text-primary-base font-bold' 
                    : 'text-text-primary hover:bg-[#1a212d]'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  {itemColor && itemColor !== '' && (
                    <span 
                      className="w-2 h-2 rounded-full border border-black/40 shrink-0" 
                      style={{ backgroundColor: itemColor }} 
                    />
                  )}
                  <span>{item === '_' ? 'Blank (_)' : item}</span>
                </div>
                {isSymbol && alias && (
                  <span className="text-[8px] text-text-muted italic ml-2">({alias})</span>
                )}
                {!isSymbol && (item === 'halt' || item === 'accept' || item === 'reject') && (
                  <span className="text-[8px] text-red-400 font-sans font-bold uppercase tracking-wider ml-1">exit</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
