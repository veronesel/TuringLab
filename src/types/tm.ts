export type Direction = 'R' | 'L' | 'S';

export interface TMRule {
  id: string;
  currentState: string;
  readSymbol: string;
  nextState: string;
  writeSymbol: string;
  moveDirection: Direction;
}

export interface TMScenario {
  id: string;
  name: string;
  description: string;
  initialTape: string;
  initialHeadPosition: number;
  initialState: string;
  acceptStates: string[];
  rules: TMRule[];
  customPositions?: Record<string, { x: number; y: number }>;
  category?: string;
}

export interface TMHistoryEntry {
  tape: Record<number, string>;
  headPosition: number;
  currentState: string;
  lastRuleId: string | null;
  stepCount: number;
}

export interface TMStatistics {
  stepsExecuted: number;
  tapeMovements: { R: number; L: number; S: number };
  symbolsWritten: number;
  uniqueStatesVisited: number;
  sessionStartTimeMs: number;
  totalTimeMs: number;
  memoryUsage: number;
}
