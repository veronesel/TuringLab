import { TMScenario } from '../types/tm';
import { v4 as uuidv4 } from 'uuid';

export const presetScenarios: TMScenario[] = [
  {
    id: "binary-palindrome",
    name: "Binary Palindrome Detector",
    description: "Detects if a binary string is a palindrome. It repeatedly crosses off matching pairs of 0s or 1s at opposite ends of the string. If all characters are successfully crossed off, it reaches the accept state.",
    initialTape: "101101",
    initialHeadPosition: 0,
    initialState: "start",
    acceptStates: ["accept"],
    rules: [
      // 0 read at start
      { id: uuidv4(), currentState: "start", readSymbol: "0", nextState: "have_0", writeSymbol: "_", moveDirection: "R" },
      { id: uuidv4(), currentState: "have_0", readSymbol: "0", nextState: "have_0", writeSymbol: "0", moveDirection: "R" },
      { id: uuidv4(), currentState: "have_0", readSymbol: "1", nextState: "have_0", writeSymbol: "1", moveDirection: "R" },
      { id: uuidv4(), currentState: "have_0", readSymbol: "_", nextState: "match_0", writeSymbol: "_", moveDirection: "L" },
      { id: uuidv4(), currentState: "match_0", readSymbol: "0", nextState: "back", writeSymbol: "_", moveDirection: "L" },
      
      // 1 read at start
      { id: uuidv4(), currentState: "start", readSymbol: "1", nextState: "have_1", writeSymbol: "_", moveDirection: "R" },
      { id: uuidv4(), currentState: "have_1", readSymbol: "0", nextState: "have_1", writeSymbol: "0", moveDirection: "R" },
      { id: uuidv4(), currentState: "have_1", readSymbol: "1", nextState: "have_1", writeSymbol: "1", moveDirection: "R" },
      { id: uuidv4(), currentState: "have_1", readSymbol: "_", nextState: "match_1", writeSymbol: "_", moveDirection: "L" },
      { id: uuidv4(), currentState: "match_1", readSymbol: "1", nextState: "back", writeSymbol: "_", moveDirection: "L" },
      
      // Backtrack
      { id: uuidv4(), currentState: "back", readSymbol: "0", nextState: "back", writeSymbol: "0", moveDirection: "L" },
      { id: uuidv4(), currentState: "back", readSymbol: "1", nextState: "back", writeSymbol: "1", moveDirection: "L" },
      { id: uuidv4(), currentState: "back", readSymbol: "_", nextState: "start", writeSymbol: "_", moveDirection: "R" },
      
      // Accept cases (empty or 1 remaining)
      { id: uuidv4(), currentState: "start", readSymbol: "_", nextState: "accept", writeSymbol: "_", moveDirection: "S" },
      { id: uuidv4(), currentState: "match_0", readSymbol: "_", nextState: "accept", writeSymbol: "_", moveDirection: "S" },
      { id: uuidv4(), currentState: "match_1", readSymbol: "_", nextState: "accept", writeSymbol: "_", moveDirection: "S" }
    ]
  },
  {
    id: "unary-addition",
    name: "Unary Addition",
    description: "Adds two unary numbers separated by '0'. It replaces the '0' with '1' and removes the last '1', effectively concatenating the two numbers.",
    initialTape: "111011",
    initialHeadPosition: 0,
    initialState: "q0",
    acceptStates: ["qf"],
    rules: [
      { id: uuidv4(), currentState: "q0", readSymbol: "1", nextState: "q0", writeSymbol: "1", moveDirection: "R" },
      { id: uuidv4(), currentState: "q0", readSymbol: "0", nextState: "q1", writeSymbol: "1", moveDirection: "R" },
      { id: uuidv4(), currentState: "q1", readSymbol: "1", nextState: "q1", writeSymbol: "1", moveDirection: "R" },
      { id: uuidv4(), currentState: "q1", readSymbol: "_", nextState: "q2", writeSymbol: "_", moveDirection: "L" },
      { id: uuidv4(), currentState: "q2", readSymbol: "1", nextState: "qf", writeSymbol: "_", moveDirection: "L" },
    ]
  },
  {
    id: "busy-beaver-3",
    name: "3-State Busy Beaver",
    description: "A 3-state, 2-symbol busy beaver. It tries to write as many 1s as possible and run as long as possible before halting on an initially blank tape.",
    initialTape: "_",
    initialHeadPosition: 10, // Start away from 0 to avoid immediate negative indices visualizing badly
    initialState: "A",
    acceptStates: ["H"],
    rules: [
      { id: uuidv4(), currentState: "A", readSymbol: "_", nextState: "B", writeSymbol: "1", moveDirection: "R" },
      { id: uuidv4(), currentState: "A", readSymbol: "1", nextState: "H", writeSymbol: "1", moveDirection: "R" }, // Using H as halt
      
      { id: uuidv4(), currentState: "B", readSymbol: "_", nextState: "C", writeSymbol: "1", moveDirection: "L" },
      { id: uuidv4(), currentState: "B", readSymbol: "1", nextState: "B", writeSymbol: "1", moveDirection: "R" },
      
      { id: uuidv4(), currentState: "C", readSymbol: "_", nextState: "C", writeSymbol: "1", moveDirection: "L" },
      { id: uuidv4(), currentState: "C", readSymbol: "1", nextState: "A", writeSymbol: "1", moveDirection: "L" },
    ]
  }
];
