import React, { useMemo, useEffect, useCallback } from 'react';
import { ReactFlow, Controls, ControlButton, Background, Node, Edge, MarkerType, useReactFlow, ReactFlowProvider, NodeChange, applyNodeChanges, MiniMap, Connection, getNodesBounds, getViewportForBounds, Panel, useOnViewportChange } from '@xyflow/react';
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force';
import { motion } from 'motion/react';
import { Save, ChevronDown, Trash2, Camera, X, HelpCircle, BrainCircuit, Maximize, Map as MapIcon, Flame, List, ArrowRightLeft, LayoutGrid, Undo2, MousePointerClick, Crosshair, Grid, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { toPng } from 'html-to-image';
import '@xyflow/react/dist/style.css';
import { useTMStore } from '../../store/tmStore';
import { useThemeStore } from '../../store/themeStore';

import SmartNode from './SmartNode';
import SmartEdge from './SmartEdge';
import SmartConnectionLine from './SmartConnectionLine';
import { TMRule } from '../../types/tm';

const nodeTypes = { custom: SmartNode };
const edgeTypes = { smart: SmartEdge };

const getScenarioExplanation = (id: string, rulesList: TMRule[] = [], activeScenario: any = null) => {
  switch (id) {
    case "binary-palindrome":
      return (
        <div className="space-y-4 font-sans text-xs">
          <p className="text-text-primary font-semibold leading-relaxed">
            The **Binary Palindrome Detector** checks whether a string of 1s and 0s reads the same forwards and backwards. To achieve this in the constraint of a single tape scanning head, the machine employs a recursive "peel-off" strategy.
          </p>
          <div className="border-l-2 border-primary-base/40 pl-3.5 space-y-3">
             <div>
                <span className="font-bold text-text-primary uppercase tracking-wide text-[10px] block">1. Read and Store Leftmost Symbol (State: start)</span>
                <p className="mt-1">
                  The head starts at the leftmost character of the remaining string. If it sees a <code className="bg-neutral-800 text-amber-400 px-1 py-0.5 rounded font-mono font-bold">0</code>, it deletes it (writes <code className="bg-neutral-800 text-green-400 px-1 py-0.5 rounded font-mono font-bold">_</code>) and goes into state <code className="text-primary-base font-semibold">have_0</code>. If it sees a <code className="bg-neutral-800 text-amber-400 px-1 py-0.5 rounded font-mono font-bold">1</code>, it deletes it and enters state <code className="text-primary-base font-semibold">have_1</code>. If it sees a blank <code className="bg-neutral-800 text-text-muted px-1 py-0.5 font-mono">_</code>, the entire string was successfully paired up and it immediately accepts.
                </p>
             </div>
             <div>
                <span className="font-bold text-text-primary uppercase tracking-wide text-[10px] block font-sans">2. Travel To Right Edge (States: have_0, have_1)</span>
                <p className="mt-1">
                  In either state, the head moves rightwards, shifting past all other characters on the tape without modifying them. It is seeking the blank space <code className="bg-neutral-800 text-text-muted px-1.5 py-0.5 font-mono rounded">_</code> that marks the end of the current sequence.
                </p>
             </div>
             <div>
                <span className="font-bold text-text-primary uppercase tracking-wide text-[10px] block">3. Matching and Verification (States: match_0, match_1)</span>
                <p className="mt-1">
                  Upon detecting the boundary blank space on the right, the head takes one step back to the left, entering <code className="text-primary-base font-semibold font-mono">match_0</code> or <code className="text-primary-base font-semibold font-mono">match_1</code>.
                  It reads the symbol. If the symbol matches the state (<code className="bg-amber-400/10 text-amber-400 px-1 py-0.5 rounded font-mono font-bold">0</code> for <code className="font-mono">match_0</code>, <code className="bg-emerald-400/10 text-emerald-400 px-1 py-0.5 rounded font-mono font-bold">1</code> for <code className="font-mono">match_1</code>), the check for this outer boundary pair succeeds! It replaces that matched character with a blank <code className="bg-neutral-800 text-text-muted px-1 py-0.5 font-mono">_</code> and transitions to look for the next pair. If they do not match, the machine does not have any matching rules and will halt and reject.
                </p>
             </div>
             <div>
                <span className="font-bold text-text-primary uppercase tracking-wide text-[10px] block">4. Reset and Repeat (State: back)</span>
                <p className="mt-1">
                  Once a pair has been successfully matched on both ends, state <code className="text-primary-base font-semibold">back</code> moves the head leftward across all symbols until it returns to the leftmost blank space <code className="bg-neutral-800 text-text-muted px-1 py-0.5 font-mono">_</code>. At this point, the head takes one step to the right (putting it at the first character of the smaller interior substring) and transfers control back to the <code className="text-primary-base font-semibold">start</code> state to repeat the outer-ends matching loop.
                </p>
             </div>
          </div>
          <p className="text-text-muted text-[10px]">
            💡 **Core Rule of Turing Computability:** Because it modifies the tape and steps recursively, it can determine palindrome properties for any length string in $O(N^2)$ head movements.
          </p>
        </div>
      );

    case "unary-addition":
      return (
        <div className="space-y-4 font-sans text-xs">
          <p className="text-text-primary font-semibold leading-relaxed">
            The **Unary Addition** program integrates two positive numbers together. In unary representation, numbers are strings of <code className="bg-neutral-800 text-amber-400 px-1 py-0.5 rounded font-mono">1</code>s, and they are separated by a <code className="bg-neutral-800 text-red-400 px-1 py-0.5 rounded font-mono">0</code> separator (e.g. $3 + 2$ is written as <code className="font-mono bg-[#11141a] px-1.5 py-0.5 rounded text-primary-base">111011</code>).
          </p>
          <div className="border-l-2 border-primary-base/40 pl-3.5 space-y-3">
             <div>
                <span className="font-bold text-text-primary uppercase tracking-wide text-[10px] block font-sans">1. Locate the Separator (State: q0)</span>
                <p className="mt-1">
                  The head begins at the left edge. Acting in state <code className="text-primary-base font-semibold">q0</code>, it moves right, keeping the initial <code className="bg-neutral-800 px-1 rounded font-mono">1</code>s unchanged, seeking the middle zero separator.
                </p>
             </div>
             <div>
                <span className="font-bold text-text-primary uppercase tracking-wide text-[10px] block">2. Bridge the Gap (State: q0 ➜ q1)</span>
                <p className="mt-1">
                  When the head reads the separator <code className="bg-neutral-800 text-amber-400 px-1 py-0.5 rounded font-mono">0</code>, it overrides it with a value of <code className="bg-neutral-800 text-emerald-400 px-1 py-0.5 rounded font-mono">1</code> and transitions to state <code className="text-primary-base font-semibold">q1</code>. This physical change bridges both unary numbers into a singular unbroken string of <code className="font-mono">1</code>s. However, doing so adds one excess <code className="font-mono">1</code> count to the mathematical sum, which must be subtracted later.
                </p>
             </div>
             <div>
                <span className="font-bold text-text-primary uppercase tracking-wide text-[10px] block">3. Seek Right Boundary (State: q1 ➜ q2)</span>
                <p className="mt-1">
                  In state <code className="text-primary-base font-semibold font-sans">q1</code>, the head scans rightward through the second number, arriving at the terminating blank space <code className="bg-neutral-800 text-text-muted px-1.5 py-0.5 font-mono rounded">_</code>. Upon reading <code className="font-mono text-text-muted">_</code>, it steps one cell back to the left into state <code className="text-primary-base font-semibold">q2</code>.
                </p>
             </div>
             <div>
                <span className="font-bold text-text-primary uppercase tracking-wide text-[10px] block">4. Compensation Trim (State: q2 ➜ qf)</span>
                <p className="mt-1">
                  In state <code className="text-primary-base font-semibold">q2</code>, the head is positioned over the very last <code className="bg-neutral-800 px-1 rounded font-mono">1</code> in the continuous block. It overwrites this <code className="bg-neutral-800 px-1 rounded font-mono">1</code> with a blank space <code className="bg-neutral-800 text-text-muted px-1.5 py-0.5 font-mono rounded">_</code>, which safely removes the extra unit introduced in step 2. The computation now represents the correct sum ($a + b$), and the machine reaches the accept state <code className="text-primary-base font-semibold">qf</code>.
                </p>
             </div>
          </div>
        </div>
      );

    case "busy-beaver-3":
      return (
        <div className="space-y-4 font-sans text-xs">
          <p className="text-text-primary font-semibold leading-relaxed">
            The **3-State Busy Beaver** is an exploration of the Turing Machine Halting Problem. It begins on an entirely blank tape (<code className="font-mono">_</code>) with states <code className="text-primary-base font-bold">A</code>, <code className="text-primary-base font-bold">B</code>, and <code className="text-primary-base font-bold">C</code>. The rule criteria require the machine to execute as many steps as possible and leave the maximum number of <code className="bg-neutral-800 px-1 rounded text-emerald-400 font-mono font-bold">1</code>s on the tape before halting on state <code className="text-primary-base font-bold font-mono">H</code>.
          </p>
          <div className="border-l-2 border-primary-base/40 pl-3.5 space-y-2.5">
             <p className="font-mono">
               - <span className="font-bold text-text-primary font-sans">State A</span>: If reading <code className="font-mono text-text-muted">_</code>, writes <code className="font-mono text-emerald-400 font-bold">1</code>, moves right to state <code className="text-amber-400 font-semibold">B</code>. If reading <code className="font-mono text-emerald-400 font-bold">1</code>, transitions to accept/halt state <code className="text-red-400 font-bold">H</code>.
             </p>
             <p className="font-mono">
               - <span className="font-bold text-text-primary font-sans">State B</span>: If reading <code className="font-mono text-text-muted">_</code>, writes <code className="font-mono text-emerald-400 font-bold">1</code>, moves left to state <code className="text-purple-400 font-semibold">C</code>. If reading <code className="font-mono text-emerald-400 font-bold">1</code>, stays in state <code className="text-amber-400 font-semibold">B</code> and moves right.
             </p>
             <p className="font-mono">
               - <span className="font-bold text-text-primary font-sans">State C</span>: If reading <code className="font-mono text-text-muted">_</code>, writes <code className="font-mono text-emerald-400 font-bold">1</code>, moves left (loops in state <code className="text-purple-400 font-semibold">C</code>). If reading <code className="font-mono text-emerald-400 font-bold">1</code>, transitions back to start state <code className="text-blue-400 font-semibold">A</code> and moves left.
             </p>
          </div>
          <p className="mt-2 text-text-muted font-bold text-[10px]">
            This program acts as a chaotic finite automaton that will run for exactly 14 steps, writing a total of 6 non-blank ones before safely halting!
          </p>
        </div>
      );

    case "binary-increment":
      return (
        <div className="space-y-4 font-sans text-xs">
          <p className="text-text-primary font-semibold leading-relaxed">
            The **Binary Increment** machine adds exactly 1 to an arbitrary-length binary number. In binary math, addition starts at the least significant bit (LSB) on the far right.
          </p>
          <div className="border-l-2 border-primary-base/40 pl-3.5 space-y-3">
             <div>
                <span className="font-bold text-text-primary uppercase tracking-wide text-[10px] block">1. Navigation to the End (State: find_end)</span>
                <p className="mt-1">
                  The head starts at the leftmost bit. In state <code className="text-primary-base font-semibold">find_end</code>, it scans rightward, passing over all <code className="font-mono font-bold">0</code>s and <code className="font-mono font-bold">1</code>s without modifying them. It triggers a change when it encounters the trailing blank space <code className="bg-neutral-800 text-text-muted px-1.5 py-0.5 rounded font-mono">_</code>, stepping back left into state <code className="text-primary-base font-semibold">add_one</code>.
                </p>
             </div>
             <div>
                <span className="font-bold text-text-primary uppercase tracking-wide text-[10px] block">2. Carrying the Bit (State: add_one)</span>
                <p className="mt-1">
                  Cruising leftwards in state <code className="text-primary-base font-semibold">add_one</code>:
                </p>
                <ul className="list-disc pl-4 mt-1 space-y-1 text-text-secondary">
                  <li>Reading a <code className="bg-neutral-800 text-amber-400 px-1.5 py-0.2 rounded font-mono font-bold">1</code>: A mathematical carry has occurred. The machine outputs <code className="bg-neutral-800 text-emerald-400 px-1.5 py-0.2 rounded font-mono font-bold">0</code>, stays in state <code className="text-primary-base font-semibold">add_one</code>, and steps left to carry over to the next digit.</li>
                  <li>Reading a <code className="bg-neutral-800 text-amber-400 px-1.5 py-0.2 rounded font-mono font-bold">0</code>: The carry is resolved. The machine overwrites it with <code className="bg-neutral-800 text-emerald-400 px-1.5 py-0.2 rounded font-mono font-bold">1</code> and transitions immediately to <code className="text-primary-base font-semibold font-mono">accept</code>.</li>
                  <li>Reading a blank <code className="bg-neutral-800 text-text-muted px-1.5 py-0.2 rounded font-mono">_</code>: The carry reached past the primary number (e.g. incrementing 111 to 1000). The machine writes <code className="bg-neutral-800 text-emerald-400 px-1.5 py-0.2 rounded font-mono font-bold">1</code> on this new spot and enters the <code className="text-primary-base font-semibold font-mono">accept</code> state.</li>
                </ul>
             </div>
          </div>
        </div>
      );

    case "binary-decrement":
      return (
        <div className="space-y-4 font-sans text-xs">
          <p className="text-text-primary font-semibold leading-relaxed">
            The **Binary Decrement** machine subtracts 1 from a binary number.
          </p>
          <div className="border-l-2 border-primary-base/40 pl-3.5 space-y-3">
             <div>
                <span className="font-bold text-text-primary uppercase tracking-wide text-[10px] block">1. Navigate to the LSB (State: find_end)</span>
                <p className="mt-1">
                  The head rolls past all numbers to locate the right-most blank space, then steps back left onto the least significant digit, switching to state <code className="text-primary-base font-semibold font-mono">sub_one</code>.
                </p>
             </div>
             <div>
                <span className="font-bold text-text-primary uppercase tracking-wide text-[10px] block">2. Borrowing Subtraction (State: sub_one)</span>
                <p className="mt-1">
                  Scanning leftward in <code className="font-mono">sub_one</code>:
                </p>
                <ul className="list-disc pl-4 mt-1 space-y-1">
                  <li>If reading a <code className="font-mono font-bold">0</code>, the machine must borrow. It flips it to a <code className="font-mono text-emerald-400 font-bold">1</code> and continues moving left in state <code className="text-primary-base font-semibold font-mono font-bold">sub_one</code>.</li>
                  <li>If reading a <code className="font-mono font-bold">1</code>, the subtraction borrow is satisfied. It flips it to a <code className="font-mono text-amber-400">0</code> and immediately transitions to state <code className="text-primary-base font-semibold font-mono">accept</code>.</li>
                </ul>
             </div>
          </div>
        </div>
      );

    case "bit-inverter":
      return (
        <div className="space-y-4 font-sans text-xs">
          <p className="text-text-primary font-semibold leading-relaxed">
            The **Bit Inverter (NOT Gate)** is a straightforward sequential filter. It demonstrates element-wise boolean negation on the tape.
          </p>
          <div className="border-l-2 border-primary-base/40 pl-3.5 space-y-2">
             <p>
               - While in state <code className="text-primary-base font-bold font-mono">invert</code>, the head scans from left to right.
             </p>
             <p>
               - Reading any <code className="bg-neutral-800 text-amber-400 px-1.5 py-0.5 rounded font-mono font-bold">0</code> causes the machine to replace it with <code className="bg-emerald-990/40 text-emerald-400 px-1.5 font-bold rounded font-mono">1</code> and shift right.
             </p>
             <p>
               - Reading any <code className="bg-neutral-800 text-amber-400 px-1.5 py-0.5 rounded font-mono font-bold">1</code> causes the machine to replace it with <code className="bg-emerald-990/40 text-emerald-400 px-1.5 font-bold rounded font-mono">0</code> and shift right.
             </p>
             <p>
               - Upon encountering the terminating empty blank space <code className="bg-neutral-800 text-text-muted px-1.5 py-0.5 rounded font-mono">_</code>, the entire sequence has been processed. The machine transitions to <code className="text-primary-base font-bold font-mono">accept</code> and stops.
             </p>
          </div>
        </div>
      );

    case "copy-unary":
      return (
        <div className="space-y-4 font-sans text-xs">
          <p className="text-text-primary font-semibold leading-relaxed">
            The **Copy Unary String** machine duplicates a series of <code className="font-mono">1</code>s onto another segment of tape, leaving a blank separator.
          </p>
          <div className="border-l-2 border-primary-base/40 pl-3.5 space-y-3">
             <div>
                <span className="font-bold text-text-primary uppercase tracking-wide text-[10px] block">1. Mark Leftmost Uncopied Item (State: q0)</span>
                <p className="mt-1">
                  The head scans from the left. Upon finding the first un-copied <code className="font-mono font-bold">1</code>, it marks it temporarily as an <code className="font-mono text-purple-400 font-bold">X</code>, and transitions to state <code className="text-primary-base font-semibold font-mono">q1</code>.
                </p>
             </div>
             <div>
                <span className="font-bold text-text-primary uppercase tracking-wide text-[10px] block font-sans">2. Skip Rightward To Destination (States: q1, q2)</span>
                <p className="mt-1">
                  The machine travels right through all remaining <code className="font-mono">1</code>s (in state <code className="font-mono">q1</code>), then crosses the separator blank <code className="font-mono text-text-muted">_</code> (entering state <code className="font-mono">q2</code>), skipping already copied digits until it encounters the first empty blank space on the right.
                </p>
             </div>
             <div>
                <span className="font-bold text-text-primary uppercase tracking-wide text-[10px] block font-sans">3. Write Duplicate Bit and Return (States: q2 ➜ q3 ➜ q4)</span>
                <p className="mt-1">
                  It writes down a new <code className="font-mono text-emerald-400 font-bold">1</code> to record the duplicate, and turns around, entering state <code className="font-mono">q3</code> / <code className="font-mono">q4</code>, sliding back leftwards across all digits until it locates the temporary checkpoint marker <code className="font-mono text-purple-400 font-bold">X</code>.
                </p>
             </div>
             <div>
                <span className="font-bold text-text-primary uppercase tracking-wide text-[10px] block font-sans">4. Restore Tape (State: q5)</span>
                <p className="mt-1">
                  When state <code className="font-mono">q0</code> finds a blank space instead of a <code className="font-mono">1</code>, it knows all data has been successfully copied. It enters state <code className="font-mono text-primary-base font-semibold">q5</code>, moving leftward across the tape to find all <code className="font-mono">X</code> placeholders and restore them back into pristine original <code className="font-mono text-emerald-400">1</code>s, before halting on <code className="text-primary-base font-semibold font-mono">halt</code>.
                </p>
             </div>
          </div>
        </div>
      );

    case "shift-right":
    case "move-tape":
      return (
        <div className="space-y-4 font-sans text-xs">
          <p className="text-text-primary font-semibold leading-relaxed">
            The **Shift Right** machine physically slides a full binary string on the tape one coordinate to the right.
          </p>
          <div className="border-l-2 border-primary-base/40 pl-3.5 space-y-3">
             <p>
               - State <code className="text-primary-base font-bold font-mono">read</code> acts as the dispatcher. It reads the leftmost bit, replaces it with a blank space <code className="font-mono">_</code>, and dynamically transitions to state <code className="text-primary-base font-bold font-mono">write_0</code> (if it read a 0) or <code className="text-primary-base font-bold font-mono">write_1</code> (if it read a 1) while advancing right.
             </p>
             <p>
               - While state <code className="text-primary-base font-semibold font-mono">write_0</code> or <code className="text-primary-base font-semibold font-mono">write_1</code> holds the current bit context in memory:
               It looks at the next bit. It writes down the stored bit we had in memory, and triggers a state swap to store the newly read bit instead, stepping right.
             </p>
             <p>
               - If it reads a blank space <code className="font-mono">_</code>, it has reached the shift expansion zone. It outputs the last saved bit from its active state memory onto this blank index, transitions left back to state <code className="text-primary-base font-bold font-mono">read</code> to search for other remaining elements.
             </p>
          </div>
        </div>
      );

    case "find-pattern":
      return (
        <div className="space-y-4 font-sans text-xs">
          <p className="text-text-primary font-semibold leading-relaxed">
            The **Pattern Matcher** searches the tape from left to right for two consecutive <code className="font-mono font-bold">1</code> characters (the string '11').
          </p>
          <div className="border-l-2 border-primary-base/40 pl-3.5 space-y-3">
             <p>
               - State <code className="text-primary-base font-bold font-mono">start</code> scans right. If it sees a <code className="font-mono">0</code>, it remains in <code className="text-primary-base font-semibold font-mono">start</code> and keeps moving.
             </p>
             <p>
               - Once state <code className="text-primary-base font-semibold font-mono">start</code> detects a <code className="font-mono text-amber-300 font-bold">1</code>, it transitions to state <code className="text-primary-base font-semibold font-mono">seen_one</code> and steps right.
             </p>
             <p>
               - In state <code className="text-primary-base font-bold font-mono">seen_one</code>:
               If the next bit is also a <code className="font-mono text-emerald-400 font-bold">1</code>, we have matched our pattern! The machine transitions to accept state <code className="text-primary-base font-bold font-mono">found</code>.
               If the next bit is a <code className="font-mono">0</code>, the consecutive pattern is broken. The machine returns to <code className="text-primary-base font-semibold font-mono">start</code> and resumes hunting.
             </p>
          </div>
        </div>
      );

    case "clear-tape":
      return (
        <div className="space-y-4 font-sans text-xs">
          <p className="text-text-primary font-semibold leading-relaxed">
            The **Clear Tape** machine acts as a wiping card, removing all elements (0s and 1s) from the tape.
          </p>
          <p>
            It loops repeatedly in the single active state <code className="text-primary-base font-bold font-mono">clear</code>, traveling rightward across the tape. When it reads a <code className="font-mono">0</code> or a <code className="font-mono">1</code>, it writes an empty blank space <code className="font-mono text-text-muted">_</code> in its place and advances right. When it meets a blank space <code className="font-mono text-text-muted">_</code>, the tape is clean, and the machine halts on accept.
          </p>
        </div>
      );

    case "duplicate-char":
      return (
        <div className="space-y-4 font-sans text-xs">
          <p className="text-text-primary font-semibold leading-relaxed">
            The **Character Duplicator** duplicates all existing characters, shifting the working stream.
          </p>
          <p>
            It uses <code className="font-mono text-purple-400 font-bold">X</code> (for 1) and <code className="font-mono text-purple-400 font-bold">Y</code> (for 0) as temporary processed markers inside state <code className="text-primary-base font-semibold font-mono">read</code>.
            It shifts to the right boundary (in states <code className="font-mono">dup1</code> or <code className="font-mono font-bold">dup0</code>) to write matching characters at the sequence tail, then rolls back in state <code className="font-mono text-primary-base font-semibold font-mono">back</code> until it returns to the last marked cell to duplicate the next sequence character. Temporary <code className="font-mono">X</code>/<code className="font-mono">Y</code> items are fully restored to original states at the end in state <code className="font-mono text-primary-base font-semibold font-mono">cleanup</code>.
          </p>
        </div>
      );

    case "binary-equal":
      return (
        <div className="space-y-4 font-sans text-xs">
          <p className="text-text-primary font-semibold leading-relaxed">
            The **Binary Equality Checker** compares two strings of bits separated by a <code className="font-mono">#</code> (e.g. <code className="font-mono">10#10</code>) to verify if they are mathematically identical.
          </p>
          <div className="border-l-2 border-primary-base/40 pl-3.5 space-y-3">
             <p>
               - State <code className="text-primary-base font-bold font-mono">read</code> consumes the next unchecked character on the left, replaces it with a marker index <code className="font-mono font-bold text-purple-400">X</code>, and travels past the <code className="font-mono font-bold">#</code> boundary.
             </p>
             <p>
               - Depending on if it read a 0 or 1, it enters state <code className="text-primary-base font-semibold font-mono">find0</code> or <code className="text-primary-base font-semibold font-mono">find1</code> on the right side of the tape, leaping past already checked characters, searching for a matching digit.
             </p>
             <p>
               - If it finds a mismatch, the machine fails and halts. If it finds the correct matching symbol, it overwrites it with an <code className="font-mono font-bold">X</code> marker, and uses state <code className="text-primary-base font-semibold font-mono">back</code> and <code className="text-primary-base font-semibold font-mono">backto_start</code> to return the head leftward to seek the next unchecked character.
             </p>
          </div>
        </div>
      );

    case "find-middle":
      return (
        <div className="space-y-4 font-sans text-xs">
          <p className="text-text-primary font-semibold leading-relaxed">
            The **Odd-Length Middle-Pin Detector** locates the exact center cell of a binary string on the tape.
          </p>
          <p>
            It alternates crossing off characters from the opposite ends of the string.
            It marks the left boundary using `X` in state <code className="text-primary-base font-semibold font-mono">right</code>, moves all the way to the right end, and marks the right boundary using `X` in state <code className="text-primary-base font-semibold font-mono">left</code>.
            Because it slices off exactly 1 character from each side in turn, the last remaining unchecked character is mathematically guaranteed to be the exact middle cell! The machine replaces this character with a clear indicator <code className="font-mono text-emerald-400 font-bold">M</code> and accepts.
          </p>
        </div>
      );

    case "multiply-by-2":
      return (
        <div className="space-y-4 font-sans text-xs">
          <p className="text-text-primary font-semibold leading-relaxed">
            The **Unary Multiplier (Doubler)** doubles the amount of unary characters on the tape.
          </p>
          <p>
            It consumes the unary string left-to-right. For every single original digit <code className="font-mono">1</code> detected in state <code className="text-primary-base font-semibold font-mono">read</code>, it marks it as <code className="font-mono text-purple-400 font-bold">X</code>, travels to the right termination boundary, and writes down **two** corresponding placeholder characters <code className="font-mono text-emerald-400 font-bold">A</code>.
            When it finishes parsing the entire original input, it transitions to <code className="text-primary-base font-semibold font-mono">cleanup</code> to restore both marked <code className="font-mono">X</code> items and trailing <code className="font-mono">A</code> items back into the standard representation of unary <code className="font-mono font-bold text-emerald-400">1</code>s, before halting in the <code className="text-primary-base font-semibold font-mono">accept</code> state.
          </p>
        </div>
      );

    case "binary-to-unary":
      return (
        <div className="space-y-4 font-sans text-xs">
          <p className="text-text-primary font-semibold leading-relaxed">
            The **Binary to Unary Converter** converts a standard base-2 binary integer (e.g. binary <code className="font-mono">10</code>) into its unary count equivalent (e.g. <code className="font-mono text-emerald-400 font-bold">YY</code> sequence).
          </p>
          <p>
            The machine uses a subtraction loop. It repeatedly decrements 1 from the binary string (using state <code className="text-primary-base font-semibold font-mono">sub</code>). For each successful subtraction, it travels to the right boundary and writes down a unary mark <code className="font-mono font-bold text-amber-400">Y</code>. It repeats this cycle recursively until the entire binary number has been depleted to zeros, then cleans the workspace and accepts.
          </p>
        </div>
      );

    case "swap-01":
      return (
        <div className="space-y-4 font-sans text-xs">
          <p className="text-text-primary font-semibold leading-relaxed">
            The **Swap Adjacent Pairs** machine swaps every adjacent 0 and 1 pair on the tape (e.g. <code className="font-mono">0110</code> becomes <code className="font-mono">1001</code>).
          </p>
          <div className="border-l-2 border-primary-base/40 pl-3.5 space-y-3">
             <p>
               - It reads the first character of a pair in state <code className="text-primary-base font-bold font-mono">read1</code>. If it sees <code className="font-mono text-amber-400">0</code>, it temporarily replaces it with a blank and enters state <code className="text-primary-base font-semibold font-mono">saw0</code>. If it sees <code className="font-mono text-amber-400">1</code>, it temporarily enters state <code className="text-primary-base font-semibold font-mono">saw1</code>.
             </p>
             <p>
               - The head moves to the right to read the second element. In state <code className="text-primary-base font-semibold font-mono">saw0</code>, if it reads <code className="font-mono">1</code>, it writes <code className="font-mono">1</code> (effectively putting the 1 on the left side of the pair since it moved leftwards) and transitions back to search state <code className="text-primary-base font-bold font-mono">read1</code>.
             </p>
             <p>
               - This process is performed dynamically across the tape pairs sequentially until it runs out of items and accepts.
             </p>
          </div>
        </div>
      );

    case "count-zeros":
      return (
        <div className="space-y-4 font-sans text-xs">
          <p className="text-text-primary font-semibold leading-relaxed">
            The **Count Zeros** machine counts all zeros present in the input sequence, converting them into equivalent unary outputs.
          </p>
          <p>
            It starts in search state <code className="text-primary-base font-semibold font-mono">search</code>, scanning left-to-right. For every <code className="font-mono text-amber-400">0</code> encountered, it marks it as <code className="font-mono text-purple-400 font-bold">X</code>, hops right to the end of the working string, marks a separator <code className="font-mono">Y</code>, and writes down a unary <code className="font-mono text-emerald-400 font-bold">1</code> onto the end of the tape. It rolls back in state <code className="text-primary-base font-semibold font-mono">goback</code>, repeating until the entire input is scanned, then restores original symbols in state <code className="text-primary-base font-semibold font-mono font-bold">finish</code> and accepts.
          </p>
        </div>
      );

    case "parity-check":
      return (
        <div className="space-y-4 font-sans text-xs">
          <p className="text-text-primary font-semibold leading-relaxed">
            The **Even Parity Checker** tracks whether the total count of <code className="font-mono">1</code> symbols in an input binary string is even or odd.
          </p>
          <div className="border-l-2 border-primary-base/40 pl-3.5 space-y-3">
             <p>
               - It starts in state <code className="text-primary-base font-bold font-mono">even</code>. Finding a <code className="font-mono">0</code> doesn't change parity, so it remains in state <code className="font-mono">even</code>.
             </p>
             <p>
               - When it reads a <code className="font-mono font-bold text-amber-300">1</code>, parity is toggled: the machine transitions to state <code className="text-primary-base font-semibold font-mono">odd</code> and moves right. Same if it is in <code className="font-mono">odd</code> and reads a <code className="font-mono font-bold text-amber-300">1</code>: it toggles back to <code className="text-primary-base font-semibold font-mono">even</code>.
             </p>
             <p>
               - Once the terminating blank space <code className="font-mono text-text-muted">_</code> is hit, if the machine is in the <code className="text-primary-base font-bold font-mono">even</code> state, it writes <code className="font-mono font-bold text-emerald-400">E</code> and accepts. If it is in the <code className="text-primary-base font-bold font-mono">odd</code> state, it writes <code className="font-mono font-bold text-red-400 font-mono">O</code> and rejects.
             </p>
          </div>
        </div>
      );

    default:
      const uniqueStatesList = Array.from(new Set(rulesList.map(r => r.currentState).filter(Boolean)));
      const accepts = activeScenario?.acceptStates || [];
      const initSt = activeScenario?.initialState || 'q0';

      return (
        <div className="space-y-4 font-sans text-xs">
          <p className="text-text-primary font-semibold leading-relaxed">
            This is a **Custom Turing Machine** with a custom set of transition rules. A Turing Machine executes computation step-by-step by checking the current state against the symbol under the tape head.
          </p>
          <div className="bg-[#11141a]/60 border border-border-main/50 p-3.5 rounded-lg space-y-2.5 font-mono text-[10px]">
             <div>
                <span className="text-text-muted font-bold text-[9px] block uppercase tracking-wider font-sans">1. Start Configuration</span>
                <p className="text-text-primary mt-1">
                  Machine starts in state: <span className="text-blue-400 font-bold">{initSt}</span>
                </p>
             </div>
             <div>
                <span className="text-text-muted font-bold text-[9px] block uppercase tracking-wider font-sans">2. Accept State(s)</span>
                <p className="text-text-primary mt-1">
                  The machine will successfully halt and accept if it reaches: <span className="text-emerald-400 font-bold">{accepts.length > 0 ? accepts.join(', ') : 'none configured'}</span>
                </p>
             </div>
             <div>
                <span className="text-text-muted font-bold text-[9px] block uppercase tracking-wider font-sans">3. State Walkthrough</span>
                <p className="text-[#8892b0] mt-1 leading-relaxed font-sans text-xs">
                  The machine currently possesses **{uniqueStatesList.length}** unique state definitions and **{rulesList.length}** transition paths. 
                  When you press **Play** or **Step**, the read/write head evaluates the symbol at its active slot index, finds the first matching row in the transition table, updates the symbol on that tape cell, changes state, and moves the head.
                </p>
             </div>
          </div>
          <p className="text-text-muted text-[10px]">
            💡 **Rule of Determinism:** Ensure your transition table has unique combinations of (State, Symbol) to prevent non-deterministic conflicts! You can monitor state transitions in live-time right inside the visualization graph.
          </p>
        </div>
      );
  }
};

interface StateDiagramProps {
  onExplainLogic?: () => void;
}

const TooltipContext = React.createContext<{
  setTooltip: (text: string | null, element: HTMLElement | null) => void;
} | null>(null);

const IconButton = ({ icon: Icon, tooltip, onClick, isActive, className = '', disabled=false }: any) => {
  const context = React.useContext(TooltipContext);

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (context) {
      context.setTooltip(tooltip, e.currentTarget);
    }
  };

  const handleMouseLeave = () => {
    if (context) {
      context.setTooltip(null, null);
    }
  };

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <button 
        onClick={onClick}
        disabled={disabled}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`p-2 rounded transition-colors flex items-center justify-center ${
           isActive 
             ? 'bg-primary-dark border border-primary-base text-text-primary' 
             : 'bg-bg-element hover:bg-border-active text-text-secondary border border-transparent'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <Icon size={14} />
      </button>
      {!context && (
        <div className="absolute right-full mr-2 px-2 py-1 bg-bg-surface text-text-primary text-[10px] whitespace-nowrap rounded border border-border-main hidden group-hover:block pointer-events-none z-[100]">
          {tooltip}
        </div>
      )}
    </div>
  )
}

const StateDiagramInternal: React.FC<StateDiagramProps> = ({ onExplainLogic }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  const rules = useTMStore(state => state.rules);
  const setRules = useTMStore(state => state.setRules);
  const activeScenario = useTMStore(state => state.activeScenario);
  const currentState = useTMStore(state => state.currentState);
  const lastRuleId = useTMStore(state => state.lastRuleId);
  const status = useTMStore(state => state.status);
  const { fitBounds, getNodes, setViewport, getZoom, fitView } = useReactFlow();
  const [autoFit, setAutoFit] = React.useState(true);
  const [showCheckpoints, setShowCheckpoints] = React.useState(false);
  const [showMinimap, setShowMinimap] = React.useState(false);
  const [showLegend, setShowLegend] = React.useState(false);
  const [showArrows, setShowArrows] = React.useState(true);
  const [snapToGrid, setSnapToGrid] = React.useState(true);
  const [showHowItWorks, setShowHowItWorks] = React.useState(false);

  const diagramTheme = useThemeStore(state => state.diagramTheme);
  const themeMode = useThemeStore(state => state.themeMode);
  const autoArrangeEnabled = useThemeStore(state => state.autoArrangeEnabled);

  const addDiagramCheckpoint = useTMStore(state => state.addDiagramCheckpoint);
  const removeDiagramCheckpoint = useTMStore(state => state.removeDiagramCheckpoint);
  const diagramCheckpoints = useTMStore(state => state.diagramCheckpoints);
  const jumpToStep = useTMStore(state => state.jumpToStep);
  const undo = useTMStore(state => state.undo);
  const historyIndex = useTMStore(state => state.historyIndex);
  const history = useTMStore(state => state.history);
  const isRunning = useTMStore(state => state.isRunning);
  
  const deleteState = useTMStore(state => state.deleteState);
  const setInitialState = useTMStore(state => state.setInitialState);
  const toggleAcceptState = useTMStore(state => state.toggleAcceptState);

  const [heatmapMode, setHeatmapMode] = React.useState(false);
  const [zoomLevel, setZoomLevel] = React.useState(100);

  const toolbarRef = React.useRef<HTMLDivElement>(null);
  const [activeTooltip, setActiveTooltip] = React.useState<{ text: string; top: number } | null>(null);

  const setTooltip = React.useCallback((text: string | null, element: HTMLElement | null) => {
    if (!text || !element || !toolbarRef.current) {
      setActiveTooltip(null);
      return;
    }
    const toolbarRect = toolbarRef.current.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    const top = elementRect.top - toolbarRect.top + (elementRect.height / 2);
    setActiveTooltip({ text, top });
  }, []);

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [canScrollUp, setCanScrollUp] = React.useState(false);
  const [canScrollDown, setCanScrollDown] = React.useState(false);

  const checkScroll = React.useCallback(() => {
    const el = scrollContainerRef.current;
    if (el) {
      const scrollUp = el.scrollTop > 1;
      const scrollDown = el.scrollHeight > el.clientHeight + el.scrollTop + 1;
      setCanScrollUp(scrollUp);
      setCanScrollDown(scrollDown);
    }
  }, []);

  React.useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      const timer = setTimeout(checkScroll, 100);
      el.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      
      const observer = new ResizeObserver(checkScroll);
      observer.observe(el);
      
      return () => {
        clearTimeout(timer);
        el.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
        observer.disconnect();
      };
    }
  }, [checkScroll]);

  useOnViewportChange({
    onChange: (viewport) => setZoomLevel(Math.round(viewport.zoom * 100)),
  });

  const handleResetZoom = useCallback(() => {
    fitView({ minZoom: 1, maxZoom: 1, duration: 300 });
  }, [fitView]);

  const [contextMenu, setContextMenu] = React.useState<{ id: string; top: number; left: number; showAlign: boolean } | null>(null);
  const [hoveredNode, setHoveredNode] = React.useState<{ id: string; x: number; y: number; boundsWidth: number; boundsHeight: number } | null>(null);
  const [hoveredEdge, setHoveredEdge] = React.useState<{ id: string; x: number; y: number; boundsWidth: number; boundsHeight: number } | null>(null);
  const symbolAliases = useTMStore(state => state.symbolAliases);

  const onNodeContextMenu = React.useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      if (node.id === '__start__') return;
      
      const pane = document.querySelector('.react-flow') as HTMLElement;
      if (!pane) return;
      const bounds = pane.getBoundingClientRect();

      const selectedNodes = getNodes().filter(n => n.selected);
      const showAlign = selectedNodes.length > 1;
      
      setContextMenu({ 
        id: node.id, 
        top: event.clientY - bounds.top, 
        left: event.clientX - bounds.left,
        showAlign
      });
    },
    [getNodes]
  );

  const closeContextMenu = React.useCallback(() => setContextMenu(null), []);

  const onNodeMouseEnter = React.useCallback((event: React.MouseEvent, node: Node) => {
    if (node.id === '__start__') return;
    const pane = document.querySelector('.react-flow') as HTMLElement;
    if (!pane) return;
    const bounds = pane.getBoundingClientRect();
    setHoveredNode({
      id: node.id,
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
      boundsWidth: bounds.width,
      boundsHeight: bounds.height
    });
  }, []);

  const onNodeMouseMove = React.useCallback((event: React.MouseEvent, node: Node) => {
    if (node.id === '__start__') return;
    const pane = document.querySelector('.react-flow') as HTMLElement;
    if (!pane) return;
    const bounds = pane.getBoundingClientRect();
    setHoveredNode({
      id: node.id,
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
      boundsWidth: bounds.width,
      boundsHeight: bounds.height
    });
  }, []);

  const onNodeMouseLeave = React.useCallback(() => {
    setHoveredNode(null);
  }, []);

  const onEdgeMouseEnter = React.useCallback((event: React.MouseEvent, edge: Edge) => {
    const pane = document.querySelector('.react-flow') as HTMLElement;
    if (!pane) return;
    const bounds = pane.getBoundingClientRect();
    setHoveredEdge({
      id: edge.id,
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
      boundsWidth: bounds.width,
      boundsHeight: bounds.height
    });
  }, []);

  const onEdgeMouseMove = React.useCallback((event: React.MouseEvent, edge: Edge) => {
    const pane = document.querySelector('.react-flow') as HTMLElement;
    if (!pane) return;
    const bounds = pane.getBoundingClientRect();
    setHoveredEdge({
      id: edge.id,
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
      boundsWidth: bounds.width,
      boundsHeight: bounds.height
    });
  }, []);

  const onEdgeMouseLeave = React.useCallback(() => {
    setHoveredEdge(null);
  }, []);

  const handleAlign = React.useCallback((type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    const selectedNodes = getNodes().filter(n => n.selected);
    if (selectedNodes.length < 2) return;

    const newPositions: Record<string, {x: number, y: number}> = {};
    
    if (type === 'left') {
      const minX = Math.min(...selectedNodes.map(n => n.position.x));
      selectedNodes.forEach(n => newPositions[n.id] = { ...n.position, x: minX });
    } else if (type === 'center') {
      const avgX = selectedNodes.reduce((sum, n) => sum + n.position.x, 0) / selectedNodes.length;
      selectedNodes.forEach(n => newPositions[n.id] = { ...n.position, x: avgX });
    } else if (type === 'right') {
      const maxX = Math.max(...selectedNodes.map(n => n.position.x));
      selectedNodes.forEach(n => newPositions[n.id] = { ...n.position, x: maxX });
    } else if (type === 'top') {
      const minY = Math.min(...selectedNodes.map(n => n.position.y));
      selectedNodes.forEach(n => newPositions[n.id] = { ...n.position, y: minY });
    } else if (type === 'middle') {
      const avgY = selectedNodes.reduce((sum, n) => sum + n.position.y, 0) / selectedNodes.length;
      selectedNodes.forEach(n => newPositions[n.id] = { ...n.position, y: avgY });
    } else if (type === 'bottom') {
      const maxY = Math.max(...selectedNodes.map(n => n.position.y));
      selectedNodes.forEach(n => newPositions[n.id] = { ...n.position, y: maxY });
    }

    // Call updateScenarioPositions from the store
    // (We will need to ensure updateScenarioPositions is in scope, it is defined later down if we didn't hoist it)
    // Actually we can just use the store directly or move handleAlign. Let's see if updateScenarioPositions is in scope.
    // Wait, updateScenarioPositions is declared after closeContextMenu?
    useTMStore.getState().updateScenarioPositions(newPositions);
    closeContextMenu();
  }, [getNodes, closeContextMenu]);

  const diagramThemeStyles = useMemo(() => {
    if (diagramTheme === 'high-contrast') {
      if (themeMode === 'dark') {
        return {
          '--diagram-bg': '#000000',
          '--diagram-node': '#0a0d14',
          '--border-main': '#ffffff',
          '--border-active': '#e5e7eb',
          '--text-primary': '#ffffff',
          '--text-muted': '#ffffff',
          '--bg-surface': '#000000',
          '--primary-base': '#facc15', // Neon gold/yellow
          '--primary-dark': '#eab308',
        } as React.CSSProperties;
      } else {
        return {
          '--diagram-bg': '#ffffff',
          '--diagram-node': '#ffffff',
          '--border-main': '#000000',
          '--border-active': '#111827',
          '--text-primary': '#000000',
          '--text-muted': '#000000',
          '--bg-surface': '#ffffff',
          '--primary-base': '#1d4ed8', // Deep blue
          '--primary-dark': '#1e40af',
        } as React.CSSProperties;
      }
    }
    if (diagramTheme === 'minimal') {
      if (themeMode === 'dark') {
        return {
          '--diagram-bg': 'var(--bg-base)', // Seamless background
          '--diagram-node': 'transparent',
          '--border-main': 'rgba(255, 255, 255, 0.15)',
          '--border-active': 'rgba(255, 255, 255, 0.3)',
          '--text-primary': '#8b949e',
          '--text-muted': '#6e7681',
          '--bg-surface': 'var(--bg-surface)',
          '--primary-base': 'var(--primary-base)',
        } as React.CSSProperties;
      } else {
        return {
          '--diagram-bg': 'var(--bg-base)', // Seamless background
          '--diagram-node': 'transparent',
          '--border-main': 'rgba(0, 0, 0, 0.12)',
          '--border-active': 'rgba(0, 0, 0, 0.25)',
          '--text-primary': '#475569',
          '--text-muted': '#64748b',
          '--bg-surface': 'var(--bg-surface)',
          '--primary-base': 'var(--primary-base)',
        } as React.CSSProperties;
      }
    }
    if (diagramTheme === 'vibrant') {
      if (themeMode === 'dark') {
        return {
          '--diagram-bg': '#070a13',
          '--diagram-node': 'rgba(18, 24, 41, 0.85)',
          '--border-main': '#3b82f6', // Vibrant blue border
          '--border-active': '#818cf8', // Indigo border active
          '--text-primary': '#e0e7ff',
          '--text-muted': '#a5b4fc',
          '--bg-surface': '#0b0f19',
          '--primary-base': '#ec4899', // Pink highlights
          '--primary-dark': '#db2777',
        } as React.CSSProperties;
      } else {
        return {
          '--diagram-bg': '#f5f3ff', // Soft violet background
          '--diagram-node': 'rgba(255, 255, 255, 0.9)',
          '--border-main': '#8b5cf6', // Indigo border
          '--border-active': '#a78bfa',
          '--text-primary': '#4c1d95',
          '--text-muted': '#7c3aed',
          '--bg-surface': '#f3e8ff',
          '--primary-base': '#ec4899', // Pink/magenta highlights
          '--primary-dark': '#db2777',
        } as React.CSSProperties;
      }
    }
    return {} as React.CSSProperties;
  }, [diagramTheme, themeMode]);

  const { nodes, edges } = useMemo(() => {
    const states = new Set<string>();
    if (activeScenario) {
      states.add(activeScenario.initialState);
      activeScenario.acceptStates.forEach(s => states.add(s));
    }
    rules.forEach(r => {
      states.add(r.currentState);
      states.add(r.nextState);
    });

    const reachableStates = new Set<string>();
    const outgoingRules = new Map<string, any[]>();
    rules.forEach(r => {
      if (!outgoingRules.has(r.currentState)) outgoingRules.set(r.currentState, []);
      outgoingRules.get(r.currentState)!.push(r);
    });

    if (activeScenario) {
      const toVisit = [activeScenario.initialState];
      reachableStates.add(activeScenario.initialState);
      while(toVisit.length > 0) {
        const curr = toVisit.pop()!;
        const transitions = outgoingRules.get(curr) || [];
        transitions.forEach(t => {
           if (!reachableStates.has(t.nextState)) {
             reachableStates.add(t.nextState);
             toVisit.push(t.nextState);
           }
        });
      }
    }

    const stuckStates = new Set<string>();
    states.forEach(stateName => {
       const isAccept = activeScenario?.acceptStates.includes(stateName);
       if (!isAccept && !outgoingRules.has(stateName)) {
          stuckStates.add(stateName);
       }
    });

    const statesArr = Array.from(states);
    const radius = Math.max(150, statesArr.length * 40);
    const centerX = 250;
    const centerY = 250;

    const stateFrequencies: Record<string, number> = {};
    let maxFreq = 0;
    if (heatmapMode) {
      // Calculate frequencies up to current history index
      const stepsToConsider = history.slice(0, historyIndex + 1);
      stepsToConsider.forEach(entry => {
        stateFrequencies[entry.currentState] = (stateFrequencies[entry.currentState] || 0) + 1;
      });
      maxFreq = Math.max(...Object.values(stateFrequencies), 1);
    }

    const newNodes: Node[] = statesArr.map((stateName, index) => {
      const angle = (index / statesArr.length) * 2 * Math.PI;
      
      let x = centerX + radius * Math.cos(angle);
      let y = centerY + radius * Math.sin(angle);

      if (activeScenario?.customPositions && activeScenario.customPositions[stateName]) {
         x = activeScenario.customPositions[stateName].x;
         y = activeScenario.customPositions[stateName].y;
      }
      
      const isAccept = activeScenario?.acceptStates.includes(stateName);
      const isStart = activeScenario?.initialState === stateName;
      const isActive = stateName === currentState;
      const isUnreachable = activeScenario && !reachableStates.has(stateName);
      const isStuck = stuckStates.has(stateName);

      const customColor = activeScenario?.stateColors?.[stateName];
      const customLabel = activeScenario?.stateLabels?.[stateName];

      let bgColor = isActive ? 'var(--color-primary-base)' : (customColor || 'var(--color-diagram-node)');
      if (status === 'error' && isActive) bgColor = '#ef4444';
      if (status === 'rejected' && isActive) bgColor = '#f97316';

      if (diagramTheme === 'vibrant' && !isActive && !isUnreachable && !isStuck && !customColor) {
        bgColor = themeMode === 'dark' ? 'linear-gradient(135deg, #111827 0%, #1c152d 100%)' : 'linear-gradient(135deg, #fafafa 0%, #eef2ff 100%)';
      }

      let borderColor = isStart ? '#22c55e' : (isAccept ? '#3b82f6' : 'var(--color-border-main)');
      let borderStyle = isAccept ? '4px double' : '2px solid';

      if (diagramTheme === 'minimal') {
        borderStyle = isAccept ? '2px double' : '1px solid';
        borderColor = isStart ? 'var(--color-primary-base)' : (isAccept ? '#3b82f6' : 'var(--color-border-main)');
      } else if (diagramTheme === 'high-contrast') {
        borderStyle = isAccept ? '5px double' : '3px solid';
      }

      if (isUnreachable || isStuck) {
         borderColor = '#ef4444';
         if (!isActive) bgColor = themeMode === 'dark' ? '#450a0a' : '#fee2e2';
      }

      let textColor = isActive || customColor ? '#fff' : (isUnreachable || isStuck ? '#fca5a5' : 'var(--color-text-primary)');
      if (customColor && customColor === 'var(--color-diagram-node)') textColor = 'var(--color-text-primary)';
      if (isActive && diagramTheme === 'minimal') {
        textColor = 'var(--color-primary-base)';
      }

      let tooltipText = customLabel;

      if (heatmapMode) {
         const freq = stateFrequencies[stateName] || 0;
         const ratio = freq / maxFreq;
         tooltipText = `Heatmap: ${freq} visits (${Math.round(ratio * 100)}%)`;
         
         if (freq === 0) {
            bgColor = '#1e1e24'; // muted dark
            textColor = 'rgba(255, 255, 255, 0.2)';
            borderColor = 'rgba(255, 255, 255, 0.1)';
         } else {
            // 240 is blue, 0 is red
            const h = (1 - Math.pow(ratio, 0.7)) * 240; 
            bgColor = `hsla(${h}, 80%, 50%, 0.85)`;
            textColor = '#fff';
            borderColor = `hsl(${h}, 80%, 40%)`;
         }
         
         if (isActive) {
            borderColor = '#fff';
            borderStyle = '4px solid';
            bgColor = `hsla(${(1 - Math.pow(ratio, 0.7)) * 240}, 100%, 60%, 1)`;
         }
      }

      const labelContent = customLabel || heatmapMode ? (
        <div className="flex flex-col items-center justify-center leading-tight">
          {customLabel && !heatmapMode && <span className="text-[11px] truncate max-w-[60px]" title={customLabel}>{customLabel}</span>}
          {heatmapMode && <span className="text-[11px] font-bold truncate max-w-[60px]" title={tooltipText}>{stateFrequencies[stateName] || 0}</span>}
          <span className="text-[8px] opacity-75 mt-0.5">{stateName}</span>
        </div>
      ) : stateName;

      const baseNode = {
        id: stateName,
        type: 'custom',
        position: { x, y },
        data: { 
          label: labelContent, 
          isActive: isActive,
          isAccept: isAccept,
          isStart: isStart,
          style: {
            background: bgColor,
            color: isActive ? (diagramTheme === 'minimal' ? 'var(--color-primary-base)' : 'var(--color-bg-base)') : textColor,
            border: borderStyle,
            borderColor: borderColor,
            borderRadius: isAccept ? '50%' : '12px',
            width: isAccept ? 45 : 70,
            height: 45,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontWeight: 'bold',
            transition: 'all 0.3s ease',
            boxShadow: isActive ? (diagramTheme === 'vibrant' ? '0 0 25px var(--color-primary-base)' : (diagramTheme === 'minimal' ? '0 0 5px var(--color-primary-base)' : '0 0 15px var(--color-primary-base)')) : (isUnreachable || isStuck ? '0 0 10px rgba(239, 68, 68, 0.4)' : 'none'),
            fontFamily: 'sans-serif',
            fontSize: '12px'
          } 
        },
        draggable: true,
        width: isAccept ? 45 : 70,
        height: 45,
        measured: { width: isAccept ? 45 : 70, height: 45 },
        className: '!transition-all !duration-300 ease-in-out',
      };

      return baseNode;
    });

    if (activeScenario) {
      let startX = centerX + radius - 100;
      let startY = centerY - 100;
      if (activeScenario.customPositions && activeScenario.customPositions['__start__']) {
         startX = activeScenario.customPositions['__start__'].x;
         startY = activeScenario.customPositions['__start__'].y;
      }

      newNodes.push({
        id: '__start__',
        type: 'custom',
        position: { x: startX, y: startY },
        data: { 
          label: '',
          style: {
            background: 'var(--color-text-primary)',
            border: 'none',
            borderRadius: '50%',
            width: 20,
            height: 20,
            minWidth: 20,
          }
        },
        draggable: true,
        width: 20,
        height: 20,
        measured: { width: 20, height: 20 },
        className: '!transition-all !duration-300 ease-in-out',
      });
    }

    const newEdges: Edge[] = rules.map((rule, idx) => {
      const isActiveTrans = rule.id === lastRuleId;
      let strokeWidthVal = isActiveTrans ? 3 : 1.5;
      if (diagramTheme === 'minimal') {
        strokeWidthVal = isActiveTrans ? 2 : 1;
      } else if (diagramTheme === 'high-contrast') {
        strokeWidthVal = isActiveTrans ? 4.5 : 2.5;
      } else if (diagramTheme === 'vibrant') {
        strokeWidthVal = isActiveTrans ? 3.5 : 1.8;
      }

      return {
        id: `${rule.id}-${idx}`,
        source: rule.currentState,
        target: rule.nextState,
        label: `${rule.readSymbol}→${rule.writeSymbol},${rule.moveDirection}`,
        type: 'smart',
        animated: isActiveTrans,
        className: '!transition-all !duration-300 ease-in-out',
        style: {
          stroke: isActiveTrans ? 'var(--color-primary-base)' : 'var(--color-border-active)',
          strokeWidth: strokeWidthVal,
        },
        labelStyle: { fill: isActiveTrans ? 'var(--color-primary-base)' : 'var(--color-text-muted)', fontWeight: isActiveTrans ? 'bold' : 'normal', fontSize: 10, fontFamily: 'monospace' },
        labelBgStyle: { fill: 'var(--color-bg-surface)', fillOpacity: 0.8 },
        markerEnd: showArrows ? {
          type: MarkerType.ArrowClosed,
          color: isActiveTrans ? 'var(--color-primary-base)' : 'var(--color-border-active)',
        } : undefined,
      };
    });

    if (activeScenario) {
      newEdges.push({
        id: '__start_edge__',
        source: '__start__',
        target: activeScenario.initialState,
        type: 'smart',
        className: '!transition-all !duration-300 ease-in-out',
        style: { stroke: 'var(--color-text-primary)', strokeWidth: 2 },
        markerEnd: showArrows ? { type: MarkerType.ArrowClosed, color: 'var(--color-text-primary)' } : undefined,
      });
    }

    return { nodes: newNodes, edges: newEdges };
  }, [rules, activeScenario, currentState, lastRuleId, status, heatmapMode, history, historyIndex, showArrows, diagramTheme, themeMode]);

  const doFitBounds = React.useCallback((duration = 800) => {
    const rfNodes = getNodes();
    if (rfNodes.length === 0) return;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    rfNodes.forEach((n) => {
      const x = n.position.x;
      const y = n.position.y;
      const width = n.measured?.width ?? 150;
      const height = n.measured?.height ?? 50;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + width);
      maxY = Math.max(maxY, y + height);
    });
    if (minX !== Infinity) {
      fitBounds({ x: minX, y: minY, width: maxX - minX, height: maxY - minY }, { padding: 0.2, duration });
    }
  }, [getNodes, fitBounds]);

  // Monitor canvas resize events and automatically re-center the diagram
  const resizeObserver = useMemo(() => new ResizeObserver(() => {
    if (autoFit) {
      window.requestAnimationFrame(() => {
        doFitBounds(300);
      });
    }
  }), [autoFit, doFitBounds]);

  const [liveNodes, setLiveNodes] = React.useState<Node[]>(nodes);
  
  useEffect(() => {
    setLiveNodes(nodes);
  }, [nodes]);

  const onNodesChange = React.useCallback(
    (changes: NodeChange<Node>[]) => setLiveNodes((nds) => applyNodeChanges(changes, nds)),
    [setLiveNodes]
  );
  
  useEffect(() => {
    const rfEl = document.querySelector('.react-flow');
    if (rfEl) {
      resizeObserver.observe(rfEl);
    }
    return () => resizeObserver.disconnect();
  }, [resizeObserver]);

  // Re-fit view when scenario changes (but not on drag/drop)
  const previousScenarioId = React.useRef(activeScenario?.id);
  const previousRulesCount = React.useRef(rules.length);

  useEffect(() => {
    const isNewScenario = activeScenario?.id !== previousScenarioId.current;
    const isNewRules = rules.length !== previousRulesCount.current;
    
    if (autoFit && (isNewScenario || isNewRules)) {
      setTimeout(() => {
        doFitBounds(800);
      }, 100);
      previousScenarioId.current = activeScenario?.id;
      previousRulesCount.current = rules.length;
    }
  }, [activeScenario?.id, rules.length, autoFit, doFitBounds]);

  // Keep diagram always visible on node add/move if autoFit is on
  useEffect(() => {
    if (autoFit) {
      const timer = setTimeout(() => {
        doFitBounds(300);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [liveNodes, autoFit, doFitBounds]);

  const updateScenarioPositions = useTMStore(state => state.updateScenarioPositions);
  const updateStateColor = useTMStore(state => state.updateStateColor);
  const updateStateLabel = useTMStore(state => state.updateStateLabel);
  const [selectedNode, setSelectedNode] = React.useState<string | null>(null);

  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6b7280', 'var(--color-diagram-node)'];

  const handleRelayout = React.useCallback(() => {
    const nodesForSimulation = liveNodes
      .filter(n => n.id !== '__start__')
      .map(n => ({ id: n.id, x: n.position.x, y: n.position.y }));
      
    const linksForSimulation = rules.map(r => ({
      source: r.currentState,
      target: r.nextState
    }));
    
    const validNodeIds = new Set(nodesForSimulation.map(n => n.id));
    const validLinks = linksForSimulation.filter(l => validNodeIds.has(l.source) && validNodeIds.has(l.target));

    const simulation = forceSimulation(nodesForSimulation as any)
      .force('link', forceLink(validLinks).id((d: any) => d.id).distance(150))
      .force('charge', forceManyBody().strength(-800))
      .force('center', forceCenter(250, 250))
      .force('collide', forceCollide().radius(70));
      
    simulation.tick(300);
    
    const newPositions: Record<string, {x: number, y: number}> = {};
    nodesForSimulation.forEach((n: any) => {
      newPositions[n.id] = { x: n.x, y: n.y };
    });
    
    updateScenarioPositions(newPositions);
    
    setTimeout(() => {
       doFitBounds(800);
    }, 100);
  }, [liveNodes, rules, updateScenarioPositions, doFitBounds]);

  // Reactive Auto-Arrange hook
  React.useEffect(() => {
    if (autoArrangeEnabled) {
      handleRelayout();
    }
  }, [autoArrangeEnabled, activeScenario?.id, rules.length]);

  const handleNodeDragStop = (event: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent, node: Node, draggedNodes: Node[]) => {
    const updates: Record<string, {x: number, y: number}> = {};
    const nodesToCheck = draggedNodes && draggedNodes.length > 0 ? draggedNodes : [node];
    const finalPositions = new Map<string, {x: number, y: number}>();
    
    for (const dragged of nodesToCheck) {
      let { x, y } = dragged.position;
      if (snapToGrid) {
        x = Math.round(x / 16) * 16;
        y = Math.round(y / 16) * 16;
      }
      const width = dragged.measured?.width || 70;
      const height = dragged.measured?.height || 45;
      
      let hasCollision = false;
      let iterations = 0;
      const padding = 16;
      
      if (dragged.id !== '__start__') {
        do {
          hasCollision = false;
          
          for (const n of liveNodes) {
            if (n.id === dragged.id || n.id === '__start__') continue;
            
            const nPos = finalPositions.get(n.id) || n.position;
            const nWidth = n.measured?.width || 70;
            const nHeight = n.measured?.height || 45;
            
            const overlapX = x < nPos.x + nWidth + padding && x + width + padding > nPos.x;
            const overlapY = y < nPos.y + nHeight + padding && y + height + padding > nPos.y;
            
            if (overlapX && overlapY) {
              hasCollision = true;
              y += nHeight / 2 + padding;
              x += padding;
              if (snapToGrid) {
                x = Math.round(x / 16) * 16;
                y = Math.round(y / 16) * 16;
              }
            }
          }
          iterations++;
        } while(hasCollision && iterations < 50);
      }
      
      finalPositions.set(dragged.id, { x, y });
      updates[dragged.id] = { x, y };
      
      setLiveNodes(nds => nds.map(n => n.id === dragged.id ? { ...n, position: { x, y } } : n));
    }
    
    updateScenarioPositions(updates);
  };

  const onNodeClick = React.useCallback((event: React.MouseEvent, node: Node) => {
    if (node.id !== '__start__') {
       setSelectedNode(node.id);
    }
    closeContextMenu();
  }, [closeContextMenu]);

  const onPaneClick = React.useCallback(() => {
    setSelectedNode(null);
    closeContextMenu();
  }, [closeContextMenu]);

  const onConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return;
    
    // Auto-create transition: read current head or _, write same, move S or R
    // To keep it simple, read _, write _, move R.
    // Ensure we don't break logic. Maybe check if standard config allows it.
    
    if (connection.source === '__start__') {
       // user dropped start edge, update scenario start state
       setInitialState(connection.target);
       return;
    }
    
    const newRule: TMRule = {
      id: `rule_${Date.now()}`,
      currentState: connection.source,
      nextState: connection.target,
      readSymbol: '_',
      writeSymbol: '_',
      moveDirection: 'R'
    };
    
    setRules([...rules, newRule]);
  }, [rules, setRules, setInitialState]);

  const handleSnapshot = async () => {
    // Zoom out to show all nodes before snapshot
    fitView({ duration: 800, padding: 0.2 });
    
    // Wait for the animation to complete
    await new Promise(resolve => setTimeout(resolve, 850));
    
    const el = document.querySelector('.react-flow') as HTMLElement;
    if (!el) return;
    
    // Hide UI elements momentarily
    const controls = document.querySelector('.react-flow__controls') as HTMLElement;
    const minimap = document.querySelector('.react-flow__minimap') as HTMLElement;
    const panels = document.querySelectorAll('.react-flow__panel');
    const hiddenPanels: HTMLElement[] = [];
    
    if (controls) controls.style.display = 'none';
    if (minimap) minimap.style.display = 'none';
    
    panels.forEach(p => {
      const panel = p as HTMLElement;
      if (!panel.classList.contains('legend-panel')) {
        panel.style.display = 'none';
        hiddenPanels.push(panel);
      }
    });
    
    try {
      // Use the actual container element and let html-to-image figure out the size
      const dataUrl = await toPng(el, {
        backgroundColor: window.getComputedStyle(document.body).backgroundColor,
        pixelRatio: 2,
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `turing-diagram-${Date.now()}.png`;
      a.click();
    } catch(e) {
      console.error('Failed to take snapshot', e);
    } finally {
      // Restore UI elements
      if (controls) controls.style.display = '';
      if (minimap) minimap.style.display = '';
      hiddenPanels.forEach(p => p.style.display = '');
    }
  };

  return (
    <div className="flex-1 relative overflow-hidden flex flex-col min-h-0 min-w-0" style={{ backgroundColor: 'var(--color-diagram-bg)', ...diagramThemeStyles }}>
      <div className="p-3 flex justify-between items-center z-10 relative pointer-events-none shrink-0 border-b border-border-main min-w-0 overflow-x-auto no-scrollbar gap-4" style={{ backgroundColor: 'var(--color-diagram-bg)' }}>
         <span className="text-[10px] font-bold text-primary-base/50 tracking-widest uppercase italic font-sans shrink-0 whitespace-nowrap">Visual State Diagram</span>
          <div className="flex gap-4 font-sans pointer-events-auto items-center shrink-0">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary-base shadow-[0_0_5px_var(--color-primary-base)]"></div><span className="text-[9px] text-text-secondary">ACTIVE</span></div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#3b82f6]"></div><span className="text-[9px] text-text-secondary">START</span></div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#ef4444]"></div><span className="text-[9px] text-red-400">UNREACHABLE/STUCK</span></div>
          </div>
       </div>
       
       <div className="flex-1 w-full h-full min-h-0 min-w-0 relative" ref={containerRef}>
          <motion.div 
            drag 
            dragMomentum={false} 
            dragConstraints={containerRef} 
            ref={toolbarRef}
            className="absolute top-4 right-4 z-50 flex flex-col gap-1.5 p-1.5 bg-bg-surface/80 backdrop-blur border border-border-main rounded-lg shadow-xl pointer-events-auto w-[44px] max-h-[calc(100%-2rem)] overflow-visible"
          >
            <TooltipContext.Provider value={{ setTooltip }}>
              {/* Drag Handle */}
              <div className="w-full h-3 flex items-center justify-center cursor-grab active:cursor-grabbing opacity-50 hover:opacity-100 mb-1 shrink-0">
                 <div className="w-4 h-1 bg-text-muted rounded-full"></div>
              </div>
              
              {/* Top scroll fade indicator */}
              <div 
                className={`h-4 bg-gradient-to-b from-bg-surface to-transparent absolute top-[24px] left-[1.5px] right-[1.5px] pointer-events-none z-10 transition-opacity duration-200 ${canScrollUp ? 'opacity-100' : 'opacity-0'}`}
              />
              
              {/* Scrollable Container */}
              <div 
                ref={scrollContainerRef}
                onScroll={checkScroll}
                className="flex-1 w-full overflow-y-auto no-scrollbar flex flex-col gap-1.5 min-h-0 relative select-none"
              >
                <IconButton icon={HelpCircle} tooltip="How It Works" onClick={() => setShowHowItWorks(true)} />
                <div className="h-px w-full bg-border-main my-0.5 shrink-0"></div>
                
                <div className="relative flex items-center justify-center shrink-0">
                   <button 
                     onClick={handleResetZoom}
                     onMouseEnter={(e) => setTooltip("Reset Zoom (100%)", e.currentTarget)}
                     onMouseLeave={() => setTooltip(null, null)}
                     className="w-full aspect-square bg-bg-element hover:bg-border-active text-text-secondary rounded transition-colors flex items-center justify-center"
                   >
                     <span className="text-[8px] font-bold leading-[1.1]">{zoomLevel}<br/>%</span>
                   </button>
                </div>

                <IconButton icon={Crosshair} isActive={autoFit} tooltip={`Auto-Fit: ${autoFit ? 'ON' : 'OFF'}`} onClick={() => setAutoFit(!autoFit)} />
                <IconButton icon={LayoutGrid} tooltip="Re-Layout" onClick={handleRelayout} />
                <IconButton icon={Grid} isActive={snapToGrid} tooltip={`Snap to Grid: ${snapToGrid ? 'ON' : 'OFF'}`} onClick={() => setSnapToGrid(!snapToGrid)} />
                
                <div className="h-px w-full bg-border-main my-0.5 shrink-0"></div>
                
                <IconButton icon={ArrowRightLeft} isActive={showArrows} tooltip={`Arrows: ${showArrows ? 'ON' : 'OFF'}`} onClick={() => setShowArrows(!showArrows)} />
                <IconButton icon={Camera} tooltip="Snapshot" onClick={handleSnapshot} />
                <IconButton icon={Undo2} tooltip="Step Back" disabled={historyIndex <= 0 || isRunning} onClick={undo} />
                
                {/* Checkpoint Dropdown */}
                <div className="relative w-full shrink-0">
                  <button 
                    onClick={() => setShowCheckpoints(!showCheckpoints)}
                    onMouseEnter={(e) => {
                      if (!showCheckpoints) setTooltip("Checkpoints (Click to open)", e.currentTarget);
                    }}
                    onMouseLeave={() => setTooltip(null, null)}
                    className="w-full flex flex-col items-center justify-center bg-bg-element hover:bg-border-active py-1.5 rounded transition-colors border border-transparent"
                  >
                    <div className="flex text-text-primary items-center"><Save size={12} /></div>
                    <div className="flex text-[9px] font-bold text-text-secondary mt-0.5 leading-none">
                      {diagramCheckpoints.length} <ChevronDown size={8} />
                    </div>
                  </button>
                  
                  {showCheckpoints && (
                    <div className="absolute top-0 right-[calc(100%+8px)] w-48 bg-bg-panel border border-border-main rounded shadow-xl overflow-hidden z-[200]">
                      <div className="flex items-center justify-between p-2 border-b border-border-main">
                         <span className="text-[10px] font-bold text-text-muted">SAVED CHECKPOINTS</span>
                         <button
                            onClick={() => {
                               const name = window.prompt("Save checkpoint name:", `Step ${useTMStore.getState().historyIndex}`);
                               if (name) addDiagramCheckpoint(name);
                            }}
                            className="text-[9px] bg-primary-base/20 text-primary-base hover:bg-primary-base/40 px-1.5 py-0.5 rounded"
                         >
                            + SAVE
                         </button>
                      </div>
                      <div className="max-h-48 overflow-y-auto no-scrollbar">
                        {diagramCheckpoints.length === 0 ? (
                          <div className="p-3 text-[10px] text-text-faint text-center">No checkpoints saved.</div>
                        ) : (
                          diagramCheckpoints.map(cp => (
                            <div key={cp.id} className="flex items-center justify-between p-2 hover:bg-bg-element border-b border-border-main/50 last:border-0 group/cp cursor-pointer" onClick={() => { jumpToStep(cp.stepNumber); setShowCheckpoints(false); }}>
                               <div className="flex flex-col min-w-0">
                                 <span className="text-[10px] text-text-primary truncate font-bold">{cp.name}</span>
                                 <span className="text-[9px] text-text-muted font-mono">Step: {cp.stepNumber}</span>
                               </div>
                               <button 
                                 onClick={(e) => { e.stopPropagation(); removeDiagramCheckpoint(cp.id); }}
                                 className="p-1.5 text-text-faint hover:text-red-400 hover:bg-red-400/10 rounded transition-colors hidden group-hover/cp:block shrink-0"
                                 title="Delete Checkpoint"
                               >
                                 <Trash2 size={12} />
                               </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="h-px w-full bg-border-main my-0.5 shrink-0"></div>
                
                <IconButton icon={Flame} isActive={heatmapMode} tooltip={`Heatmap: ${heatmapMode ? 'ON' : 'OFF'}`} onClick={() => setHeatmapMode(!heatmapMode)} />
                <IconButton icon={MapIcon} isActive={showMinimap} tooltip={`Minimap: ${showMinimap ? 'ON' : 'OFF'}`} onClick={() => setShowMinimap(!showMinimap)} />
                <IconButton icon={List} isActive={showLegend} tooltip={`Legend: ${showLegend ? 'ON' : 'OFF'}`} onClick={() => setShowLegend(!showLegend)} />
              </div>

              {/* Bottom scroll fade indicator */}
              <div 
                className={`h-4 bg-gradient-to-t from-bg-surface to-transparent absolute bottom-[6px] left-[1.5px] right-[1.5px] pointer-events-none z-10 transition-opacity duration-200 ${canScrollDown ? 'opacity-100' : 'opacity-0'}`}
              />

              {/* Outside absolute tooltip with zero-latency parent relative positioning */}
              {activeTooltip && (
                <div 
                  className="absolute right-[calc(100%+8px)] px-2 py-1 bg-bg-surface text-text-primary text-[10px] whitespace-nowrap rounded border border-border-main pointer-events-none z-[100] transform -translate-y-1/2 shadow-lg"
                  style={{ top: `${activeTooltip.top}px` }}
                >
                  {activeTooltip.text}
                </div>
              )}
            </TooltipContext.Provider>
          </motion.div>
        {hoveredNode && (() => {
          const customLabel = activeScenario?.stateLabels?.[hoveredNode.id];
          const isStart = activeScenario?.initialState === hoveredNode.id;
          const isAccept = activeScenario?.acceptStates.includes(hoveredNode.id);
          const isHalt = hoveredNode.id.toLowerCase().includes('halt') || hoveredNode.id === 'H';
          const isReject = hoveredNode.id.toLowerCase().includes('reject');
          const isCurrent = hoveredNode.id === currentState;

          const outgoing = rules.filter(r => r.currentState === hoveredNode.id);
          const incoming = rules.filter(r => r.nextState === hoveredNode.id);

          const getFormattedSymbol = (sym: string) => {
            const clean = (sym || '_').trim() || '_';
            const alias = symbolAliases?.[clean];
            return alias ? `${clean} (${alias})` : clean;
          };

          const transformX = hoveredNode.x > hoveredNode.boundsWidth * 0.65 ? '-110%' : '15px';
          const transformY = hoveredNode.y > hoveredNode.boundsHeight * 0.65 ? '-110%' : '15px';

          return (
            <div 
              id="node-hover-tooltip"
              className="absolute z-[150] pointer-events-none bg-bg-panel/95 backdrop-blur-md border border-border-main p-3.5 rounded-lg shadow-2xl text-[10px] text-text-primary flex flex-col gap-3 max-w-[290px] min-w-[200px]"
              style={{ 
                top: hoveredNode.y, 
                left: hoveredNode.x,
                transform: `translate(${transformX}, ${transformY})`,
                transition: 'transform 0.15s ease-out, top 0.05s ease-out, left 0.05s ease-out',
              }}
            >
              <div className="flex flex-col gap-1 border-b border-border-main/60 pb-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-mono text-xs font-bold text-text-primary truncate">
                      {hoveredNode.id}
                    </span>
                    {customLabel && (
                      <span className="text-[9px] text-text-muted italic truncate max-w-[100px]">
                        ({customLabel})
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0 flex-wrap justify-end">
                    {isCurrent && (
                      <span className="px-1.5 py-0.5 bg-primary-base/20 text-primary-base border border-primary-base/30 text-[8px] font-bold uppercase tracking-wider rounded font-sans leading-none">
                        Active
                      </span>
                    )}
                    {isStart && (
                      <span className="px-1.5 py-0.5 bg-emerald-950/50 text-emerald-400 border border-emerald-500/30 text-[8px] font-bold uppercase tracking-wider rounded font-sans leading-none">
                        Start
                      </span>
                    )}
                    {isAccept && (
                      <span className="px-1.5 py-0.5 bg-blue-950/50 text-blue-400 border border-blue-500/30 text-[8px] font-bold uppercase tracking-wider rounded font-sans leading-none">
                        Accept
                      </span>
                    )}
                    {isHalt && (
                      <span className="px-1.5 py-0.5 bg-red-950/50 text-red-400 border border-red-500/30 text-[8px] font-bold uppercase tracking-wider rounded font-sans leading-none">
                        Halt
                      </span>
                    )}
                    {isReject && (
                      <span className="px-1.5 py-0.5 bg-orange-950/50 text-orange-400 border border-orange-500/30 text-[8px] font-bold uppercase tracking-wider rounded font-sans leading-none">
                        Reject
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="text-[9px] font-bold tracking-wider text-text-muted uppercase flex items-center justify-between">
                  <span>OUTGOING TRANSITIONS</span>
                  <span className="text-[8px] bg-neutral-800 text-text-muted px-1.5 py-0.2 rounded-full font-semibold">{outgoing.length}</span>
                </div>
                <div className="flex flex-col gap-1">
                  {outgoing.length === 0 ? (
                    <div className="text-amber-500 text-[9px] py-0.5 font-sans italic flex items-center gap-1 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      Stuck State (No Outgoing Rules)
                    </div>
                  ) : (
                    outgoing.map(r => (
                      <div key={r.id} className={`flex items-center justify-between text-[10px] py-1 border-b border-border-main/30 last:border-b-0 gap-2 font-mono ${r.id === lastRuleId ? 'bg-primary-base/10 px-1 rounded text-primary-base font-bold' : ''}`}>
                        <div className="flex items-center gap-1 shrink-0">
                          <code className="bg-[#11141a] border border-border-main/50 px-1 rounded font-bold text-amber-400">
                            {getFormattedSymbol(r.readSymbol)}
                          </code>
                          <span className="text-text-faint text-[8px] font-bold">➜</span>
                          <code className="bg-[#11141a] border border-border-main/50 px-1 rounded font-bold text-emerald-400">
                            {getFormattedSymbol(r.writeSymbol)}
                          </code>
                        </div>
                        <div className="flex items-center gap-1 truncate">
                          <span className="bg-purple-950/40 text-purple-400 px-1 rounded border border-purple-500/10 font-bold shrink-0">{r.moveDirection}</span>
                          <span className="text-text-faint text-[8px] font-bold shrink-0">➜</span>
                          <span className="text-blue-400 font-bold truncate">{r.nextState}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1.5 border-t border-border-main/40 pt-2.5">
                <div className="text-[9px] font-bold tracking-wider text-text-muted uppercase flex items-center justify-between">
                  <span>INCOMING TRANSITIONS</span>
                  <span className="text-[8px] bg-neutral-800 text-text-muted px-1.5 py-0.2 rounded-full font-semibold">{incoming.length}</span>
                </div>
                <div className="flex flex-col gap-1">
                  {incoming.length === 0 ? (
                    <div className="text-text-faint text-[9px] py-0.5 font-sans italic flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-text-faint"></span>
                      Unreachable State (No Incoming Rules)
                    </div>
                  ) : (
                    incoming.map(r => (
                      <div key={r.id} className="flex items-center justify-between text-[10px] py-0.5 border-b border-border-main/30 last:border-b-0 gap-2 font-mono">
                        <div className="flex items-center gap-1 truncate">
                          <span className="text-blue-400 font-bold truncate">{r.currentState}</span>
                          <span className="text-text-faint text-[8px] font-bold shrink-0">➜</span>
                          <code className="bg-[#11141a] border border-border-main/50 px-1 rounded text-amber-400 font-semibold shrink-0">{getFormattedSymbol(r.readSymbol)}</code>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="bg-purple-950/40 text-purple-400 px-1 rounded border border-purple-500/10 shrink-0">{r.moveDirection}</span>
                          <span className="text-text-faint text-[8px] font-bold shrink-0">➜</span>
                          <code className="bg-[#11141a] border border-border-main/50 px-1 rounded text-emerald-400 font-bold shrink-0">{getFormattedSymbol(r.writeSymbol)}</code>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })()}
        {hoveredEdge && (() => {
          const ruleId = hoveredEdge.id.split('-').slice(0, -1).join('-');
          const rule = rules.find(r => r.id === ruleId) || rules.find(r => r.id === hoveredEdge.id);
          if (!rule) return null;

          const sourceColor = activeScenario?.stateColors?.[rule.currentState] || 'var(--color-diagram-node)';
          const targetColor = activeScenario?.stateColors?.[rule.nextState] || 'var(--color-diagram-node)';
          
          const sourceLabel = activeScenario?.stateLabels?.[rule.currentState];
          const targetLabel = activeScenario?.stateLabels?.[rule.nextState];

          const getFormattedSymbol = (sym: string) => {
            const clean = (sym || '_').trim() || '_';
            const alias = symbolAliases?.[clean];
            return alias ? `${clean} (${alias})` : clean;
          };

          const transformX = hoveredEdge.x > hoveredEdge.boundsWidth * 0.65 ? '-110%' : '15px';
          const transformY = hoveredEdge.y > hoveredEdge.boundsHeight * 0.65 ? '-110%' : '15px';

          const isActive = rule.id === lastRuleId;

          return (
            <div 
              id="edge-hover-tooltip"
              className="absolute z-[150] pointer-events-none bg-bg-panel/95 backdrop-blur-md border border-border-main p-3.5 rounded-lg shadow-2xl text-[10px] text-text-primary flex flex-col gap-3 max-w-[290px] min-w-[210px]"
              style={{ 
                top: hoveredEdge.y, 
                left: hoveredEdge.x,
                transform: `translate(${transformX}, ${transformY})`,
                transition: 'transform 0.15s ease-out, top 0.05s ease-out, left 0.05s ease-out',
              }}
            >
              <div className="flex flex-col gap-1 border-b border-border-main/60 pb-2">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-sans text-[9px] font-bold tracking-widest text-text-muted uppercase">
                    Transition Rule
                  </span>
                  {isActive && (
                    <span className="px-1.5 py-0.5 bg-primary-base/20 text-primary-base border border-primary-base/30 text-[8px] font-bold uppercase tracking-wider rounded font-sans leading-none shrink-0 animate-pulse">
                      Active
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2 font-mono">
                <div className="flex items-center justify-between gap-1 bg-[#11141a]/60 border border-border-main/40 rounded-lg p-2 font-sans">
                  <div className="flex flex-col items-center gap-1 min-w-0 flex-1">
                    <div className="flex items-center gap-1 max-w-full">
                      <span className="w-2 h-2 rounded-full border border-black/40 shrink-0" style={{ backgroundColor: sourceColor === 'var(--color-diagram-node)' ? 'transparent' : sourceColor }}></span>
                      <span className="font-mono text-[10px] font-bold truncate text-text-primary">{rule.currentState}</span>
                    </div>
                    {sourceLabel && <span className="text-[8px] text-text-faint truncate max-w-full">({sourceLabel})</span>}
                  </div>

                  <div className="flex flex-col items-center justify-center shrink-0 px-1">
                    <span className="text-[10px] text-text-faint font-bold leading-none">➜</span>
                  </div>

                  <div className="flex flex-col items-center gap-1 min-w-0 flex-1">
                    <div className="flex items-center gap-1 max-w-full">
                      <span className="w-2 h-2 rounded-full border border-black/40 shrink-0" style={{ backgroundColor: targetColor === 'var(--color-diagram-node)' ? 'transparent' : targetColor }}></span>
                      <span className="font-mono text-[10px] font-bold truncate text-text-primary">{rule.nextState}</span>
                    </div>
                    {targetLabel && <span className="text-[8px] text-text-faint truncate max-w-full">({targetLabel})</span>}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 border-t border-border-main/30 pt-2 font-sans text-xs">
                  <div className="flex items-center justify-between gap-2 text-[10px]">
                    <span className="text-text-muted">IF TAPE READS:</span>
                    <code className="px-1.5 py-0.5 bg-[#11141a] border border-border-main/50 rounded font-mono font-bold text-amber-400">
                      {getFormattedSymbol(rule.readSymbol)}
                    </code>
                  </div>
                  
                  <div className="flex items-center justify-between gap-2 text-[10px]">
                    <span className="text-text-muted">THEN WRITE:</span>
                    <code className="px-1.5 py-0.5 bg-[#11141a] border border-border-main/50 rounded font-mono font-bold text-emerald-400">
                      {getFormattedSymbol(rule.writeSymbol)}
                    </code>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-[10px]">
                    <span className="text-text-muted">AND MOVE HEAD:</span>
                    <span className="px-2 py-0.5 bg-purple-950/40 text-purple-400 font-bold border border-purple-500/10 rounded font-mono">
                      {rule.moveDirection === 'L' ? 'LEFT (L)' : rule.moveDirection === 'R' ? 'RIGHT (R)' : 'STAY (S)'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
        {selectedNode && (
          <div className="absolute z-[100] bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-bg-panel/95 backdrop-blur border border-border-main p-2 rounded-lg shadow-xl animate-in fade-in slide-in-from-bottom-5">
            <span className="text-[10px] font-bold text-text-primary px-2 tracking-wider">STATE : {selectedNode}</span>
            <div className="h-4 w-[1px] bg-border-main mx-1"></div>
            <input
              type="text"
              className="bg-bg-element border border-border-main rounded px-2 py-1 text-xs text-text-primary outline-none focus:border-primary-base w-32 placeholder-text-muted"
              placeholder="Custom Label..."
              value={activeScenario?.stateLabels?.[selectedNode] || ''}
              onChange={(e) => updateStateLabel(selectedNode, e.target.value)}
            />
            <div className="h-4 w-[1px] bg-border-main mx-1"></div>
            {colors.map(color => (
              <button
                key={color}
                onClick={() => updateStateColor(selectedNode, color)}
                className="w-5 h-5 rounded-full border border-border-active outline-none hover:scale-110 transition-transform shadow-[0_2px_4px_rgba(0,0,0,0.4)]"
                style={{ backgroundColor: color }}
                title={`Set color to ${color}`}
              />
            ))}
            <div className="relative w-5 h-5 rounded-full overflow-hidden border border-border-active hover:scale-110 transition-transform shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
               <input
                 type="color"
                 className="absolute -top-2 -left-2 w-10 h-10 cursor-pointer"
                 value={activeScenario?.stateColors?.[selectedNode] || '#ffffff'}
                 onChange={(e) => updateStateColor(selectedNode, e.target.value)}
                 title="Custom color"
               />
            </div>
            <button onClick={() => setSelectedNode(null)} className="ml-2 text-text-muted hover:text-text-primary hover:bg-bg-element rounded-full p-1 transition-colors"><X size={14} /></button>
          </div>
        )}
        <ReactFlow 
          nodes={liveNodes} 
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onNodeDragStop={handleNodeDragStop}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onNodeContextMenu={onNodeContextMenu}
          onConnect={onConnect}
          connectionLineComponent={SmartConnectionLine}
          snapToGrid={snapToGrid}
          snapGrid={[16, 16]}
          fitView
          attributionPosition="bottom-right"
          proOptions={{ hideAttribution: true }}
          onNodeMouseEnter={onNodeMouseEnter}
          onNodeMouseMove={onNodeMouseMove}
          onNodeMouseLeave={onNodeMouseLeave}
          onNodeDragStart={() => { setHoveredNode(null); setHoveredEdge(null); }}
          onEdgeMouseEnter={onEdgeMouseEnter}
          onEdgeMouseMove={onEdgeMouseMove}
          onEdgeMouseLeave={onEdgeMouseLeave}
        >
          <Background gap={16} size={1} color="var(--color-border-main)" />
          <Controls showInteractive={false}>
            <ControlButton onClick={() => doFitBounds(800)} title="Zoom to Fit">
              <Maximize size={14} className="text-text-primary" />
            </ControlButton>
          </Controls>
          {onExplainLogic && (
            <Panel position="top-left" className="explain-panel flex items-center gap-2 select-none">
              <button 
                onClick={onExplainLogic}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold bg-bg-surface text-primary-base border border-border-main rounded hover:bg-bg-element shadow-sm transition-colors cursor-pointer"
              >
                <BrainCircuit size={12} /> EXPLAIN LOGIC
              </button>
              {status === 'accepted' && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-extrabold text-green-500 bg-green-500/10 border border-green-500/20 rounded shadow-sm uppercase tracking-wider font-mono">
                  <CheckCircle2 size={12} /> SIMULATION ACCEPTED
                </span>
              )}
              {status === 'rejected' && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-extrabold text-red-500 bg-red-500/10 border border-red-500/20 rounded shadow-sm uppercase tracking-wider font-mono">
                  <XCircle size={12} /> SIMULATION REJECTED
                </span>
              )}
              {status === 'error' && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-extrabold text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded shadow-sm uppercase tracking-wider font-mono">
                  <AlertTriangle size={12} /> SIMULATION ERROR
                </span>
              )}
            </Panel>
          )}
          {showLegend && (
            <motion.div drag dragMomentum={false} dragConstraints={containerRef} className="absolute bottom-4 left-4 z-50 pointer-events-auto">
              <div className="bg-bg-panel border border-border-main rounded-lg p-3 shadow-lg flex flex-col gap-2 max-w-[180px]">
                <div className="w-full h-3 flex items-center justify-center cursor-grab active:cursor-grabbing opacity-50 hover:opacity-100 -mt-1 mb-1">
                   <div className="w-6 h-1 bg-text-muted rounded-full"></div>
                </div>
                <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest border-b border-border-main pb-1 mb-1">Legend</h3>
                
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full bg-text-primary shrink-0"></div>
                  <span className="text-text-secondary">Start Point</span>
                </div>
                
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-6 h-4 rounded bg-bg-element border-2 border-[#22c55e] shrink-0"></div>
                  <span className="text-text-secondary">Initial State</span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <div className="w-6 h-4 rounded bg-bg-element border-2 border-border-main shrink-0"></div>
                  <span className="text-text-secondary">Normal State</span>
                </div>
                
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-5 h-5 rounded-full bg-bg-element border-[3px] border-double border-[#3b82f6] shrink-0"></div>
                  <span className="text-text-secondary">Accept State</span>
                </div>
                
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-6 h-4 rounded bg-[#450a0a] border-2 border-[#ef4444] shrink-0"></div>
                  <span className="text-text-secondary">Stuck (Error)</span>
                </div>
                
                <div className="flex items-center gap-2 text-xs mt-1 border-t border-border-main pt-2">
                  <div className="font-mono text-[9px] bg-bg-surface px-1 py-0.5 rounded text-text-muted border border-border-main shrink-0">
                    0→1,R
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="text-text-secondary text-[10px]">Transition Rule</span>
                    <span className="text-text-muted text-[8px]">Read 0, Write 1, Move R</span>
                  </div>
                </div>

                {activeScenario?.stateColors && Object.keys(activeScenario.stateColors).length > 0 && (
                  <div className="flex flex-col gap-1 mt-1 border-t border-border-main pt-2 max-h-36 overflow-y-auto no-scrollbar">
                    <span className="text-[8px] font-bold text-text-muted uppercase tracking-wider">State Colors:</span>
                    {Object.entries(activeScenario.stateColors)
                      .filter(([_, color]) => color && color !== 'var(--color-diagram-node)')
                      .map(([stateName, color]) => (
                        <div key={stateName} className="flex items-center gap-2 text-xs">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/40" style={{ backgroundColor: color }}></div>
                          <span className="text-text-secondary truncate text-[10px]" title={stateName}>{stateName}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
          {heatmapMode && (
            <motion.div drag dragMomentum={false} dragConstraints={containerRef} className="absolute bottom-4 left-[220px] z-50 pointer-events-auto">
              <div className="bg-bg-panel border border-border-main rounded-lg p-3 shadow-lg flex flex-col gap-2 min-w-[200px]">
                <div className="w-full h-3 flex items-center justify-center cursor-grab active:cursor-grabbing opacity-50 hover:opacity-100 -mt-1 mb-1">
                   <div className="w-6 h-1 bg-text-muted rounded-full"></div>
                </div>
                <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest border-b border-border-main pb-1 mb-1">Heatmap Scale</h3>
                
                <div className="flex flex-col gap-1 mt-1">
                  <div className="flex justify-between text-[9px] text-text-secondary leading-none mb-1">
                    <span>High (Red)</span>
                    <span>Low (Blue)</span>
                  </div>
                  <div className="h-2 w-full rounded outline outline-1 outline-border-main" style={{ 
                    background: 'linear-gradient(to right, hsl(0, 80%, 40%), hsl(60, 80%, 40%), hsl(120, 80%, 40%), hsl(180, 80%, 40%), hsl(240, 80%, 40%))' 
                  }}></div>
                </div>
                
                <div className="flex items-center justify-between text-xs mt-3">
                  <span className="text-text-secondary text-[10px]">Unvisited</span>
                  <div className="w-6 h-4 rounded bg-[#1e1e24] border border-[rgba(255,255,255,0.1)] shrink-0"></div>
                </div>
              </div>
            </motion.div>
          )}
          {showMinimap && (
            <MiniMap 
              nodeColor={(n) => {
                if (n.id === '__start__') return 'var(--color-border-main)';
                return 'var(--color-bg-element)';
              }}
              nodeStrokeColor={(n) => {
                 if (n.id === '__start__') return 'var(--color-border-main)';
                 return 'var(--color-text-secondary)';
              }}
              nodeBorderRadius={4}
              maskColor="var(--color-bg-panel)"
              style={{ backgroundColor: 'var(--color-bg-panel)', border: '1px solid var(--color-border-main)' }}
            />
          )}
          {contextMenu && (
            <div 
              className="absolute z-50 bg-bg-panel border border-border-main rounded shadow-lg py-1 text-sm text-text-primary min-w-[140px]"
              style={{ top: contextMenu.top + 10, left: contextMenu.left + 10 }}
            >
              <button 
                className="w-full text-left px-3 py-1.5 hover:bg-bg-element transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={activeScenario?.initialState === contextMenu.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setInitialState(contextMenu.id);
                  closeContextMenu();
                }}
              >
                Set as Start
              </button>
              <button 
                className="w-full text-left px-3 py-1.5 hover:bg-bg-element transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleAcceptState(contextMenu.id);
                  closeContextMenu();
                }}
              >
                {activeScenario?.acceptStates.includes(contextMenu.id) ? 'Remove from Accept' : 'Set as Accept'}
              </button>
              <div className="h-px bg-border-main my-1 mx-2" />
              <button 
                className="w-full text-left px-3 py-1.5 hover:bg-bg-element transition-colors text-red-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={activeScenario?.initialState === contextMenu.id}
                onClick={(e) => {
                  e.stopPropagation();
                  deleteState(contextMenu.id);
                  closeContextMenu();
                }}
              >
                Delete State
              </button>
              {contextMenu.showAlign && (
                <>
                  <div className="h-px bg-border-main my-1 mx-2" />
                  <div className="px-3 py-1 text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">Align</div>
                  <div className="grid grid-cols-3 gap-1 px-2 pb-2">
                    <button onClick={(e) => { e.stopPropagation(); handleAlign('left'); }} className="text-xs py-1 text-center bg-bg-element hover:bg-border-active rounded">Left</button>
                    <button onClick={(e) => { e.stopPropagation(); handleAlign('center'); }} className="text-xs py-1 text-center bg-bg-element hover:bg-border-active rounded">Center</button>
                    <button onClick={(e) => { e.stopPropagation(); handleAlign('right'); }} className="text-xs py-1 text-center bg-bg-element hover:bg-border-active rounded">Right</button>
                    <button onClick={(e) => { e.stopPropagation(); handleAlign('top'); }} className="text-xs py-1 text-center bg-bg-element hover:bg-border-active rounded">Top</button>
                    <button onClick={(e) => { e.stopPropagation(); handleAlign('middle'); }} className="text-xs py-1 text-center bg-bg-element hover:bg-border-active rounded">Middle</button>
                    <button onClick={(e) => { e.stopPropagation(); handleAlign('bottom'); }} className="text-xs py-1 text-center bg-bg-element hover:bg-border-active rounded">Bottom</button>
                  </div>
                </>
              )}
            </div>
          )}
        </ReactFlow>
      </div>

      {showHowItWorks && (
        <div className="absolute inset-0 z-[200] flex items-center justify-center bg-bg-panel/75 backdrop-blur-sm p-4 animate-in fade-in duration-200 pointer-events-auto">
          <div className="bg-bg-panel border border-border-main rounded-xl shadow-2xl max-w-2xl w-full max-h-[85%] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border-main bg-bg-element shrink-0">
              <div className="flex items-center gap-2">
                <HelpCircle className="text-primary-base w-5 h-5 shrink-0" />
                <div className="flex flex-col min-w-0">
                   <h3 className="font-bold text-text-primary text-sm leading-tight truncate">
                     {activeScenario ? `How it works: ${activeScenario.name}` : 'How the Turing Machine Works'}
                   </h3>
                   <span className="text-[10px] text-text-muted font-bold tracking-wider uppercase">
                     {activeScenario ? activeScenario.category || 'Scenario Objective' : 'Custom Implementation Explanation'}
                   </span>
                </div>
              </div>
              <button 
                onClick={() => setShowHowItWorks(false)}
                className="text-text-muted hover:text-text-primary hover:bg-[#2c2c2c] rounded-lg p-1.5 transition-colors shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs leading-relaxed text-text-secondary select-text">
               {getScenarioExplanation(activeScenario?.id || '', rules, activeScenario)}
            </div>

            {/* Footer */}
            <div className="p-3 bg-bg-element border-t border-border-main flex justify-end shrink-0">
              <button 
                onClick={() => setShowHowItWorks(false)}
                className="px-4 py-1.5 bg-primary-base hover:bg-primary-base/90 text-bg-panel font-bold text-[10px] uppercase tracking-wider rounded transition-colors shadow-sm animate-pulse-subtle"
              >
                Got it, close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const StateDiagram: React.FC<StateDiagramProps> = ({ onExplainLogic }) => (
  <ReactFlowProvider>
    <StateDiagramInternal onExplainLogic={onExplainLogic} />
  </ReactFlowProvider>
);
