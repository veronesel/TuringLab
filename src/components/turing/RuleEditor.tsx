import React, { useState } from 'react';
import { useTMStore } from '../../store/tmStore';
import { TMRule, Direction } from '../../types/tm';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Trash2, Save, Wand2, Maximize2, AlertTriangle, AlertCircle, RotateCw, FileText, Table, Search, X, GripVertical, Palette, ChevronDown, Zap, Eye, EyeOff, Check, Undo2, Redo2 } from 'lucide-react';
import { AutocompleteInput } from './AutocompleteInput';
import { playSubtleClick } from '../../utils/audio';
import { motion, AnimatePresence } from 'motion/react';

interface RuleEditorProps {
  onOpenStudio?: () => void;
}

// Utility to convert rule list to aligned multi-line text representation
const rulesToText = (rulesList: TMRule[]): string => {
  return rulesList.map(r => {
    const cur = r.currentState.padEnd(12);
    const readSym = (r.readSymbol || '_').padEnd(6);
    const writeSym = (r.writeSymbol || '_').padEnd(6);
    const dir = r.moveDirection.padEnd(5);
    const nextSt = r.nextState;
    return `${cur} ${readSym} ${writeSym} ${dir} ${nextSt}`;
  }).join('\n');
};

// Determines if a bulk text line has been added, modified, or remains unchanged compared to rulesAtLastRun
const getLineDiffState = (
  line: string, 
  rulesAtLastRun: TMRule[] | null
): 'added' | 'modified' | 'unchanged' => {
  if (!rulesAtLastRun) return 'unchanged';
  
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) {
    return 'unchanged';
  }

  let parts: string[] = [];
  if (trimmed.includes(',')) {
    parts = trimmed.split(',').map(p => p.trim());
  } else {
    parts = trimmed.split(/\s+/).map(p => p.trim());
  }

  if (parts.length < 5) {
    return 'added'; // Incomplete/newly typed rules count as added
  }

  const [currentState, readSymbol, writeSymbol, moveDirection, nextState] = parts;
  const dir = moveDirection.toUpperCase();

  // Find matching rule by key (currentState, readSymbol) in rulesAtLastRun
  const matchingRule = rulesAtLastRun.find(
    r => r.currentState === currentState && r.readSymbol === (readSymbol === '_' ? '_' : readSymbol)
  );

  if (!matchingRule) {
    return 'added';
  }

  // If found, check if any outputs/settings changed
  const isChanged = 
    matchingRule.writeSymbol !== (writeSymbol === '_' ? '_' : writeSymbol) ||
    matchingRule.moveDirection !== dir ||
    matchingRule.nextState !== nextState;

  return isChanged ? 'modified' : 'unchanged';
};

// Utility to parse aligned text or CSV back to structured TMRules
const textToRules = (text: string): { rulesList: TMRule[], errors: string[] } => {
  const lines = text.split('\n');
  const parsedRules: TMRule[] = [];
  const errorsList: string[] = [];
  
  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) {
      return; // Skip comments and empty lines
    }
    
    // Support tabs, multiple spaces, or commas as delimiters
    let parts: string[] = [];
    if (trimmed.includes(',')) {
      parts = trimmed.split(',').map(p => p.trim());
    } else {
      parts = trimmed.split(/\s+/).map(p => p.trim());
    }

    if (parts.length < 5) {
      errorsList.push(`Line ${lineNumber}: Invalid rule format (Expected 5 columns, got ${parts.length})`);
      return;
    }

    const [currentState, readSymbol, writeSymbol, moveDirection, nextState] = parts;
    const dir = moveDirection.toUpperCase();
    
    if (dir !== 'L' && dir !== 'R' && dir !== 'S') {
      errorsList.push(`Line ${lineNumber}: Invalid move direction "${moveDirection}" (MUST be L, R, or S)`);
      return;
    }

    parsedRules.push({
      id: uuidv4(),
      currentState,
      readSymbol: readSymbol === '_' ? '_' : readSymbol,
      writeSymbol: writeSymbol === '_' ? '_' : writeSymbol,
      moveDirection: dir as Direction,
      nextState
    });
  });

  return { rulesList: parsedRules, errors: errorsList };
};

const QUICK_TEMPLATES = [
  {
    name: 'Move Right Loop',
    rules: [{ id: '', currentState: 'q0', readSymbol: '_', writeSymbol: '_', moveDirection: 'R' as Direction, nextState: 'q0' }]
  },
  {
    name: 'Move Left Loop',
    rules: [{ id: '', currentState: 'q0', readSymbol: '_', writeSymbol: '_', moveDirection: 'L' as Direction, nextState: 'q0' }]
  },
  {
    name: 'Binary Incrementer',
    rules: [
      { id: '', currentState: 'q0', readSymbol: '0', writeSymbol: '0', moveDirection: 'R' as Direction, nextState: 'q0' },
      { id: '', currentState: 'q0', readSymbol: '1', writeSymbol: '1', moveDirection: 'R' as Direction, nextState: 'q0' },
      { id: '', currentState: 'q0', readSymbol: '_', writeSymbol: '_', moveDirection: 'L' as Direction, nextState: 'q1' },
      { id: '', currentState: 'q1', readSymbol: '1', writeSymbol: '0', moveDirection: 'L' as Direction, nextState: 'q1' },
      { id: '', currentState: 'q1', readSymbol: '0', writeSymbol: '1', moveDirection: 'L' as Direction, nextState: 'halt' },
      { id: '', currentState: 'q1', readSymbol: '_', writeSymbol: '1', moveDirection: 'L' as Direction, nextState: 'halt' }
    ]
  }
];

const RULE_PATTERNS = [
  {
    name: 'Binary Increment',
    description: 'Increments a binary number starting at the rightmost digit.',
    content: `# Binary Increment
# Increment a binary number (e.g. 1011 -> 1100). Starts at rightmost digit (q0).
# State   Read  Write  Dir  NextState
q0        0     1      S    halt
q0        1     0      L    q0
q0        _     1      S    halt`
  },
  {
    name: 'Move to End',
    description: 'Moves the tape head right to the end of the non-blank input.',
    content: `# Move to End
# Move head to the rightmost end of the non-blank tape.
# State   Read  Write  Dir  NextState
q0        0     0      R    q0
q0        1     1      R    q0
q0        _     _      L    halt`
  },
  {
    name: 'Binary Copy',
    description: 'Copies a binary string separated by a blank (e.g. 10 -> 10_10).',
    content: `# Binary Copy
# Copies a binary string of 0s and 1s to the right of a blank separator.
# State   Read  Write  Dir  NextState
q0        0     X      R    q0_0
q0        1     Y      R    q0_1
q0        _     _      L    q_restore
q0_0      0     0      R    q0_0
q0_0      1     1      R    q0_0
q0_0      _     _      R    q_write0
q0_1      0     0      R    q0_1
q0_1      1     1      R    q0_1
q0_1      _     _      R    q_write1
q_write0  0     0      R    q_write0
q_write0  1     1      R    q_write0
q_write0  _     0      L    q_return
q_write1  0     0      R    q_write1
q_write1  1     1      R    q_write1
q_write1  _     1      L    q_return
q_return  0     0      L    q_return
q_return  1     1      L    q_return
q_return  _     _      L    q_findmarker
q_findmarker 0  0      L    q_findmarker
q_findmarker 1  1      L    q_findmarker
q_findmarker X  0      R    q0
q_findmarker Y  1      R    q0
q_restore X     0      L    q_restore
q_restore Y     1      L    q_restore
q_restore _     _      R    halt`
  },
  {
    name: 'Unary Copy',
    description: 'Copies a sequence of 1s separated by a blank (e.g., 111 -> 111_111).',
    content: `# Unary Copy
# Copy a sequence of 1s (e.g., 111 -> 111_111)
# State   Read  Write  Dir  NextState
q0        1     X      R    q1
q0        _     _      S    q_cleanup
q1        1     1      R    q1
q1        _     _      R    q2
q2        1     1      R    q2
q2        _     1      L    q3
q3        1     1      L    q3
q3        _     _      L    q4
q4        1     1      L    q4
q4        X     1      R    q0
q_cleanup X     1      R    q_cleanup
q_cleanup _     _      S    halt`
  },
  {
    name: 'Palindrome Checker',
    description: 'Accepts binary palindromes, rejects otherwise.',
    content: `# Palindrome Checker
# Accepts binary palindrome, halts or rejects.
# State   Read  Write  Dir  NextState
q0        0     _      R    q0_match0
q0        1     _      R    q0_match1
q0        _     _      S    accept
q0_match0 0     0      R    q0_match0
q0_match0 1     1      R    q0_match0
q0_match0 _     _      L    q1_check0
q0_match1 0     0      R    q0_match1
q0_match1 1     1      R    q0_match1
q0_match1 _     _      L    q2_check1
q1_check0 0     _      L    q3_return
q1_check0 1     1      S    reject
q1_check0 _     _      S    accept
q2_check1 1     _      L    q3_return
q2_check1 0     0      S    reject
q2_check1 _     _      S    accept
q3_return 0     0      L    q3_return
q3_return 1     1      L    q3_return
q3_return _     _      R    q0`
  },
  {
    name: 'Clear Tape',
    description: 'Erases all non-blank symbols off the tape.',
    content: `# Clear Tape
# Erase all non-blank symbols
# State   Read  Write  Dir  NextState
q0        0     _      R    q0
q0        1     _      R    q0
q0        X     _      R    q0
q0        _     _      S    halt`
  }
];

export const RuleEditor: React.FC<RuleEditorProps> = ({ onOpenStudio }) => {
  const rules = useTMStore(state => state.rules);
  const setRules = useTMStore(state => state.setRules);
  const lastRuleId = useTMStore(state => state.lastRuleId);
  const isRunning = useTMStore(state => state.isRunning);
  const isPaused = useTMStore(state => state.isPaused);
  const activeScenario = useTMStore(state => state.activeScenario);
  const currentState = useTMStore(state => state.currentState);
  const headPosition = useTMStore(state => state.headPosition);
  const tape = useTMStore(state => state.tape);
  const executionSpeed = useTMStore(state => state.executionSpeed);
  const updateStateColor = useTMStore(state => state.updateStateColor);
  const setHighlightedState = useTMStore(state => state.setHighlightedState);
  const highlightedState = useTMStore(state => state.highlightedState);
  const rulesAtLastRun = useTMStore(state => state.rulesAtLastRun);
  const undoEdit = useTMStore(state => state.undoEdit);
  const redoEdit = useTMStore(state => state.redoEdit);
  const editHistoryIndex = useTMStore(state => state.editHistoryIndex);
  const editHistory = useTMStore(state => state.editHistory);

  const [localRules, setLocalRules] = useState<TMRule[]>(rules);
  const [isBulkMode, setIsBulkMode] = useState<boolean>(false);
  const [bulkText, setBulkText] = useState<string>('');
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);
  const [isPatternsOpen, setIsPatternsOpen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [highlightedRuleId, setHighlightedRuleId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isFixingRules, setIsFixingRules] = useState<boolean>(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragRowId, setDragRowId] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [showStateColorsManager, setShowStateColorsManager] = useState<boolean>(false);
  const [selectedStateForColor, setSelectedStateForColor] = useState<string | null>(null);
  const [showQuickAdd, setShowQuickAdd] = useState<boolean>(false);
  const [selectedRules, setSelectedRules] = useState<Set<string>>(new Set());

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const symbolAliases = useTMStore(state => state.symbolAliases);

  // Syntax highlighting editor refs & functions
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const preRef = React.useRef<HTMLPreElement>(null);
  const lineNumbersRef = React.useRef<HTMLDivElement>(null);

  const [editorScroll, setEditorScroll] = React.useState({ scrollTop: 0, scrollLeft: 0 });
  const [hoveredError, setHoveredError] = React.useState<{
    title: string;
    message: string;
    formalRef: string;
    x: number;
    y: number;
    line: number;
  } | null>(null);

  const lineNumbersText = React.useMemo(() => {
    const linesCount = bulkText.split('\n').length;
    return Array.from({ length: linesCount }, (_, i) => i + 1).join('\n');
  }, [bulkText]);

  const diffStats = React.useMemo(() => {
    if (!rulesAtLastRun) return { added: 0, modified: 0, total: 0 };
    let added = 0;
    let modified = 0;
    
    localRules.forEach(rule => {
      const matching = rulesAtLastRun.find(r => r.id === rule.id);
      if (!matching) {
        const matchingByKey = rulesAtLastRun.find(
          r => r.currentState === rule.currentState && r.readSymbol === rule.readSymbol
        );
        if (!matchingByKey) added++;
      } else {
        const isChanged = 
          matching.currentState !== rule.currentState ||
          matching.readSymbol !== rule.readSymbol ||
          matching.writeSymbol !== rule.writeSymbol ||
          matching.moveDirection !== rule.moveDirection ||
          matching.nextState !== rule.nextState ||
          matching.enabled !== rule.enabled;
        if (isChanged) modified++;
      }
    });
    
    return { added, modified, total: added + modified };
  }, [rulesAtLastRun, localRules]);

  const [autocomplete, setAutocomplete] = React.useState<{
    tokenIndex: number;
    query: string;
    replaceStart: number;
    lineIndex: number;
    columnIndex: number;
    suggestions: string[];
    activeIndex: number;
  } | null>(null);

  const getAutocompleteContext = (text: string, caretPos: number) => {
    if (caretPos === 0) return null;
    const textBeforeCursor = text.substring(0, caretPos);
    const lines = textBeforeCursor.split('\n');
    const currentLineIndex = lines.length - 1;
    const currentLineUpToCursor = lines[currentLineIndex];
    
    // If line is a comment or empty, no autocomplete
    const trimmedLine = currentLineUpToCursor.trim();
    if (trimmedLine.startsWith('#') || trimmedLine.startsWith('//')) {
      return null;
    }
    
    // Parse words on the current line before the cursor
    const words: { text: string; start: number; end: number }[] = [];
    let currentWord = '';
    let wordStart = 0;
    
    for (let i = 0; i < currentLineUpToCursor.length; i++) {
      const char = currentLineUpToCursor[i];
      if (/\s/.test(char)) {
        if (currentWord) {
          words.push({ text: currentWord, start: wordStart, end: i });
          currentWord = '';
        }
      } else {
        if (!currentWord) {
          wordStart = i;
        }
        currentWord += char;
      }
    }
    if (currentWord) {
      words.push({ text: currentWord, start: wordStart, end: currentLineUpToCursor.length });
    }
    
    const endsWithSpace = /\s/.test(currentLineUpToCursor.slice(-1));
    let tokenIndex = 0;
    let query = '';
    let replaceStart = caretPos;
    
    if (words.length === 0) {
      tokenIndex = 0;
      query = '';
      replaceStart = caretPos;
    } else {
      if (endsWithSpace) {
        tokenIndex = words.length;
        query = '';
        replaceStart = caretPos;
      } else {
        tokenIndex = words.length - 1;
        const lastWord = words[words.length - 1];
        query = lastWord.text;
        const lineStartPos = textBeforeCursor.length - currentLineUpToCursor.length;
        replaceStart = lineStartPos + lastWord.start;
      }
    }
    
    // We only suggest for the 5 standard parts of a rule
    if (tokenIndex > 4) return null;
    
    return {
      tokenIndex,
      query,
      replaceStart,
      lineIndex: currentLineIndex,
      columnIndex: currentLineUpToCursor.length,
    };
  };

  const updateAutocomplete = (text: string, caretPos: number) => {
    const ctx = getAutocompleteContext(text, caretPos);
    if (!ctx) {
      setAutocomplete(null);
      return;
    }
    
    let suggestionsList: string[] = [];
    if (ctx.tokenIndex === 0) {
      suggestionsList = uniqueStates;
    } else if (ctx.tokenIndex === 1 || ctx.tokenIndex === 2) {
      suggestionsList = uniqueSymbols;
    } else if (ctx.tokenIndex === 3) {
      suggestionsList = ['L', 'R', 'S'];
    } else if (ctx.tokenIndex === 4) {
      const states = new Set([...uniqueStates, 'halt', 'accept', 'reject']);
      suggestionsList = Array.from(states);
    }
    
    const queryLower = ctx.query.toLowerCase();
    const filtered = suggestionsList
      .filter(s => s.toLowerCase().includes(queryLower))
      .sort((a, b) => {
        const aLower = a.toLowerCase();
        const bLower = b.toLowerCase();
        const aStartsWith = aLower.startsWith(queryLower);
        const bStartsWith = bLower.startsWith(queryLower);
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        return aLower.localeCompare(bLower);
      });
      
    if (filtered.length === 0) {
      setAutocomplete(null);
    } else {
      setAutocomplete(prev => {
        const prevActive = (prev && prev.query === ctx.query) ? prev.activeIndex : 0;
        return {
          ...ctx,
          suggestions: filtered,
          activeIndex: prevActive >= filtered.length ? 0 : prevActive,
        };
      });
    }
  };

  const applySuggestion = (suggestion: string) => {
    if (!autocomplete) return;
    const { replaceStart, tokenIndex } = autocomplete;
    
    const textBefore = bulkText.substring(0, replaceStart);
    const textAfter = bulkText.substring(textareaRef.current?.selectionStart || replaceStart);
    
    const hasWhitespaceAfter = textAfter.length > 0 && /\s/.test(textAfter[0]);
    const suffix = (tokenIndex < 4 && !hasWhitespaceAfter) ? ' ' : '';
    
    const newText = textBefore + suggestion + suffix + textAfter;
    setBulkText(newText);
    
    const { errors } = textToRules(newText);
    setBulkErrors(errors);
    
    const newCaretPos = replaceStart + suggestion.length + suffix.length;
    setAutocomplete(null);
    
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = newCaretPos;
      }
    }, 10);
  };

  const handleSelectionOrMovement = () => {
    if (textareaRef.current) {
      updateAutocomplete(bulkText, textareaRef.current.selectionStart);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const rect = textarea.getBoundingClientRect();
    const padding = 12; // p-3 is 12px
    const lineHeight = 18; // line-height of text-[11px] leading-relaxed is ~18px
    const charWidth = 6.6; // JetBrains Mono character width at 11px

    const x = e.clientX - rect.left - padding + textarea.scrollLeft;
    const y = e.clientY - rect.top - padding + textarea.scrollTop;

    const lineIdx = Math.floor(y / lineHeight);
    
    const lines = bulkText.split('\n');
    if (lineIdx < 0 || lineIdx >= lines.length) {
      setHoveredError(null);
      return;
    }

    const line = lines[lineIdx];
    const trimmed = line.trim();
    
    // Check if line is empty or comment
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) {
      setHoveredError(null);
      return;
    }

    // Identify words on this line
    const wordsWithRanges: { text: string; start: number; end: number; wordIndex: number }[] = [];
    let currentWord = '';
    let wordStart = 0;
    let wordCount = 0;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (/\s/.test(char)) {
        if (currentWord) {
          wordsWithRanges.push({ text: currentWord, start: wordStart, end: i, wordIndex: wordCount });
          currentWord = '';
          wordCount++;
        }
      } else {
        if (!currentWord) {
          wordStart = i;
        }
        currentWord += char;
      }
    }
    if (currentWord) {
      wordsWithRanges.push({ text: currentWord, start: wordStart, end: line.length, wordIndex: wordCount });
    }

    const totalWords = wordsWithRanges.length;
    const charIdx = Math.floor(x / charWidth);
    
    // Check if mouse is hovering over a word
    const hoveredWord = wordsWithRanges.find(w => charIdx >= w.start && charIdx <= w.end);
    if (!hoveredWord) {
      setHoveredError(null);
      return;
    }

    let errorDetails: { title: string; message: string; formalRef: string } | null = null;

    if (totalWords < 5) {
      errorDetails = {
        title: "Incomplete Transition Tuple",
        message: `This rule has only ${totalWords} column(s). A valid Turing Machine rule must specify exactly 5 parameters to define a full transition.`,
        formalRef: "TM Formal Definition: The transition function is mathematically defined as \u03B4: Q \u00D7 \u0393 \u2192 Q \u00D7 \u0393 \u00D7 {L, R, S}.\nIt maps (currentState, readSymbol) to (writeSymbol, moveDirection, nextState). All 5 components must be declared."
      };
    } else {
      const moveDirection = wordsWithRanges[3]?.text || '';
      const dir = moveDirection.toUpperCase();

      if (hoveredWord.wordIndex === 3 && dir !== 'L' && dir !== 'R' && dir !== 'S') {
        errorDetails = {
          title: "Invalid Head Shift Direction",
          message: `"${moveDirection}" is not a valid head transition direction. It must be L, R, or S (case-insensitive).`,
          formalRef: "TM Formal Definition: The shift direction 'D' is restricted to the set {L, R, S}.\n- 'L' (Left): moves head left\n- 'R' (Right): moves head right\n- 'S' (Stationary): maintains head position on the current cell."
        };
      } else if (hoveredWord.wordIndex >= 5) {
        errorDetails = {
          title: "Extraneous Transition Column",
          message: `Too many columns. Expected exactly 5 columns, but found extra element "${hoveredWord.text}".`,
          formalRef: "TM Formal Definition: The transition function \u03B4 is a function from Q \u00D7 \u0393 mapping to a single output triple in Q \u00D7 \u0393 \u00D7 {L, R, S}. Additional parameters are mathematically undefined."
        };
      }
    }

    if (errorDetails) {
      setHoveredError({
        ...errorDetails,
        x: e.clientX,
        y: e.clientY,
        line: lineIdx + 1,
      });
    } else {
      setHoveredError(null);
    }
  };

  const handleScroll = () => {
    if (textareaRef.current) {
      const scrollTop = textareaRef.current.scrollTop;
      const scrollLeft = textareaRef.current.scrollLeft;
      
      setEditorScroll({ scrollTop, scrollLeft });
      
      if (preRef.current) {
        preRef.current.scrollTop = scrollTop;
        preRef.current.scrollLeft = scrollLeft;
      }
      if (lineNumbersRef.current) {
        lineNumbersRef.current.scrollTop = scrollTop;
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (autocomplete && autocomplete.suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setAutocomplete(prev => {
          if (!prev) return null;
          return {
            ...prev,
            activeIndex: (prev.activeIndex + 1) % prev.suggestions.length
          };
        });
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setAutocomplete(prev => {
          if (!prev) return null;
          return {
            ...prev,
            activeIndex: (prev.activeIndex - 1 + prev.suggestions.length) % prev.suggestions.length
          };
        });
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const selected = autocomplete.suggestions[autocomplete.activeIndex];
        applySuggestion(selected);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setAutocomplete(null);
        return;
      }
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;
      
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const spaces = '    '; // 4 spaces
      
      const newValue = text.substring(0, start) + spaces + text.substring(end);
      setBulkText(newValue);
      
      const { errors } = textToRules(newValue);
      setBulkErrors(errors);
      
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + spaces.length;
      }, 0);
    }
  };

  const popupPosition = React.useMemo(() => {
    if (!autocomplete || !textareaRef.current) return { top: 0, left: 0, visible: false, showAbove: false };
    
    const container = textareaRef.current.parentElement;
    if (!container) return { top: 0, left: 0, visible: false, showAbove: false };
    
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    const charWidth = 6.6;
    const lineHeight = 18;
    const padding = 12; // p-3 is 12px
    
    let left = autocomplete.columnIndex * charWidth + padding - editorScroll.scrollLeft;
    let top = (autocomplete.lineIndex + 1) * lineHeight + padding - editorScroll.scrollTop;
    
    const popupWidth = 150;
    const popupHeight = Math.min(autocomplete.suggestions.length * 24 + 8, 144);
    
    if (left + popupWidth > containerWidth - 10) {
      left = Math.max(10, containerWidth - popupWidth - 10);
    }
    
    let showAbove = false;
    if (top + popupHeight > containerHeight - 10) {
      const topAbove = autocomplete.lineIndex * lineHeight + padding - editorScroll.scrollTop - popupHeight - 4;
      if (topAbove > 5) {
        top = topAbove;
        showAbove = true;
      }
    }
    
    const cursorY = autocomplete.lineIndex * lineHeight + padding;
    const isOutOfView = cursorY < editorScroll.scrollTop || cursorY > editorScroll.scrollTop + containerHeight - lineHeight;
    
    return {
      left,
      top,
      visible: !isOutOfView,
      showAbove,
    };
  }, [autocomplete, editorScroll]);

  const highlightRulesText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, lineIdx) => {
      const isLast = lineIdx === lines.length - 1;
      const content = line === '' ? ' ' : line;
      
      const diff = getLineDiffState(line, rulesAtLastRun);
      let lineClass = "w-full block";
      if (diff === 'added') {
        lineClass = "w-full block bg-emerald-500/[0.06]";
      } else if (diff === 'modified') {
        lineClass = "w-full block bg-blue-500/[0.06]";
      }

      // Handle comments
      if (line.trim().startsWith('#') || line.trim().startsWith('//')) {
        return (
          <div key={lineIdx} className={`${lineClass} text-text-muted/60 italic`}>
            {content}
          </div>
        );
      }

      const nonSpaceParts = line.trim().split(/\s+/).filter(Boolean);
      const totalWords = nonSpaceParts.length;

      const parts = line.split(/(\s+)/);
      let wordCount = 0;
      const tokens: React.ReactNode[] = [];

      parts.forEach((part, partIdx) => {
        if (!part) return;

        if (/^\s+$/.test(part)) {
          tokens.push(<span key={partIdx}>{part}</span>);
        } else {
          wordCount++;
          let className = "text-text-primary";
          let isError = false;

          if (wordCount === 1) {
            className = "text-blue-400 font-semibold";
          } else if (wordCount === 2) {
            className = "text-amber-400";
          } else if (wordCount === 3) {
            className = "text-yellow-400";
          } else if (wordCount === 4) {
            className = "text-purple-400 font-bold";
            if (part !== 'L' && part !== 'R' && part !== 'S' && part !== 'l' && part !== 'r' && part !== 's') {
              isError = true;
            }
          } else if (wordCount === 5) {
            if (part === 'halt' || part === 'reject') {
              className = "text-red-400 font-bold";
            } else if (part === 'accept') {
              className = "text-emerald-400 font-bold";
            } else {
              className = "text-emerald-400 font-bold";
            }
          } else {
            isError = true;
          }

          if (totalWords < 5) {
            isError = true;
          }

          if (isError) {
            className += " underline decoration-red-500 decoration-wavy decoration-1";
          }

          tokens.push(
            <span key={partIdx} className={className}>
              {part}
            </span>
          );
        }
      });

      return (
        <div key={lineIdx} className={lineClass}>
          {tokens}
        </div>
      );
    });
  };

  // Find the currently active executing rule based on the TM state
  const executingRuleId = React.useMemo(() => {
    const currentReadSymbol = (tape[headPosition] || '_').trim() || '_';
    const match = localRules.find(rule => 
      rule.currentState.trim() === currentState.trim() && 
      (rule.readSymbol.trim() || '_') === currentReadSymbol
    );
    return match ? match.id : null;
  }, [localRules, currentState, headPosition, tape]);

  // Auto-scroll to center the currently executing rule if it falls out of view
  React.useEffect(() => {
    if (!executingRuleId || !autoScroll) return;

    // Use shorter/longer debounce depending on speed
    const delay = isRunning && executionSpeed < 100 ? 5 : 30;
    const timer = setTimeout(() => {
      const container = scrollContainerRef.current;
      const element = document.getElementById(`rule-row-${executingRuleId}`);
      if (container && element) {
        const containerRect = container.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();

        // Check if element is above, below, or near boundaries
        const isAbove = elementRect.top < containerRect.top + 15;
        const isBelow = elementRect.bottom > containerRect.bottom - 15;

        if (isAbove || isBelow || isRunning) {
          const elementRelativeTop = elementRect.top - containerRect.top + container.scrollTop;
          const targetScrollTop = elementRelativeTop - (container.clientHeight / 2) + (element.offsetHeight / 2);

          // Use instant auto-scroll if simulation speed is fast to prevent stuttering/inertia lag
          const useInstant = isRunning && executionSpeed < 300;

          container.scrollTo({
            top: targetScrollTop,
            behavior: useInstant ? 'auto' : 'smooth'
          });
        }
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [executingRuleId, autoScroll, isRunning, executionSpeed]);

  // Compute unique states parsed from current rules, scenario settings and presets
  const uniqueStates = React.useMemo(() => {
    const states = new Set<string>(['q0', 'halt', 'accept', 'reject']);
    if (activeScenario) {
      states.add(activeScenario.initialState);
      activeScenario.acceptStates.forEach(s => states.add(s));
    }
    localRules.forEach(r => {
      if (r.currentState.trim()) states.add(r.currentState.trim());
      if (r.nextState.trim()) states.add(r.nextState.trim());
    });
    return Array.from(states);
  }, [localRules, activeScenario]);

  // Compute unique symbols found on tape, in rules, or defined as custom aliases
  const uniqueSymbols = React.useMemo(() => {
    const syms = new Set<string>(['_', '0', '1']);
    Object.values(tape).forEach(s => { if (s) syms.add(s); });
    localRules.forEach(r => {
      if (r.readSymbol) syms.add(r.readSymbol);
      if (r.writeSymbol) syms.add(r.writeSymbol);
    });
    Object.keys(symbolAliases).forEach(s => { if (s) syms.add(s); });
    return Array.from(syms);
  }, [localRules, tape, symbolAliases]);

  // Sync when store rules change (like loading a new scenario)
  React.useEffect(() => {
    setLocalRules(rules);
    if (isBulkMode) {
      setBulkText(rulesToText(rules));
      setBulkErrors([]);
    }
  }, [rules]);

  // Real-time linter for conflicting transitions and unreachable states
  const { conflicts, unreachableStates, conflictMessages, infiniteLoops, loopMessages } = React.useMemo(() => {
    const conflictsSet = new Set<string>();
    const unreachableStatesSet = new Set<string>();
    const conflictMsgs: Record<string, string> = {};

    // 1. Identify starting state
    const startState = (activeScenario?.initialState || 'q0').trim();

    // 2. Compute reachable states using simple target discovery
    const allStatesSet = new Set<string>();
    const reachedSet = new Set<string>();
    reachedSet.add(startState);

    const activeRulesForAnalysis = localRules.filter(r => r.enabled !== false);

    activeRulesForAnalysis.forEach(r => {
      const cur = r.currentState.trim();
      const nxt = r.nextState.trim();
      if (cur) allStatesSet.add(cur);
      if (nxt) {
        allStatesSet.add(nxt);
        reachedSet.add(nxt);
      }
    });

    allStatesSet.forEach(s => {
      if (!reachedSet.has(s)) {
        unreachableStatesSet.add(s);
      }
    });

    // 3. Scan for non-deterministic conflicts (same current state and read symbol but different outputs)
    const keyMap = new Map<string, string[]>();
    activeRulesForAnalysis.forEach(r => {
      const cur = r.currentState.trim();
      const sym = (r.readSymbol.trim() || '_');
      const key = `${cur}|${sym}`;
      if (!keyMap.has(key)) {
        keyMap.set(key, []);
      }
      keyMap.get(key)!.push(r.id);
    });

    keyMap.forEach((ids, key) => {
      if (ids.length > 1) {
        const [state, symbol] = key.split('|');
        ids.forEach(id => {
          conflictsSet.add(id);
          const otherRules = localRules.filter(r => ids.includes(r.id) && r.id !== id);
          const details = otherRules.map(o => {
            const num = localRules.findIndex(r => r.id === o.id) + 1;
            return `#${num} (NST: ${o.nextState}, OUT: ${o.writeSymbol || '_'}, MV: ${o.moveDirection})`;
          }).join(', ');
          conflictMsgs[id] = `Conflict with rule ${details}. Deterministic machines cannot handle multiple behaviors for state "${state}" on input "${symbol}".`;
        });
      }
    });

    // 4. Detect Trivial Endless Loops (Cycles of S-moves)
    const infiniteLoopsSet = new Set<string>();
    const loopMsgs: Record<string, string> = {};

    const sEdges = new Map<string, { to: string, ruleId: string }[]>();
    activeRulesForAnalysis.forEach(r => {
      const dir = (r.moveDirection || 'S').trim().toUpperCase();
      if (dir === 'S') {
        const from = `${r.currentState.trim()}|${r.readSymbol.trim() || '_'}`;
        const to = `${r.nextState.trim()}|${r.writeSymbol.trim() || '_'}`;
        if (!sEdges.has(from)) sEdges.set(from, []);
        sEdges.get(from)!.push({ to, ruleId: r.id });
      }
    });

    // Simple DFS for cycle detection
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const path: { node: string, ruleId: string }[] = [];

    const detectCycles = (node: string) => {
      visited.add(node);
      recursionStack.add(node);

      const edges = sEdges.get(node) || [];
      for (const edge of edges) {
        path.push({ node: edge.to, ruleId: edge.ruleId });
        
        if (!visited.has(edge.to)) {
          detectCycles(edge.to);
        } else if (recursionStack.has(edge.to)) {
          // Cycle found!
          // Identify the rules involved in the cycle
          const cycleStartIndex = path.findIndex(p => p.node === edge.to);
          const cycleRules = path.slice(cycleStartIndex).map(p => p.ruleId);
          
          if (cycleRules.length === 1) {
            infiniteLoopsSet.add(cycleRules[0]);
            loopMsgs[cycleRules[0]] = "Trivial Infinite Loop: This rule transitions to itself without moving the head (S). Execution will hang.";
          } else {
            cycleRules.forEach(ruleId => {
              infiniteLoopsSet.add(ruleId);
              loopMsgs[ruleId] = "Infinite Loop Cycle: This rule is part of a cycle of stationary (S) moves that will loop infinitely. Execution will hang.";
            });
          }
        }
        
        path.pop();
      }

      recursionStack.delete(node);
    };

    sEdges.forEach((_, node) => {
      if (!visited.has(node)) {
        detectCycles(node);
      }
    });

    return {
      conflicts: conflictsSet,
      unreachableStates: unreachableStatesSet,
      conflictMessages: conflictMsgs,
      infiniteLoops: infiniteLoopsSet,
      loopMessages: loopMsgs
    };
  }, [localRules, activeScenario]);

  // Map conflicts and unreachable states to precise transition rules for clickable list interaction
  const validationIssues = React.useMemo(() => {
    const issues: {
      id: string;
      type: 'conflict' | 'unreachable' | 'infinite_loop';
      title: string;
      description: string;
      ruleId: string;
      ruleNum: number;
    }[] = [];

    // Process deterministic conflicts
    localRules.forEach((rule, idx) => {
      if (conflicts.has(rule.id)) {
        issues.push({
          id: `conflict-${rule.id}`,
          type: 'conflict',
          title: `Deterministic Conflict`,
          description: conflictMessages[rule.id] || `Conflicts with another state/symbol transition configuration.`,
          ruleId: rule.id,
          ruleNum: idx + 1
        });
      }
    });

    // Process infinite loops
    localRules.forEach((rule, idx) => {
      if (infiniteLoops.has(rule.id)) {
        issues.push({
          id: `loop-${rule.id}`,
          type: 'infinite_loop',
          title: `Infinite Loop Detected`,
          description: loopMessages[rule.id] || `This rule causes an infinite execution loop.`,
          ruleId: rule.id,
          ruleNum: idx + 1
        });
      }
    });

    // Process unreachable states where rules are defined as "dead code"
    unreachableStates.forEach(st => {
      localRules.forEach((rule, idx) => {
        if (rule.currentState.trim() === st) {
          issues.push({
            id: `unreachable-${rule.id}`,
            type: 'unreachable',
            title: `Unreachable Code`,
            description: `State "${st}" has no incoming transitions and cannot be executed in code path.`,
            ruleId: rule.id,
            ruleNum: idx + 1
          });
        }
      });
    });

    return issues;
  }, [localRules, conflicts, unreachableStates, conflictMessages, infiniteLoops, loopMessages]);

  const jumpToRule = (ruleId: string) => {
    const element = document.getElementById(`rule-row-${ruleId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedRuleId(ruleId);
      setTimeout(() => {
        setHighlightedRuleId(null);
      }, 1500);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index || isRunning || searchQuery) return;

    const updated = [...localRules];
    const [removed] = updated.splice(draggedIndex, 1);
    updated.splice(index, 0, removed);

    setLocalRules(updated);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragRowId(null);
  };

  const updateRule = (id: string, field: keyof TMRule, value: string) => {
    setLocalRules(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const addRule = () => {
    setLocalRules(prev => [...prev, {
      id: uuidv4(),
      currentState: "q0",
      readSymbol: "0",
      nextState: "q0",
      writeSymbol: "0",
      moveDirection: "R"
    }]);
  };

  const fixWithAI = async () => {
    if (validationIssues.length === 0) return;
    setIsFixingRules(true);
    try {
      const response = await fetch('/api/fix-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rules: localRules,
          issues: validationIssues
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fix rules with AI');
      }

      const data = await response.json();
      if (data.fixedRules && Array.isArray(data.fixedRules)) {
        // preserve new UUIDs or old ones
        const rulesWithIds = data.fixedRules.map((r: any) => ({
          ...r,
          id: r.id || uuidv4()
        }));
        setLocalRules(rulesWithIds);
        setRules(rulesWithIds);
        
        // Clear any active simulation rejection/error warnings
        if (useTMStore.getState().status === 'rejected' || useTMStore.getState().status === 'error') {
          useTMStore.setState({ status: 'idle', errorMessage: null });
        }
      }
    } catch (err) {
      console.error(err);
      alert('Failed to apply AI fix');
    } finally {
      setIsFixingRules(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedRules.size === filteredRules.length && filteredRules.length > 0) {
      setSelectedRules(new Set());
    } else {
      setSelectedRules(new Set(filteredRules.map(r => r.id)));
    }
  };

  const toggleSelectRule = (id: string) => {
    const newSelected = new Set(selectedRules);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRules(newSelected);
  };

  const handleBulkDelete = () => {
    if (selectedRules.size === 0) return;
    const newRules = localRules.filter(r => !selectedRules.has(r.id));
    setLocalRules(newRules);
    setRules(newRules);
    setSelectedRules(new Set());
    playSubtleClick();
  };

  const handleBulkToggleEnable = (enable: boolean) => {
    if (selectedRules.size === 0) return;
    const newRules = localRules.map(r => {
      if (selectedRules.has(r.id)) {
        return { ...r, enabled: enable };
      }
      return r;
    });
    setLocalRules(newRules);
    setRules(newRules);
    playSubtleClick();
  };

  const handleInsertPattern = (patternContent: string, mode: 'replace' | 'append') => {
    let newText = '';
    if (mode === 'replace') {
      newText = patternContent;
    } else {
      if (bulkText && !bulkText.endsWith('\n')) {
        newText = bulkText + '\n\n' + patternContent;
      } else if (bulkText) {
        newText = bulkText + '\n' + patternContent;
      } else {
        newText = patternContent;
      }
    }
    setBulkText(newText);
    const { errors } = textToRules(newText);
    setBulkErrors(errors);
    
    playSubtleClick();
    
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = newText.length;
      }
    }, 50);
  };

  const removeRule = (id: string) => {
    setLocalRules(prev => prev.filter(r => r.id !== id));
  };

  const autoFormatRules = () => {
    const cleanAndFormatList = (list: TMRule[]): TMRule[] => {
      const keysWithSeen = new Set<string>();
      const result: TMRule[] = [];

      list.forEach(r => {
        const cur = r.currentState.trim();
        const read = r.readSymbol.trim() || '_';
        const write = r.writeSymbol.trim() || '_';
        // Ensure standard uppercase string direction
        const dir = (r.moveDirection || 'S').trim().toUpperCase() as Direction;
        const nxt = r.nextState.trim();

        // Remove completely empty/incomplete rules (e.g. empty current and next states)
        if (!cur && !nxt) {
          return;
        }

        // Create a unique compound signature to identify and prune exact redundant lines
        const signature = `${cur}|${read}|${write}|${dir}|${nxt}`;
        if (!keysWithSeen.has(signature)) {
          keysWithSeen.add(signature);
          result.push({
            ...r,
            currentState: cur,
            readSymbol: read,
            writeSymbol: write,
            moveDirection: dir,
            nextState: nxt
          });
        }
      });

      // Sort alphabetically by current state, then by read symbol
      return result.sort((a, b) => {
        const stateComp = a.currentState.localeCompare(b.currentState);
        if (stateComp !== 0) return stateComp;
        return a.readSymbol.localeCompare(b.readSymbol);
      });
    };

    if (isBulkMode) {
      const parsed = textToRules(bulkText);
      const cleaned = cleanAndFormatList(parsed.rulesList);
      setBulkText(rulesToText(cleaned));
      setBulkErrors([]);
    } else {
      setLocalRules(prev => cleanAndFormatList(prev));
    }
  };

  const handleTextChange = (val: string) => {
    setBulkText(val);
    const { errors } = textToRules(val);
    setBulkErrors(errors);

    setTimeout(() => {
      if (textareaRef.current) {
        updateAutocomplete(val, textareaRef.current.selectionStart);
      }
    }, 0);
  };

  const saveRules = () => {
    if (isBulkMode) {
      const { rulesList, errors } = textToRules(bulkText);
      if (errors.length > 0) {
        setBulkErrors(errors);
        return;
      }
      setRules(rulesList);
      setLocalRules(rulesList);
      setIsBulkMode(false);
    } else {
      setRules(localRules);
    }
  };

  const hasChanges = isBulkMode 
    ? rulesToText(rules) !== bulkText 
    : JSON.stringify(rules) !== JSON.stringify(localRules);

  const filteredRules = React.useMemo(() => {
    if (!searchQuery.trim()) return localRules;
    const query = searchQuery.toLowerCase().trim();
    return localRules.filter(r => 
      r.currentState.toLowerCase().includes(query) ||
      (r.readSymbol || '_').toLowerCase().includes(query) ||
      (r.writeSymbol || '_').toLowerCase().includes(query) ||
      r.nextState.toLowerCase().includes(query)
    );
  }, [localRules, searchQuery]);

  return (
    <div className="flex flex-col flex-1 overflow-hidden font-mono min-w-0 h-full">
      <div className="p-3 bg-bg-panel border-b border-border-main flex justify-between items-center shrink-0 min-w-0 overflow-x-auto no-scrollbar gap-2">
        <div className="flex items-center gap-2 shrink-0 min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted font-sans shrink-0">Instructions / Rules</span>
          {diffStats.total > 0 && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse font-sans" title={`${diffStats.added} added, ${diffStats.modified} modified since last run`}>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span>{diffStats.total} changes</span>
            </span>
          )}
        </div>
        <div className="flex gap-2 font-sans shrink-0">
          {/* Undo/Redo Controls */}
          <div className="flex bg-bg-surface/50 border border-border-main rounded items-center shrink-0">
            <button
              onClick={undoEdit}
              disabled={editHistoryIndex <= 0 || isRunning}
              className="p-1 hover:bg-bg-element disabled:opacity-30 rounded-l text-text-secondary transition-colors"
              title="Undo Edit"
              type="button"
            >
              <Undo2 size={11} />
            </button>
            <div className="w-px h-3 bg-border-main" />
            <button
              onClick={redoEdit}
              disabled={editHistoryIndex >= editHistory.length - 1 || isRunning}
              className="p-1 hover:bg-bg-element disabled:opacity-30 rounded-r text-text-secondary transition-colors"
              title="Redo Edit"
              type="button"
            >
              <Redo2 size={11} />
            </button>
          </div>

          <button 
            type="button"
            onClick={() => onOpenStudio?.()} 
            className="px-2 py-0.5 bg-primary-base/10 text-primary-base text-[9px] border border-primary-base/40 rounded hover:bg-primary-base/20 transition-colors flex items-center gap-1 font-bold"
            title="Open Advanced Rule Studio modal"
          >
            <Maximize2 size={10} /> Studio ↗
          </button>
          <button 
            onClick={autoFormatRules} 
            disabled={isRunning} 
            className="px-2 py-0.5 text-primary-base text-[9px] border border-primary-base/30 rounded hover:bg-primary-base/10 disabled:opacity-50 transition-colors flex items-center gap-1 font-bold"
            title="Auto-sort rules alphabetically by state and symbol, and prune redundant lines"
          >
            <Wand2 size={10} /> Format
          </button>
          {!isBulkMode && (
            <div className="flex gap-1 items-center">
              <button 
                onClick={addRule} 
                disabled={isRunning} 
                className="px-2 py-0.5 bg-green-900/30 text-green-500 text-[9px] border border-green-500/30 rounded hover:bg-green-900/50 disabled:opacity-50 transition-colors"
              >
                + Add Rule
              </button>
              <div className="relative">
                <button 
                  type="button"
                  onClick={() => setShowQuickAdd(!showQuickAdd)}
                  disabled={isRunning}
                  className="px-2 py-0.5 bg-green-900/10 text-green-500 text-[9px] border border-green-500/20 rounded hover:bg-green-900/30 disabled:opacity-50 transition-colors flex items-center gap-1 font-bold"
                  title="Insert Rule Templates"
                >
                  <Zap size={10} /> Quick Add <ChevronDown size={8} />
                </button>
                {showQuickAdd && (
                  <>
                    <div className="fixed inset-0 z-[90]" onClick={() => setShowQuickAdd(false)} />
                    <div className="absolute top-full left-0 mt-1 w-40 bg-bg-panel border border-border-main rounded shadow-xl z-[100] py-1">
                      {QUICK_TEMPLATES.map((tmpl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="w-full text-left px-3 py-1.5 text-[10px] text-text-primary hover:bg-bg-element transition-colors"
                          onClick={() => {
                            const newRules = tmpl.rules.map(r => ({ ...r, id: uuidv4() }));
                            const updatedRules = [...localRules, ...newRules];
                            setLocalRules(updatedRules);
                            setRules(updatedRules);
                            setShowQuickAdd(false);
                          }}
                        >
                          {tmpl.name}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
          <button 
            type="button"
            onClick={() => setShowStateColorsManager(!showStateColorsManager)} 
            className={`px-2 py-0.5 text-[9px] border rounded transition-all duration-150 flex items-center gap-1 font-bold uppercase tracking-wide ${
              showStateColorsManager 
                ? 'bg-amber-900/40 text-primary-base border-primary-base/40 hover:bg-amber-900/60' 
                : 'bg-[#1c2128] text-text-secondary border-border-main hover:bg-[#252c36]'
            }`}
            title="Manage custom background colors for individual states"
          >
            <Palette size={10} /> State Colors
          </button>
          <button 
            onClick={() => {
              if (isBulkMode) {
                const { rulesList, errors } = textToRules(bulkText);
                if (errors.length > 0) {
                  setBulkErrors(errors);
                  return;
                }
                setLocalRules(rulesList);
                setIsBulkMode(false);
              } else {
                setBulkText(rulesToText(localRules));
                setBulkErrors([]);
                setIsBulkMode(true);
              }
            }}
            disabled={isRunning}
            className={`px-2 py-0.5 text-[9px] border rounded transition-all duration-150 flex items-center gap-1 font-bold uppercase tracking-wide ${
              isBulkMode 
                ? 'bg-blue-900/40 text-blue-400 border-blue-500/40 hover:bg-blue-900/60' 
                : 'bg-[#1c2128] text-text-secondary border-border-main hover:bg-[#252c36]'
            }`}
            title="Toggle between structural card editor and plain text bulk edit"
          >
            {isBulkMode ? <Table size={10} /> : <FileText size={10} />}
            {isBulkMode ? 'Card Grid' : 'Bulk Edit'}
          </button>
          <button 
            onClick={saveRules} 
            disabled={(!hasChanges && !isBulkMode) || isRunning} 
            className={`px-2 py-0.5 text-[9px] border rounded transition-colors ${hasChanges ? 'bg-amber-900/30 text-primary-base border-primary-base/30 hover:bg-amber-900/50' : 'bg-transparent text-text-faint border-transparent'}`}
          >
            Save Changes
          </button>
        </div>
      </div>

      {showStateColorsManager && (
        <div className="mx-3 mt-2 mb-1 bg-bg-panel/95 backdrop-blur-sm border border-border-main/80 rounded-lg p-3 flex flex-col gap-2 font-sans text-xs animate-in fade-in slide-in-from-top-2 relative z-20 shadow-md">
          <div className="flex justify-between items-center border-b border-border-main/50 pb-2">
            <span className="font-bold text-text-primary uppercase tracking-wider text-[10px] flex items-center gap-1.5 font-sans">
              <Palette size={13} className="text-primary-base animate-pulse" />
              State Background Colors Editor
            </span>
            <button 
              onClick={() => setShowStateColorsManager(false)}
              className="text-text-muted hover:text-text-primary p-0.5 hover:bg-bg-element rounded transition-colors"
            >
              <X size={12} />
            </button>
          </div>
          
          <p className="text-[10px] text-text-muted">
            Customize colors for active states. Selected colors are automatically refreshed across state nodes in the diagram.
          </p>

          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto py-1 no-scrollbar pr-1">
            {uniqueStates.map(stateName => {
              const currentColor = activeScenario?.stateColors?.[stateName] || '#1f2937';
              const isSelected = selectedStateForColor === stateName;
              return (
                <button
                  type="button"
                  key={stateName}
                  onClick={() => setSelectedStateForColor(isSelected ? null : stateName)}
                  className={`px-2.5 py-1 rounded border text-[10px] font-mono font-bold flex items-center gap-1.5 transition-all outline-none ${
                    isSelected 
                      ? 'border-primary-base bg-primary-base/15 text-text-primary ring-1 ring-primary-base/30' 
                      : 'border-border-main bg-bg-surface hover:border-border-active text-text-secondary'
                  }`}
                >
                  <span 
                    className="w-2.5 h-2.5 rounded-full border border-black/30 shadow-inner shrink-0" 
                    style={{ backgroundColor: currentColor }} 
                  />
                  {stateName}
                </button>
              );
            })}
          </div>

          {selectedStateForColor && (
            <div className="bg-bg-surface border border-border-main/60 rounded-lg p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-text-primary">
                  Colors for state <code className="text-primary-base font-bold bg-bg-element px-1.5 py-0.5 rounded border border-border-main/40 font-mono">{selectedStateForColor}</code>:
                </span>
              </div>
              
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6b7280', '#1f2937'].map(color => (
                  <button
                    type="button"
                    key={color}
                    onClick={() => {
                      updateStateColor(selectedStateForColor, color);
                      playSubtleClick();
                    }}
                    className={`w-5.5 h-5.5 rounded-full border hover:scale-110 cursor-pointer transition-transform shadow-[0_1.5px_3px_rgba(0,0,0,0.3)] ${
                      (activeScenario?.stateColors?.[selectedStateForColor] || '#1f2937') === color 
                        ? 'border-white ring-1 ring-primary-base' 
                        : 'border-border-active'
                    }`}
                    style={{ backgroundColor: color }}
                    title={`Set color to ${color}`}
                  />
                ))}
                
                <div className="h-4 w-[1px] bg-border-main mx-1" />
                
                <div className="relative w-5.5 h-5.5 rounded-full overflow-hidden border border-border-active hover:scale-110 cursor-pointer transition-transform shadow-[0_1.5px_3px_rgba(0,0,0,0.3)] shrink-0">
                  <input
                    type="color"
                    className="absolute -top-2 -left-2 w-10 h-10 cursor-pointer"
                    value={activeScenario?.stateColors?.[selectedStateForColor] || '#1f2937'}
                    onChange={(e) => {
                      updateStateColor(selectedStateForColor, e.target.value);
                    }}
                    title="Choose a custom color from system picker"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {isBulkMode ? (
        <div className="flex-1 flex flex-col p-3 overflow-hidden gap-2 bg-bg-surface/50 h-full">
          <div className="flex justify-between items-start bg-[#11141a]/95 p-2.5 rounded border border-border-main text-[10px] shrink-0 leading-normal">
            <div className="text-text-secondary">
              <span className="font-bold text-[#3b82f6]">📝 Bulk Multi-line Rule Editor</span>
              <p className="text-text-muted mt-0.5">
                Paste or write rules line-by-line. Columns: <code className="bg-neutral-800 px-1 py-0.5 rounded text-blue-400 font-mono">CurrentState ReadSymbol WriteSymbol MoveDirection(L/R/S) NextState</code>
              </p>
              <p className="text-text-muted mt-0.5 leading-relaxed">
                Separated by tabs, commas or any spaces. Blanks are represented with <code className="text-amber-400 font-bold border border-amber-500/20 px-0.5 py-0.2 rounded font-mono">_</code>. Lines starting with <code className="text-text-faint">#</code> are comments.
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 pt-1.5 border-t border-border-main/30 text-[9px] font-sans">
                <span className="text-text-faint font-semibold uppercase tracking-wider">Changes since last run:</span>
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> <span className="text-emerald-400 font-semibold">New Rule</span></span>
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> <span className="text-blue-400 font-semibold">Modified Rule</span></span>
                {rulesAtLastRun && rulesAtLastRun.length > 0 ? (
                  <span className="text-text-muted/60 ml-auto italic">Tracking live differences</span>
                ) : (
                  <span className="text-text-muted/50 ml-auto italic">No run baseline set (click run to track changes)</span>
                )}
              </div>
            </div>

            {/* Pattern Injector Dropdown */}
            <div className="relative shrink-0 ml-4">
              <button
                type="button"
                onClick={() => {
                  setIsPatternsOpen(!isPatternsOpen);
                  playSubtleClick();
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#1b222d] hover:bg-[#232d3c] border border-border-main hover:border-[#4d5c6e] text-text-primary hover:text-white rounded font-medium transition-all shadow-md active:scale-95 text-[10px]"
              >
                <Wand2 className="w-3.5 h-3.5 text-primary-base animate-pulse" />
                <span>Insert Pattern</span>
                <ChevronDown className={`w-3 h-3 text-text-muted transition-transform duration-200 ${isPatternsOpen ? 'rotate-180' : ''}`} />
              </button>

              {isPatternsOpen && (
                <div className="fixed inset-0 z-30" onClick={() => setIsPatternsOpen(false)} />
              )}

              <AnimatePresence>
                {isPatternsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute right-0 mt-1.5 w-80 max-h-[380px] overflow-y-auto rounded-lg border border-border-main bg-[#11141a]/95 backdrop-blur-md shadow-2xl z-40 py-1 text-text-primary flex flex-col no-scrollbar"
                  >
                    <div className="px-3 py-2 border-b border-border-main/50 bg-[#090c10]/80 sticky top-0 backdrop-blur-md z-10 flex items-center justify-between">
                      <span className="font-bold text-[10px] text-text-muted uppercase tracking-wider">
                        Common TM Patterns
                      </span>
                      <span className="text-[9px] bg-[#3b82f6]/10 text-[#3b82f6] px-1.5 py-0.5 rounded font-medium border border-[#3b82f6]/20">
                        {RULE_PATTERNS.length} available
                      </span>
                    </div>

                    <div className="flex flex-col">
                      {RULE_PATTERNS.map((pattern, idx) => (
                        <div
                          key={idx}
                          className="px-3 py-2.5 border-b border-border-main/40 hover:bg-[#1a212d]/60 transition-colors flex flex-col gap-1.5 group"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-[11px] text-[#3b82f6] group-hover:text-[#60a5fa] transition-colors">
                              {pattern.name}
                            </span>
                          </div>
                          <p className="text-[9.5px] text-text-muted leading-relaxed">
                            {pattern.description}
                          </p>
                          <div className="flex gap-1.5 mt-1 justify-end opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => {
                                handleInsertPattern(pattern.content, 'replace');
                                setIsPatternsOpen(false);
                              }}
                              className="px-2 py-1 rounded text-[9px] bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium transition-all border border-red-500/20 hover:border-red-500/40"
                              title="Overwrite the entire editor text with this pattern"
                            >
                              Replace All
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleInsertPattern(pattern.content, 'append');
                                setIsPatternsOpen(false);
                              }}
                              className="px-2 py-1 rounded text-[9px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-medium transition-all border border-emerald-500/20 hover:border-emerald-500/40"
                              title="Append this pattern's rules to the end of the current code"
                            >
                              Append to End
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex-1 min-h-0 relative bg-[#0d1117] border border-border-main rounded-lg flex overflow-hidden outline-none focus-within:border-[#4d5c6e] focus-within:ring-1 focus-within:ring-[#4d5c6e] hover:border-text-faint/30 transition-all h-full">
            {/* Line Numbers Column */}
            <div
              ref={lineNumbersRef}
              className="w-10 select-none text-right text-text-faint/40 font-mono text-[11px] leading-relaxed py-3 bg-[#090d13] border-r border-border-main/50 overflow-hidden shrink-0 no-scrollbar flex flex-col"
              style={{
                fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
                margin: 0,
              }}
            >
              {bulkText.split('\n').map((line, idx) => {
                const diff = getLineDiffState(line, rulesAtLastRun);
                let textClass = "text-text-faint/30 pr-2";
                
                if (diff === 'added') {
                  textClass = "text-emerald-400 font-bold bg-emerald-500/10 border-r-[3px] border-emerald-500 pr-1.5";
                } else if (diff === 'modified') {
                  textClass = "text-blue-400 font-bold bg-blue-500/10 border-r-[3px] border-blue-500 pr-1.5";
                }
                
                return (
                  <div 
                    key={idx} 
                    className={`w-full block h-[18px] flex items-center justify-end ${textClass}`}
                    title={diff !== 'unchanged' ? `Rule was ${diff} since last run` : undefined}
                  >
                    {idx + 1}
                  </div>
                );
              })}
            </div>

            {/* Editor Workspace */}
            <div className="flex-1 relative overflow-hidden h-full">
              {/* Highlighted text layer underneath */}
              <pre
                ref={preRef}
                className="absolute inset-0 w-full h-full p-3 font-mono text-[11px] leading-relaxed pointer-events-none overflow-auto whitespace-pre text-text-primary select-none bg-transparent no-scrollbar"
                style={{
                  fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
                  margin: 0,
                  border: 'none',
                }}
              >
                <code>{highlightRulesText(bulkText)}</code>
              </pre>

              {/* Input text layer on top */}
              <textarea
                ref={textareaRef}
                onScroll={handleScroll}
                onKeyDown={handleKeyDown}
                onKeyUp={handleSelectionOrMovement}
                onSelect={handleSelectionOrMovement}
                onFocus={handleSelectionOrMovement}
                onClick={handleSelectionOrMovement}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setHoveredError(null)}
                onBlur={() => setTimeout(() => setAutocomplete(null), 150)}
                className="absolute inset-0 w-full h-full bg-transparent p-3 font-mono text-[11px] leading-relaxed resize-none outline-none z-10 whitespace-pre overflow-auto border-0 focus:ring-0"
                value={bulkText}
                onChange={(e) => handleTextChange(e.target.value)}
                disabled={isRunning}
                placeholder={`# Add custom Turing rules here:\n# State   Read  Write  Dir  NextState\nq0        0     1      R    q0\nq0        1     0      L    q1\nq1        _     A      S    halt`}
                style={{
                  fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
                  margin: 0,
                  border: 'none',
                  outline: 'none',
                  boxShadow: 'none',
                  color: 'transparent',
                  WebkitTextFillColor: 'transparent',
                  caretColor: 'var(--text-primary, #ffffff)',
                }}
                spellCheck={false}
              />

              {/* Autocomplete popup */}
              {autocomplete && popupPosition.visible && (
                <div 
                  className="absolute z-20 w-[155px] max-h-36 overflow-y-auto rounded-md border border-border-main bg-[#0d1117]/95 backdrop-blur-md shadow-2xl py-1 font-mono text-[10px] select-none flex flex-col no-scrollbar"
                  style={{ 
                    left: `${popupPosition.left}px`, 
                    top: `${popupPosition.top}px`,
                  }}
                >
                  {autocomplete.suggestions.map((item, idx) => {
                    const isSelected = idx === autocomplete.activeIndex;
                    const isSymbol = autocomplete.tokenIndex === 1 || autocomplete.tokenIndex === 2;
                    const alias = isSymbol ? symbolAliases[item] : undefined;
                    const itemColor = !isSymbol && activeScenario?.stateColors?.[item];
                    
                    return (
                      <div
                        key={item}
                        onMouseDown={(e) => {
                          e.preventDefault(); // Prevents textarea blur before selection triggers
                          applySuggestion(item);
                        }}
                        className={`cursor-pointer px-2 py-1 flex items-center justify-between transition-colors ${
                          isSelected 
                            ? 'bg-primary-base/20 text-primary-base font-bold' 
                            : 'text-text-primary hover:bg-[#1a212d]'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          {itemColor && (
                            <span 
                              className="w-1.5 h-1.5 rounded-full border border-black/40 shrink-0" 
                              style={{ backgroundColor: itemColor }} 
                            />
                          )}
                          <span className="truncate">{item === '_' ? 'Blank (_)' : item}</span>
                        </div>
                        {isSymbol && alias && (
                          <span className="text-[8px] text-text-muted italic ml-1 select-none">({alias})</span>
                        )}
                        {!isSymbol && (item === 'halt' || item === 'accept' || item === 'reject') && (
                          <span className="text-[8px] text-red-400 font-sans font-bold uppercase tracking-wider ml-1 select-none">exit</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Precise Syntax Error Tooltip */}
              <AnimatePresence>
                {hoveredError && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.1 }}
                    className="fixed z-50 w-[340px] rounded-lg border border-red-500/30 bg-[#0d1117]/95 backdrop-blur-md shadow-2xl p-3.5 text-xs select-none pointer-events-none flex flex-col gap-2 text-text-primary"
                    style={{
                      left: `${Math.min(window.innerWidth - 360, hoveredError.x + 16)}px`,
                      top: `${Math.min(window.innerHeight - 180, hoveredError.y + 16)}px`,
                    }}
                  >
                    <div className="flex items-center gap-2 pb-1.5 border-b border-border-main/50">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <span className="font-semibold text-red-400 text-[13px] tracking-tight">{hoveredError.title}</span>
                      <span className="ml-auto text-[10px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded border border-red-500/20 font-mono font-bold">
                        Line {hoveredError.line}
                      </span>
                    </div>

                    <p className="text-text-secondary leading-relaxed text-[11px]">
                      {hoveredError.message}
                    </p>

                    <div className="mt-1 bg-black/30 border border-border-main/30 rounded p-2 flex flex-col gap-1">
                      <span className="text-[9px] text-primary-base font-bold uppercase tracking-wider">
                        TM Formal Definition
                      </span>
                      <div className="font-mono text-[9.5px] text-text-muted leading-relaxed whitespace-pre-line">
                        {hoveredError.formalRef}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Action and Error HUD for Bulk Edit */}
          <div className="flex flex-col gap-2 shrink-0">
            {bulkErrors.length > 0 ? (
              <div className="bg-red-950/20 border border-red-500/20 text-red-400 p-2.5 rounded-lg text-[10px] max-h-24 overflow-y-auto font-sans font-semibold">
                <div className="font-bold flex items-center gap-1.5 mb-1 text-red-300">
                  <AlertTriangle size={12} className="text-red-400" />
                  <span>Formatting Errors Detected ({bulkErrors.length})</span>
                </div>
                <ul className="list-disc pl-4 space-y-0.5">
                  {bulkErrors.slice(0, 3).map((e, idx) => (
                    <li key={idx} className="break-words font-mono text-[10.5px]">{e}</li>
                  ))}
                  {bulkErrors.length > 3 && <li key="more">...and {bulkErrors.length - 3} more errors.</li>}
                </ul>
              </div>
            ) : (
              <div className="bg-emerald-950/20 border border-emerald-500/15 text-emerald-400 p-2.5 rounded-lg text-[10px] flex items-center gap-2 font-sans font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Format rules configuration parsed flawlessly! Ready to apply.</span>
              </div>
            )}

            <div className="flex gap-2 text-[10px] font-sans">
              <button
                type="button"
                onClick={() => {
                  const { rulesList, errors } = textToRules(bulkText);
                  if (errors.length > 0) {
                    setBulkErrors(errors);
                    return;
                  }
                  setLocalRules(rulesList);
                  setIsBulkMode(false);
                }}
                disabled={bulkErrors.length > 0 || isRunning}
                className="flex-1 bg-blue-900/35 hover:bg-blue-900/50 text-blue-400 border border-blue-500/30 font-bold py-1.5 rounded-md disabled:opacity-40 disabled:cursor-not-allowed transition-all uppercase tracking-wider text-[9px]"
                title="Saves and parses rules into the simulator table view"
              >
                Apply & Return to Cards
              </button>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(bulkText).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  });
                }}
                className="px-4 bg-[#1c2128] hover:bg-[#252c36] text-text-primary border border-border-main font-bold rounded-md transition-colors flex items-center gap-1 text-[9px] uppercase tracking-wider"
                title="Copies raw text rules to clipboard"
              >
                {copied ? 'Copied ✅' : 'Copy Content'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsBulkMode(false);
                  setBulkErrors([]);
                }}
                className="px-4 bg-red-950/20 hover:bg-red-900/30 text-red-400 border border-red-500/20 font-bold rounded-md transition-colors text-[9px] uppercase tracking-wider"
                title="Discard text corrections"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Search Input Bar and Auto-Scroll at the top */}
          <div className="px-3 py-2 bg-bg-panel/90 shrink-0 border-b border-border-main flex items-center justify-between gap-3 font-sans shadow-sm">
            <div className="flex items-center gap-2 flex-1 min-w-0 bg-[#0d1117] border border-border-main focus-within:border-amber-500/80 focus-within:ring-1 focus-within:ring-amber-500/20 rounded-md px-2.5 py-1 transition-all">
              <Search size={12} className="text-amber-500 shrink-0" />
              <input 
                type="text" 
                placeholder="Filter rules by state, read, or write symbol..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none focus:outline-none text-[10.5px] text-text-primary placeholder:text-text-muted/50 font-sans"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')} 
                  className="text-text-muted hover:text-text-primary transition-colors flex items-center justify-center w-4 h-4 rounded hover:bg-bg-element"
                >
                  <X size={10} />
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-1.5 shrink-0 pl-3 border-l border-border-main text-[9px] font-semibold text-text-muted h-5">
              <label className="flex items-center gap-1.5 cursor-pointer hover:text-text-secondary select-none transition-colors" title="Toggle automatic scrolling to active rule during simulation execution">
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  className="rounded border border-border-main bg-bg-surface text-amber-500 focus:ring-0 w-3 h-3 cursor-pointer accent-amber-500"
                />
                <span className={autoScroll ? "text-amber-500 font-bold" : ""}>Auto-Scroll</span>
              </label>
            </div>
          </div>

          {/* Validation Summary Panel */}
          {validationIssues.length > 0 && (
            <div className="mx-3 mt-2 bg-[#1c1212]/60 border border-red-500/20 rounded-lg overflow-hidden flex flex-col text-[10px] font-sans shadow-lg animate-in fade-in duration-300">
              <div className="flex items-center justify-between px-3 py-1.5 bg-red-950/30 border-b border-red-500/10">
                <div className="flex items-center gap-1.5 font-bold text-red-400">
                  <AlertTriangle size={12} className="text-red-400 shrink-0" />
                  <span>Validation Summary ({validationIssues.length} issues)</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[8px] text-text-faint font-semibold uppercase tracking-wider hidden sm:inline">Click to locate issue</span>
                  <button 
                    onClick={fixWithAI}
                    disabled={isFixingRules}
                    className="flex items-center gap-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isFixingRules ? (
                      <>
                        <Wand2 size={10} className="animate-pulse" /> Fixing...
                      </>
                    ) : (
                      <>
                        <Wand2 size={10} /> Fix with AI
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              <div className="max-h-[140px] overflow-y-auto divide-y divide-[#1c1212] select-none">
                {validationIssues.map(issue => {
                  const isConflict = issue.type === 'conflict';
                  const isLoop = issue.type === 'infinite_loop';
                  return (
                    <div
                      key={issue.id}
                      onClick={() => jumpToRule(issue.ruleId)}
                      className="w-full text-left px-3 py-2 flex items-start gap-2 hover:bg-red-950/20 cursor-pointer transition-colors font-mono text-[10px]"
                    >
                      <span className={`shrink-0 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wide leading-none font-sans ${
                        isConflict 
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                          : isLoop 
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {isConflict ? 'Conflict' : isLoop ? 'Loop' : 'Unreachable'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-text-primary font-bold flex items-center gap-1">
                          <span className={`${isConflict ? 'text-red-300' : isLoop ? 'text-purple-300' : 'text-amber-300'}`}>{issue.title}</span>
                          <span className="text-[8px] text-text-faint font-sans font-semibold">Row #{issue.ruleNum} ➜</span>
                        </div>
                        <p className="text-text-muted text-[9px] leading-relaxed mt-0.5 break-words">
                          {issue.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto text-[10px] p-2 overflow-x-auto w-full">
            <table className="w-full table-fixed min-w-[300px]">
              <thead className="text-text-muted border-b border-border-main text-left sticky top-0 bg-bg-surface z-10">
                <tr>
                  <th className="pb-1 font-normal w-6 text-center align-middle">
                    <div className="relative inline-flex items-center justify-center w-[11px] h-[11px] mt-1" title="Select all rules for bulk actions">
                      <input 
                        type="checkbox" 
                        className="peer absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        checked={selectedRules.size === filteredRules.length && filteredRules.length > 0}
                        onChange={toggleSelectAll}
                      />
                      <div className="w-full h-full bg-gray-500 rounded-sm border border-gray-500 peer-checked:bg-red-500 peer-checked:border-red-500 flex items-center justify-center transition-colors">
                        <svg width="8" height="8" viewBox="0 0 10 10" fill="none" className="opacity-0 peer-checked:opacity-100 transition-opacity"><path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                    </div>
                  </th>
                  <th className="pb-1 font-normal w-6"></th>
                  <th className="pb-1 font-normal w-6 text-center text-text-faint">#</th>
                  <th className="pb-1 font-normal w-1/5 pl-2">ST</th>
                  <th className="pb-1 font-normal w-[15%]">IN</th>
                  <th className="pb-1 font-normal w-[15%]">OUT</th>
                  <th className="pb-1 font-normal w-[15%]">MV</th>
                  <th className="pb-1 font-normal w-1/5">NST</th>
                  <th className="pb-1 font-normal w-[10%]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#161B22]">
                {filteredRules.map((rule, displayIndex) => {
                  const originalIndex = localRules.findIndex(r => r.id === rule.id);
                  const index = originalIndex !== -1 ? originalIndex : displayIndex;
                  const isLastRule = lastRuleId === rule.id;
                  const currentReadSymbol = (tape[headPosition] || '_').trim() || '_';
                  const isMatching = rule.currentState.trim() === currentState.trim() && 
                                     (rule.readSymbol.trim() || '_') === currentReadSymbol;
                  const isExecutingRow = (isRunning || isPaused) && isMatching;
                  const isActive = isExecutingRow || isLastRule;

                  const isConflicting = conflicts.has(rule.id);
                  const curStateTrimmed = rule.currentState.trim();
                  const isUnreachable = unreachableStates.has(curStateTrimmed) && curStateTrimmed !== '';
                  const isLoop = infiniteLoops.has(rule.id);
                  const isHighlighted = highlightedRuleId === rule.id;
                  const isHighlightedByState = highlightedState && (rule.currentState.trim() === highlightedState || rule.nextState.trim() === highlightedState);
                  
                  const diffState = (() => {
                    if (!rulesAtLastRun) return 'unchanged';
                    const matching = rulesAtLastRun.find(r => r.id === rule.id);
                    if (!matching) {
                      const matchingByKey = rulesAtLastRun.find(
                        r => r.currentState === rule.currentState && r.readSymbol === rule.readSymbol
                      );
                      return matchingByKey ? 'unchanged' : 'added';
                    }
                    const isChanged = 
                      matching.currentState !== rule.currentState ||
                      matching.readSymbol !== rule.readSymbol ||
                      matching.writeSymbol !== rule.writeSymbol ||
                      matching.moveDirection !== rule.moveDirection ||
                      matching.nextState !== rule.nextState ||
                      matching.enabled !== rule.enabled;
                    return isChanged ? 'modified' : 'unchanged';
                  })();

                  const getStateClass = (s: string) => {
                    const isInitial = s === activeScenario?.initialState || s === 'q0';
                    const lower = s.toLowerCase();
                    const isHalt = lower.includes('halt') || lower.includes('accept') || lower.includes('reject') || s === 'H';
                    if (isHalt) {
                      return 'bg-red-950/40 text-red-400 border-red-500/20 focus:bg-red-950/60 focus:border-red-400/80';
                    }
                    if (isInitial) {
                      return 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20 focus:bg-emerald-950/60 focus:border-emerald-400/80';
                    }
                    return 'bg-blue-950/40 text-blue-400 border-blue-500/20 focus:bg-blue-950/60 focus:border-blue-400/80';
                  };

                  const getSymbolClass = (s: string) => {
                    const sym = (s || '').trim();
                    if (sym === '_' || sym === '') {
                      return 'bg-neutral-900/50 text-text-faint border-neutral-800/40 focus:bg-neutral-800/50 focus:border-text-muted';
                    }
                    if (sym === '1') {
                      return 'bg-amber-950/40 text-amber-400 border-amber-500/20 focus:bg-amber-950/60 focus:border-amber-400/80';
                    }
                    if (sym === '0') {
                      return 'bg-orange-950/40 text-orange-400 border-orange-500/20 focus:bg-orange-950/60 focus:border-orange-400/80';
                    }
                    return 'bg-yellow-950/30 text-yellow-300 border-yellow-500/20 focus:bg-yellow-950/50 focus:border-yellow-300/80';
                  };

                  const getDirClass = (d: string) => {
                    if (d === 'L') {
                      return 'bg-purple-950/40 text-purple-400 border-purple-500/20 focus:bg-purple-950/60 focus:border-purple-400/80';
                    }
                    if (d === 'R') {
                      return 'bg-cyan-950/40 text-cyan-400 border-cyan-500/20 focus:bg-cyan-950/60 focus:border-cyan-400/80';
                    }
                    return 'bg-slate-900/50 text-slate-400 border-slate-800/30 focus:bg-slate-800/60 focus:border-slate-300';
                  };

                  return (
                    <tr 
                      key={rule.id} 
                      id={`rule-row-${rule.id}`}
                      draggable={!isRunning && !searchQuery && dragRowId === rule.id}
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      title={isHighlightedByState ? `State "${highlightedState}" is highlighted.\nThis rule means: If in state '${rule.currentState}' and reading symbol '${rule.readSymbol || '_'}', then write symbol '${rule.writeSymbol || '_'}', move ${rule.moveDirection === 'R' ? 'Right' : rule.moveDirection === 'L' ? 'Left' : 'Stay'}, and transition to state '${rule.nextState}'.` : undefined}
                      className={`transition-all duration-300 relative ${
                        draggedIndex === index
                          ? 'opacity-40 bg-[#161B22]/30 border-l-2 border-dashed border-primary-base'
                          : isConflicting
                            ? 'bg-red-500/10 ring-1 ring-red-500/30 border-l-2 border-red-500 z-10'
                            : (isHighlighted || isHighlightedByState)
                              ? 'bg-amber-500/25 ring-1 ring-amber-500/60 border-l-2 border-amber-500 shadow-md font-semibold scale-[1.01] z-10'
                              : isExecutingRow 
                                ? 'animate-fade-in-highlight border-l-4 border-primary-base shadow-lg shadow-primary-base/35 font-extrabold scale-[1.015] z-10 duration-150 ring-1 ring-primary-base/40' 
                                : diffState === 'added'
                                  ? 'bg-emerald-500/[0.03] border-l-2 border-emerald-500 hover:bg-emerald-500/[0.08]'
                                  : diffState === 'modified'
                                    ? 'bg-blue-500/[0.03] border-l-2 border-blue-500 hover:bg-blue-500/[0.08]'
                                    : (isLastRule ? 'bg-primary-base/5 shadow-sm' : 'hover:bg-bg-panel/40')
                      }`}
                    >
                      <td className="py-1.5 text-center leading-none align-middle">
                        <div className="relative inline-flex items-center justify-center w-[11px] h-[11px] mt-0.5" title="Select rule for bulk actions">
                          <input 
                            type="checkbox" 
                            className="peer absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            checked={selectedRules.has(rule.id)}
                            onChange={() => toggleSelectRule(rule.id)}
                          />
                          <div className="w-full h-full bg-gray-500 rounded-sm border border-gray-500 peer-checked:bg-red-500 peer-checked:border-red-500 flex items-center justify-center transition-colors">
                            <svg width="8" height="8" viewBox="0 0 10 10" fill="none" className="opacity-0 peer-checked:opacity-100 transition-opacity"><path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </div>
                        </div>
                      </td>
                      <td className="py-1.5 text-center text-text-faint select-none">
                        {!isRunning && !searchQuery ? (
                          <div 
                            onMouseDown={() => setDragRowId(rule.id)}
                            onMouseUp={() => setDragRowId(null)}
                            className="cursor-grab active:cursor-grabbing hover:text-text-primary transition-colors py-1"
                            title="Drag to reorder rules"
                          >
                            <GripVertical size={12} className="mx-auto" />
                          </div>
                        ) : (
                          <div title={isRunning ? "Cannot reorder while running" : "Cannot reorder while searching"}>
                            <GripVertical size={12} className="mx-auto opacity-20 cursor-not-allowed" />
                          </div>
                        )}
                      </td>
                      <td className="py-1.5 text-center text-text-faint border-r border-[#161B22]/50 relative">
                        {isExecutingRow && (
                          <div className="absolute left-0.5 top-1/2 -translate-y-1/2 text-primary-base flex items-center justify-center animate-pulse pointer-events-none" title="Currently executing">
                            <Zap size={11} className="drop-shadow-[0_0_8px_currentColor]" fill="currentColor" />
                          </div>
                        )}
                        {isConflicting ? (
                          <span className="absolute right-1 top-1/2 -translate-y-1/2 cursor-help" title={conflictMessages[rule.id]}>
                            <AlertTriangle 
                              size={10} 
                              strokeWidth={3}
                              className="text-red-500" 
                            />
                          </span>
                        ) : isLoop ? (
                          <span className="absolute right-1 top-1/2 -translate-y-1/2 cursor-help" title={loopMessages[rule.id]}>
                            <RotateCw 
                              size={10}
                              strokeWidth={3}
                              className="text-purple-500 animate-[spin_3s_linear_infinite]" 
                            />
                          </span>
                        ) : isUnreachable ? (
                          <span className="absolute right-1 top-1/2 -translate-y-1/2 cursor-help" title={`Unreachable state: No transitions lead to state "${curStateTrimmed}"`}>
                            <AlertCircle 
                              size={10}
                              strokeWidth={3}
                              className="text-amber-500" 
                            />
                          </span>
                        ) : null}
                        <span className={
                          isExecutingRow 
                            ? 'text-primary-base font-extrabold pl-2.5' 
                            : diffState === 'added'
                              ? 'text-emerald-400 font-bold'
                              : diffState === 'modified'
                                ? 'text-blue-400 font-bold'
                                : ''
                        }>{index + 1}</span>
                      </td>
                      <td className="py-1.5 pl-2 pr-1 opacity-100 transition-opacity" style={{ opacity: rule.enabled === false ? 0.4 : 1 }}>
                        <AutocompleteInput 
                          value={rule.currentState} 
                          onChange={val => updateRule(rule.id, 'currentState', val)}
                          disabled={isRunning}
                          field="currentState"
                          onClick={() => setHighlightedState(rule.currentState)}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setHighlightedState(highlightedState === rule.currentState ? null : rule.currentState);
                          }}
                          title={isConflicting ? conflictMessages[rule.id] : isUnreachable ? `Unreachable State Warning: No transitions lead to state "${curStateTrimmed}". This code block cannot execute.` : undefined}
                          className={`w-full bg-transparent border focus:outline-none rounded px-2 py-0.5 text-[11px] font-mono leading-normal transition-all duration-150 ${
                            isConflicting 
                              ? 'border-red-500 text-red-200 bg-red-950/40 focus:bg-red-950/60 shadow-[0_0_4px_rgba(239,68,68,0.3)]' 
                              : isUnreachable 
                                ? 'border-amber-500 border-b-2 border-x-transparent border-t-transparent text-amber-300 bg-amber-950/20 focus:bg-amber-950/40' 
                                : getStateClass(rule.currentState)
                          }`}
                          suggestions={uniqueStates}
                          symbolAliases={symbolAliases}
                          stateColor={activeScenario?.stateColors?.[rule.currentState]}
                          stateColors={activeScenario?.stateColors}
                        />
                      </td>
                      <td className="py-1.5 px-1 opacity-100 transition-opacity" style={{ opacity: rule.enabled === false ? 0.4 : 1 }}>
                        <AutocompleteInput 
                          value={rule.readSymbol} 
                          onChange={val => updateRule(rule.id, 'readSymbol', val)}
                          disabled={isRunning}
                          maxLength={1}
                          field="readSymbol"
                          title={isConflicting ? conflictMessages[rule.id] : undefined}
                          className={`w-full bg-transparent border focus:outline-none rounded px-1 py-0.5 text-center text-[11px] font-mono font-bold transition-all duration-150 ${
                            isConflicting 
                              ? 'border-red-500 text-red-200 bg-red-950/40 focus:bg-red-950/60 shadow-[0_0_4px_rgba(239,68,68,0.3)]' 
                              : getSymbolClass(rule.readSymbol)
                          }`}
                          suggestions={uniqueSymbols}
                          symbolAliases={symbolAliases}
                        />
                      </td>
                      <td className="py-1.5 px-1 opacity-100 transition-opacity" style={{ opacity: rule.enabled === false ? 0.4 : 1 }}>
                        <AutocompleteInput 
                          value={rule.writeSymbol} 
                          onChange={val => updateRule(rule.id, 'writeSymbol', val)}
                          disabled={isRunning}
                          maxLength={1}
                          field="writeSymbol"
                          className={`w-full bg-transparent border border-transparent focus:outline-none rounded px-1 py-0.5 text-center text-[11px] font-mono font-bold transition-all duration-150 ${getSymbolClass(rule.writeSymbol)}`}
                          suggestions={uniqueSymbols}
                          symbolAliases={symbolAliases}
                        />
                      </td>
                      <td className="py-1.5 px-1 opacity-100 transition-opacity" style={{ opacity: rule.enabled === false ? 0.4 : 1 }}>
                        <select 
                          value={rule.moveDirection}
                          onChange={e => updateRule(rule.id, 'moveDirection', e.target.value as Direction)}
                          disabled={isRunning}
                          className={`w-full bg-transparent border border-transparent focus:outline-none rounded px-1 py-0.5 text-center text-[11px] font-mono font-bold transition-all duration-150 cursor-pointer appearance-none ${getDirClass(rule.moveDirection)}`}
                        >
                          <option className="bg-[#0f141c] text-purple-400" value="L">L</option>
                          <option className="bg-[#0f141c] text-cyan-400" value="R">R</option>
                          <option className="bg-[#0f141c] text-slate-400" value="S">-</option>
                        </select>
                      </td>
                      <td className="py-1.5 pl-1 pr-2 opacity-100 transition-opacity" style={{ opacity: rule.enabled === false ? 0.4 : 1 }}>
                        <AutocompleteInput 
                          value={rule.nextState} 
                          onChange={val => updateRule(rule.id, 'nextState', val)}
                          onClick={() => setHighlightedState(rule.nextState)}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setHighlightedState(highlightedState === rule.nextState ? null : rule.nextState);
                          }}
                          disabled={isRunning}
                          field="nextState"
                          className={`w-full bg-transparent border border-transparent focus:outline-none rounded px-2 py-0.5 text-[11px] font-mono leading-normal transition-all duration-150 ${getStateClass(rule.nextState)}`}
                          suggestions={uniqueStates}
                          symbolAliases={symbolAliases}
                          stateColor={activeScenario?.stateColors?.[rule.nextState]}
                          stateColors={activeScenario?.stateColors}
                        />
                      </td>
                      <td className="py-1 text-right pr-1">
                        <button onClick={() => removeRule(rule.id)} disabled={isRunning} className="text-red-900/50 hover:text-red-500 disabled:opacity-50 transition-colors">
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
      {selectedRules.size > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#0d1117] shadow-[0_4px_24px_rgba(0,0,0,0.5)] border border-border-main rounded-full py-2 px-5 flex items-center gap-4 z-50 animate-fade-in text-sm">
          <div className="font-medium text-text-primary">
            {selectedRules.size} selected
          </div>
          <div className="w-[1px] h-4 bg-border-main" />
          <button 
            onClick={() => handleBulkToggleEnable(true)}
            className="flex items-center gap-1.5 text-text-secondary hover:text-emerald-400 transition-colors"
          >
            <Eye size={14} /> Enable
          </button>
          <button 
            onClick={() => handleBulkToggleEnable(false)}
            className="flex items-center gap-1.5 text-text-secondary hover:text-amber-400 transition-colors"
          >
            <EyeOff size={14} /> Disable
          </button>
          <div className="w-[1px] h-4 bg-border-main" />
          <button 
            onClick={handleBulkDelete}
            className="flex items-center gap-1.5 text-text-secondary hover:text-red-400 transition-colors"
          >
            <Trash2 size={14} /> Delete
          </button>
          <div className="w-[1px] h-4 bg-border-main" />
          <button 
            onClick={() => setSelectedRules(new Set())}
            className="flex items-center text-text-secondary hover:text-text-primary transition-colors"
            title="Clear selection"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};
