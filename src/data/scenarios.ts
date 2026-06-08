import { TMScenario } from '../types/tm';
import { v4 as uuidv4 } from 'uuid';

export const presetScenarios: TMScenario[] = [
  {
    id: "binary-palindrome",
    name: "Binary Palindrome Detector",
    description: "Detects if a binary string is a palindrome. It repeatedly crosses off matching pairs of 0s or 1s at opposite ends of the string. If all characters are successfully crossed off, it reaches the accept state.",
    category: "Language Recognition",
    initialTape: "101101",
    initialHeadPosition: 0,
    initialState: "start",
    acceptStates: ["accept"],
    rules: [
      { id: uuidv4(), currentState: "start", readSymbol: "0", nextState: "have_0", writeSymbol: "_", moveDirection: "R" },
      { id: uuidv4(), currentState: "have_0", readSymbol: "0", nextState: "have_0", writeSymbol: "0", moveDirection: "R" },
      { id: uuidv4(), currentState: "have_0", readSymbol: "1", nextState: "have_0", writeSymbol: "1", moveDirection: "R" },
      { id: uuidv4(), currentState: "have_0", readSymbol: "_", nextState: "match_0", writeSymbol: "_", moveDirection: "L" },
      { id: uuidv4(), currentState: "match_0", readSymbol: "0", nextState: "back", writeSymbol: "_", moveDirection: "L" },
      { id: uuidv4(), currentState: "start", readSymbol: "1", nextState: "have_1", writeSymbol: "_", moveDirection: "R" },
      { id: uuidv4(), currentState: "have_1", readSymbol: "0", nextState: "have_1", writeSymbol: "0", moveDirection: "R" },
      { id: uuidv4(), currentState: "have_1", readSymbol: "1", nextState: "have_1", writeSymbol: "1", moveDirection: "R" },
      { id: uuidv4(), currentState: "have_1", readSymbol: "_", nextState: "match_1", writeSymbol: "_", moveDirection: "L" },
      { id: uuidv4(), currentState: "match_1", readSymbol: "1", nextState: "back", writeSymbol: "_", moveDirection: "L" },
      { id: uuidv4(), currentState: "back", readSymbol: "0", nextState: "back", writeSymbol: "0", moveDirection: "L" },
      { id: uuidv4(), currentState: "back", readSymbol: "1", nextState: "back", writeSymbol: "1", moveDirection: "L" },
      { id: uuidv4(), currentState: "back", readSymbol: "_", nextState: "start", writeSymbol: "_", moveDirection: "R" },
      { id: uuidv4(), currentState: "start", readSymbol: "_", nextState: "accept", writeSymbol: "_", moveDirection: "S" },
      { id: uuidv4(), currentState: "match_0", readSymbol: "_", nextState: "accept", writeSymbol: "_", moveDirection: "S" },
      { id: uuidv4(), currentState: "match_1", readSymbol: "_", nextState: "accept", writeSymbol: "_", moveDirection: "S" }
    ]
  },
  {
    id: "unary-addition",
    name: "Unary Addition",
    category: "Unary Math",
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
    category: "Busy Beavers",
    description: "A 3-state, 2-symbol busy beaver. It tries to write as many 1s as possible and run as long as possible before halting on an initially blank tape.",
    initialTape: "_",
    initialHeadPosition: 10,
    initialState: "A",
    acceptStates: ["H"],
    rules: [
      { id: uuidv4(), currentState: "A", readSymbol: "_", nextState: "B", writeSymbol: "1", moveDirection: "R" },
      { id: uuidv4(), currentState: "A", readSymbol: "1", nextState: "H", writeSymbol: "1", moveDirection: "R" },
      { id: uuidv4(), currentState: "B", readSymbol: "_", nextState: "C", writeSymbol: "1", moveDirection: "L" },
      { id: uuidv4(), currentState: "B", readSymbol: "1", nextState: "B", writeSymbol: "1", moveDirection: "R" },
      { id: uuidv4(), currentState: "C", readSymbol: "_", nextState: "C", writeSymbol: "1", moveDirection: "L" },
      { id: uuidv4(), currentState: "C", readSymbol: "1", nextState: "A", writeSymbol: "1", moveDirection: "L" },
    ]
  },
  {
    id: "binary-increment",
    name: "Binary Increment (Add 1)",
    category: "Binary Math",
    description: "Increments a binary number by 1. Starts at the leftmost digit, moves right, and adds 1.",
    initialTape: "1011",
    initialHeadPosition: 0,
    initialState: "find_end",
    acceptStates: ["accept"],
    rules: [
      { id: uuidv4(), currentState: "find_end", readSymbol: "0", nextState: "find_end", writeSymbol: "0", moveDirection: "R" },
      { id: uuidv4(), currentState: "find_end", readSymbol: "1", nextState: "find_end", writeSymbol: "1", moveDirection: "R" },
      { id: uuidv4(), currentState: "find_end", readSymbol: "_", nextState: "add_one", writeSymbol: "_", moveDirection: "L" },
      { id: uuidv4(), currentState: "add_one", readSymbol: "1", nextState: "add_one", writeSymbol: "0", moveDirection: "L" },
      { id: uuidv4(), currentState: "add_one", readSymbol: "0", nextState: "accept", writeSymbol: "1", moveDirection: "S" },
      { id: uuidv4(), currentState: "add_one", readSymbol: "_", nextState: "accept", writeSymbol: "1", moveDirection: "S" }
    ]
  },
  {
    id: "binary-decrement",
    name: "Binary Decrement (Sub 1)",
    category: "Binary Math",
    description: "Decrements a binary number by 1.",
    initialTape: "1000",
    initialHeadPosition: 0,
    initialState: "find_end",
    acceptStates: ["accept"],
    rules: [
      { id: uuidv4(), currentState: "find_end", readSymbol: "0", nextState: "find_end", writeSymbol: "0", moveDirection: "R" },
      { id: uuidv4(), currentState: "find_end", readSymbol: "1", nextState: "find_end", writeSymbol: "1", moveDirection: "R" },
      { id: uuidv4(), currentState: "find_end", readSymbol: "_", nextState: "sub_one", writeSymbol: "_", moveDirection: "L" },
      { id: uuidv4(), currentState: "sub_one", readSymbol: "0", nextState: "sub_one", writeSymbol: "1", moveDirection: "L" },
      { id: uuidv4(), currentState: "sub_one", readSymbol: "1", nextState: "accept", writeSymbol: "0", moveDirection: "S" }
    ]
  },
  {
    id: "bit-inverter",
    name: "Bit Inverter (NOT gate)",
    category: "Basics",
    description: "Inverts all bits on the tape (0s become 1s, 1s become 0s).",
    initialTape: "1011001",
    initialHeadPosition: 0,
    initialState: "invert",
    acceptStates: ["accept"],
    rules: [
      { id: uuidv4(), currentState: "invert", readSymbol: "0", nextState: "invert", writeSymbol: "1", moveDirection: "R" },
      { id: uuidv4(), currentState: "invert", readSymbol: "1", nextState: "invert", writeSymbol: "0", moveDirection: "R" },
      { id: uuidv4(), currentState: "invert", readSymbol: "_", nextState: "accept", writeSymbol: "_", moveDirection: "S" }
    ]
  },
  {
    id: "copy-unary",
    name: "Copy Unary String",
    category: "Unary Math",
    description: "Creates a copy of a unary string of 1s separated by a blank.",
    initialTape: "111_",
    initialHeadPosition: 0,
    initialState: "q0",
    acceptStates: ["halt"],
    rules: [
      { id: uuidv4(), currentState: "q0", readSymbol: "1", nextState: "q1", writeSymbol: "X", moveDirection: "R" },
      { id: uuidv4(), currentState: "q0", readSymbol: "_", nextState: "q5", writeSymbol: "_", moveDirection: "L" },
      { id: uuidv4(), currentState: "q1", readSymbol: "1", nextState: "q1", writeSymbol: "1", moveDirection: "R" },
      { id: uuidv4(), currentState: "q1", readSymbol: "_", nextState: "q2", writeSymbol: "_", moveDirection: "R" },
      { id: uuidv4(), currentState: "q2", readSymbol: "1", nextState: "q2", writeSymbol: "1", moveDirection: "R" },
      { id: uuidv4(), currentState: "q2", readSymbol: "_", nextState: "q3", writeSymbol: "1", moveDirection: "L" },
      { id: uuidv4(), currentState: "q3", readSymbol: "1", nextState: "q3", writeSymbol: "1", moveDirection: "L" },
      { id: uuidv4(), currentState: "q3", readSymbol: "_", nextState: "q4", writeSymbol: "_", moveDirection: "L" },
      { id: uuidv4(), currentState: "q4", readSymbol: "1", nextState: "q4", writeSymbol: "1", moveDirection: "L" },
      { id: uuidv4(), currentState: "q4", readSymbol: "X", nextState: "q0", writeSymbol: "X", moveDirection: "R" },
      { id: uuidv4(), currentState: "q5", readSymbol: "X", nextState: "q5", writeSymbol: "1", moveDirection: "L" },
      { id: uuidv4(), currentState: "q5", readSymbol: "_", nextState: "halt", writeSymbol: "_", moveDirection: "R" }
    ]
  },
  { id: "shift-right", category: "Basics", name: "Shift Right", description: "Shifts a binary string one position to the right.", initialTape: "1011_", initialHeadPosition: 0, initialState: "read", acceptStates: ["accept"], rules: [{ id: uuidv4(), currentState: "read", readSymbol: "0", nextState: "write_0", writeSymbol: "_", moveDirection: "R" }, { id: uuidv4(), currentState: "read", readSymbol: "1", nextState: "write_1", writeSymbol: "_", moveDirection: "R" }, { id: uuidv4(), currentState: "read", readSymbol: "_", nextState: "accept", writeSymbol: "_", moveDirection: "S" }, { id: uuidv4(), currentState: "write_0", readSymbol: "0", nextState: "write_0", writeSymbol: "0", moveDirection: "R" }, { id: uuidv4(), currentState: "write_0", readSymbol: "1", nextState: "write_1", writeSymbol: "0", moveDirection: "R" }, { id: uuidv4(), currentState: "write_0", readSymbol: "_", nextState: "read", writeSymbol: "0", moveDirection: "L" }, { id: uuidv4(), currentState: "write_1", readSymbol: "0", nextState: "write_0", writeSymbol: "1", moveDirection: "R" }, { id: uuidv4(), currentState: "write_1", readSymbol: "1", nextState: "write_1", writeSymbol: "1", moveDirection: "R" }, { id: uuidv4(), currentState: "write_1", readSymbol: "_", nextState: "read", writeSymbol: "1", moveDirection: "L" }] },
  { id: "find-pattern", category: "Language Recognition", name: "Find Pattern '11'", description: "Halts when it finds two consecutive 1s.", initialTape: "10010110", initialHeadPosition: 0, initialState: "start", acceptStates: ["found"], rules: [{ id: uuidv4(), currentState: "start", readSymbol: "0", nextState: "start", writeSymbol: "0", moveDirection: "R" }, { id: uuidv4(), currentState: "start", readSymbol: "1", nextState: "seen_one", writeSymbol: "1", moveDirection: "R" }, { id: uuidv4(), currentState: "seen_one", readSymbol: "0", nextState: "start", writeSymbol: "0", moveDirection: "R" }, { id: uuidv4(), currentState: "seen_one", readSymbol: "1", nextState: "found", writeSymbol: "1", moveDirection: "S" }] },
  { id: "clear-tape", category: "Basics", name: "Clear Tape", description: "Changes all 1s and 0s to blank spaces.", initialTape: "1011", initialHeadPosition: 0, initialState: "clear", acceptStates: ["accept"], rules: [{ id: uuidv4(), currentState: "clear", readSymbol: "0", nextState: "clear", writeSymbol: "_", moveDirection: "R" }, { id: uuidv4(), currentState: "clear", readSymbol: "1", nextState: "clear", writeSymbol: "_", moveDirection: "R" }, { id: uuidv4(), currentState: "clear", readSymbol: "_", nextState: "accept", writeSymbol: "_", moveDirection: "S" }] },
  { id: "duplicate-char", category: "Language Recognition", name: "Duplicate Characters", description: "Duplicates every character (e.g., 10 -> 1100).", initialTape: "10", initialHeadPosition: 0, initialState: "read", acceptStates: ["accept"], rules: [{ id: uuidv4(), currentState: "read", readSymbol: "1", nextState: "dup1", writeSymbol: "X", moveDirection: "R" }, { id: uuidv4(), currentState: "read", readSymbol: "0", nextState: "dup0", writeSymbol: "Y", moveDirection: "R" }, { id: uuidv4(), currentState: "read", readSymbol: "_", nextState: "cleanup", writeSymbol: "_", moveDirection: "L" }, { id: uuidv4(), currentState: "dup1", readSymbol: "1", nextState: "dup1", writeSymbol: "1", moveDirection: "R" }, { id: uuidv4(), currentState: "dup1", readSymbol: "0", nextState: "dup1", writeSymbol: "0", moveDirection: "R" }, { id: uuidv4(), currentState: "dup1", readSymbol: "_", nextState: "place1_a", writeSymbol: "1", moveDirection: "R" }, { id: uuidv4(), currentState: "place1_a", readSymbol: "_", nextState: "back", writeSymbol: "1", moveDirection: "L" }, { id: uuidv4(), currentState: "dup0", readSymbol: "1", nextState: "dup0", writeSymbol: "1", moveDirection: "R" }, { id: uuidv4(), currentState: "dup0", readSymbol: "0", nextState: "dup0", writeSymbol: "0", moveDirection: "R" }, { id: uuidv4(), currentState: "dup0", readSymbol: "_", nextState: "place0_a", writeSymbol: "0", moveDirection: "R" }, { id: uuidv4(), currentState: "place0_a", readSymbol: "_", nextState: "back", writeSymbol: "0", moveDirection: "L" }, { id: uuidv4(), currentState: "back", readSymbol: "1", nextState: "back", writeSymbol: "1", moveDirection: "L" }, { id: uuidv4(), currentState: "back", readSymbol: "0", nextState: "back", writeSymbol: "0", moveDirection: "L" }, { id: uuidv4(), currentState: "back", readSymbol: "X", nextState: "read", writeSymbol: "X", moveDirection: "R" }, { id: uuidv4(), currentState: "back", readSymbol: "Y", nextState: "read", writeSymbol: "Y", moveDirection: "R" }, { id: uuidv4(), currentState: "cleanup", readSymbol: "X", nextState: "cleanup", writeSymbol: "1", moveDirection: "L" }, { id: uuidv4(), currentState: "cleanup", readSymbol: "Y", nextState: "cleanup", writeSymbol: "0", moveDirection: "L" }, { id: uuidv4(), currentState: "cleanup", readSymbol: "_", nextState: "accept", writeSymbol: "_", moveDirection: "R" }] },
  { id: "binary-equal", category: "Binary Math", name: "Binary Equality", description: "Checks if two binary numbers separated by '#' are equal.", initialTape: "10#10", initialHeadPosition: 0, initialState: "read", acceptStates: ["accept"], rules: [{ id: uuidv4(), currentState: "read", readSymbol: "0", nextState: "match0", writeSymbol: "X", moveDirection: "R" }, { id: uuidv4(), currentState: "read", readSymbol: "1", nextState: "match1", writeSymbol: "X", moveDirection: "R" }, { id: uuidv4(), currentState: "read", readSymbol: "#", nextState: "check_done", writeSymbol: "#", moveDirection: "R" }, { id: uuidv4(), currentState: "match0", readSymbol: "0", nextState: "match0", writeSymbol: "0", moveDirection: "R" }, { id: uuidv4(), currentState: "match0", readSymbol: "1", nextState: "match0", writeSymbol: "1", moveDirection: "R" }, { id: uuidv4(), currentState: "match0", readSymbol: "#", nextState: "find0", writeSymbol: "#", moveDirection: "R" }, { id: uuidv4(), currentState: "find0", readSymbol: "X", nextState: "find0", writeSymbol: "X", moveDirection: "R" }, { id: uuidv4(), currentState: "find0", readSymbol: "0", nextState: "back", writeSymbol: "X", moveDirection: "L" }, { id: uuidv4(), currentState: "match1", readSymbol: "0", nextState: "match1", writeSymbol: "0", moveDirection: "R" }, { id: uuidv4(), currentState: "match1", readSymbol: "1", nextState: "match1", writeSymbol: "1", moveDirection: "R" }, { id: uuidv4(), currentState: "match1", readSymbol: "#", nextState: "find1", writeSymbol: "#", moveDirection: "R" }, { id: uuidv4(), currentState: "find1", readSymbol: "X", nextState: "find1", writeSymbol: "X", moveDirection: "R" }, { id: uuidv4(), currentState: "find1", readSymbol: "1", nextState: "back", writeSymbol: "X", moveDirection: "L" }, { id: uuidv4(), currentState: "back", readSymbol: "0", nextState: "back", writeSymbol: "0", moveDirection: "L" }, { id: uuidv4(), currentState: "back", readSymbol: "1", nextState: "back", writeSymbol: "1", moveDirection: "L" }, { id: uuidv4(), currentState: "back", readSymbol: "X", nextState: "back", writeSymbol: "X", moveDirection: "L" }, { id: uuidv4(), currentState: "back", readSymbol: "#", nextState: "backto_start", writeSymbol: "#", moveDirection: "L" }, { id: uuidv4(), currentState: "backto_start", readSymbol: "0", nextState: "backto_start", writeSymbol: "0", moveDirection: "L" }, { id: uuidv4(), currentState: "backto_start", readSymbol: "1", nextState: "backto_start", writeSymbol: "1", moveDirection: "L" }, { id: uuidv4(), currentState: "backto_start", readSymbol: "X", nextState: "read", writeSymbol: "X", moveDirection: "R" }, { id: uuidv4(), currentState: "check_done", readSymbol: "X", nextState: "check_done", writeSymbol: "X", moveDirection: "R" }, { id: uuidv4(), currentState: "check_done", readSymbol: "_", nextState: "accept", writeSymbol: "_", moveDirection: "S" }] },
  { id: "busy-beaver-4", category: "Busy Beavers", name: "4-State Busy Beaver", description: "A 4-state busy beaver.", initialTape: "_", initialHeadPosition: 10, initialState: "A", acceptStates: ["H"], rules: [{ id: uuidv4(), currentState: "A", readSymbol: "_", nextState: "B", writeSymbol: "1", moveDirection: "R" }, { id: uuidv4(), currentState: "A", readSymbol: "1", nextState: "B", writeSymbol: "1", moveDirection: "L" }, { id: uuidv4(), currentState: "B", readSymbol: "_", nextState: "A", writeSymbol: "1", moveDirection: "L" }, { id: uuidv4(), currentState: "B", readSymbol: "1", nextState: "C", writeSymbol: "_", moveDirection: "L" }, { id: uuidv4(), currentState: "C", readSymbol: "_", nextState: "H", writeSymbol: "1", moveDirection: "R" }, { id: uuidv4(), currentState: "C", readSymbol: "1", nextState: "D", writeSymbol: "1", moveDirection: "L" }, { id: uuidv4(), currentState: "D", readSymbol: "_", nextState: "D", writeSymbol: "1", moveDirection: "R" }, { id: uuidv4(), currentState: "D", readSymbol: "1", nextState: "A", writeSymbol: "_", moveDirection: "R" }] },
  { id: "binary-to-unary", category: "Binary Math", name: "Binary to Unary", description: "Converts binary to unary format.", initialTape: "10", initialHeadPosition: 0, initialState: "start", acceptStates: ["accept"], rules: [{ id: uuidv4(), currentState: "start", readSymbol: "0", nextState: "start", writeSymbol: "0", moveDirection: "R" }, { id: uuidv4(), currentState: "start", readSymbol: "1", nextState: "start", writeSymbol: "1", moveDirection: "R" }, { id: uuidv4(), currentState: "start", readSymbol: "_", nextState: "setup", writeSymbol: "Y", moveDirection: "L" }, { id: uuidv4(), currentState: "setup", readSymbol: "0", nextState: "sub", writeSymbol: "0", moveDirection: "S" }, { id: uuidv4(), currentState: "setup", readSymbol: "1", nextState: "sub", writeSymbol: "1", moveDirection: "S" }, { id: uuidv4(), currentState: "sub", readSymbol: "0", nextState: "sub", writeSymbol: "1", moveDirection: "L" }, { id: uuidv4(), currentState: "sub", readSymbol: "1", nextState: "add1", writeSymbol: "0", moveDirection: "R" }, { id: uuidv4(), currentState: "sub", readSymbol: "_", nextState: "cleanup", writeSymbol: "_", moveDirection: "R" }, { id: uuidv4(), currentState: "add1", readSymbol: "0", nextState: "add1", writeSymbol: "0", moveDirection: "R" }, { id: uuidv4(), currentState: "add1", readSymbol: "1", nextState: "add1", writeSymbol: "1", moveDirection: "R" }, { id: uuidv4(), currentState: "add1", readSymbol: "Y", nextState: "add1", writeSymbol: "Y", moveDirection: "R" }, { id: uuidv4(), currentState: "add1", readSymbol: "_", nextState: "back", writeSymbol: "Y", moveDirection: "L" }, { id: uuidv4(), currentState: "back", readSymbol: "Y", nextState: "back", writeSymbol: "Y", moveDirection: "L" }, { id: uuidv4(), currentState: "back", readSymbol: "0", nextState: "back", writeSymbol: "0", moveDirection: "L" }, { id: uuidv4(), currentState: "back", readSymbol: "1", nextState: "back", writeSymbol: "1", moveDirection: "L" }, { id: uuidv4(), currentState: "back", readSymbol: "_", nextState: "setup", writeSymbol: "_", moveDirection: "R" }, { id: uuidv4(), currentState: "cleanup", readSymbol: "0", nextState: "cleanup", writeSymbol: "_", moveDirection: "R" }, { id: uuidv4(), currentState: "cleanup", readSymbol: "Y", nextState: "accept", writeSymbol: "Y", moveDirection: "S" }] },
  { id: "find-middle", category: "Basics", name: "Find Middle (Odd Length)", description: "Finds the exact middle of an odd-length string.", initialTape: "11111", initialHeadPosition: 0, initialState: "right", acceptStates: ["accept"], rules: [{ id: uuidv4(), currentState: "right", readSymbol: "1", nextState: "toright", writeSymbol: "X", moveDirection: "R" }, { id: uuidv4(), currentState: "toright", readSymbol: "1", nextState: "toright", writeSymbol: "1", moveDirection: "R" }, { id: uuidv4(), currentState: "toright", readSymbol: "X", nextState: "left", writeSymbol: "X", moveDirection: "L" }, { id: uuidv4(), currentState: "toright", readSymbol: "_", nextState: "left", writeSymbol: "_", moveDirection: "L" }, { id: uuidv4(), currentState: "left", readSymbol: "1", nextState: "toleft", writeSymbol: "X", moveDirection: "L" }, { id: uuidv4(), currentState: "left", readSymbol: "X", nextState: "accept", writeSymbol: "M", moveDirection: "S" }, { id: uuidv4(), currentState: "toleft", readSymbol: "1", nextState: "toleft", writeSymbol: "1", moveDirection: "L" }, { id: uuidv4(), currentState: "toleft", readSymbol: "X", nextState: "right", writeSymbol: "X", moveDirection: "R" }] },
  { id: "swap-01", category: "Language Recognition", name: "Swap 0s and 1s", description: "Swaps all adjacent 0 and 1 pairs.", initialTape: "011001", initialHeadPosition: 0, initialState: "read1", acceptStates: ["accept"], rules: [{ id: uuidv4(), currentState: "read1", readSymbol: "0", nextState: "saw0", writeSymbol: "_", moveDirection: "R" }, { id: uuidv4(), currentState: "read1", readSymbol: "1", nextState: "saw1", writeSymbol: "_", moveDirection: "R" }, { id: uuidv4(), currentState: "read1", readSymbol: "_", nextState: "accept", writeSymbol: "_", moveDirection: "S" }, { id: uuidv4(), currentState: "saw0", readSymbol: "1", nextState: "read1", writeSymbol: "1", moveDirection: "L" }, { id: uuidv4(), currentState: "saw0", readSymbol: "0", nextState: "read1", writeSymbol: "0", moveDirection: "L" }, { id: uuidv4(), currentState: "saw0", readSymbol: "_", nextState: "accept", writeSymbol: "0", moveDirection: "R" }, { id: uuidv4(), currentState: "saw1", readSymbol: "0", nextState: "read1", writeSymbol: "0", moveDirection: "L" }, { id: uuidv4(), currentState: "saw1", readSymbol: "1", nextState: "read1", writeSymbol: "1", moveDirection: "L" }, { id: uuidv4(), currentState: "saw1", readSymbol: "_", nextState: "accept", writeSymbol: "1", moveDirection: "R" }] },
  { id: "count-zeros", category: "Language Recognition", name: "Count Zeros", description: "Counts zeros and outputs result as unary.", initialTape: "10010", initialHeadPosition: 0, initialState: "search", acceptStates: ["accept"], rules: [{ id: uuidv4(), currentState: "search", readSymbol: "0", nextState: "count", writeSymbol: "X", moveDirection: "R" }, { id: uuidv4(), currentState: "search", readSymbol: "1", nextState: "search", writeSymbol: "1", moveDirection: "R" }, { id: uuidv4(), currentState: "search", readSymbol: "_", nextState: "finish", writeSymbol: "_", moveDirection: "L" }, { id: uuidv4(), currentState: "count", readSymbol: "0", nextState: "count", writeSymbol: "0", moveDirection: "R" }, { id: uuidv4(), currentState: "count", readSymbol: "1", nextState: "count", writeSymbol: "1", moveDirection: "R" }, { id: uuidv4(), currentState: "count", readSymbol: "_", nextState: "writemark", writeSymbol: "_", moveDirection: "R" }, { id: uuidv4(), currentState: "writemark", readSymbol: "_", nextState: "write1", writeSymbol: "Y", moveDirection: "R" }, { id: uuidv4(), currentState: "writemark", readSymbol: "Y", nextState: "writemark", writeSymbol: "Y", moveDirection: "R" }, { id: uuidv4(), currentState: "writemark", readSymbol: "1", nextState: "writemark", writeSymbol: "1", moveDirection: "R" }, { id: uuidv4(), currentState: "write1", readSymbol: "_", nextState: "goback", writeSymbol: "1", moveDirection: "L" }, { id: uuidv4(), currentState: "goback", readSymbol: "1", nextState: "goback", writeSymbol: "1", moveDirection: "L" }, { id: uuidv4(), currentState: "goback", readSymbol: "Y", nextState: "goback", writeSymbol: "Y", moveDirection: "L" }, { id: uuidv4(), currentState: "goback", readSymbol: "0", nextState: "goback", writeSymbol: "0", moveDirection: "L" }, { id: uuidv4(), currentState: "goback", readSymbol: "1", nextState: "goback", writeSymbol: "1", moveDirection: "L" }, { id: uuidv4(), currentState: "goback", readSymbol: "_", nextState: "goback", writeSymbol: "_", moveDirection: "L" }, { id: uuidv4(), currentState: "goback", readSymbol: "X", nextState: "search", writeSymbol: "X", moveDirection: "R" }, { id: uuidv4(), currentState: "finish", readSymbol: "X", nextState: "finish", writeSymbol: "0", moveDirection: "L" }, { id: uuidv4(), currentState: "finish", readSymbol: "1", nextState: "finish", writeSymbol: "1", moveDirection: "L" }, { id: uuidv4(), currentState: "finish", readSymbol: "0", nextState: "finish", writeSymbol: "0", moveDirection: "L" }, { id: uuidv4(), currentState: "finish", readSymbol: "_", nextState: "accept", writeSymbol: "_", moveDirection: "R" }] },
  { id: "move-tape", category: "Basics", name: "Move Tape Right", description: "Moves the entire string one unit to the right.", initialTape: "010", initialHeadPosition: 0, initialState: "read", acceptStates: ["accept"], rules: [{ id: uuidv4(), currentState: "read", readSymbol: "0", nextState: "write0", writeSymbol: "_", moveDirection: "R" }, { id: uuidv4(), currentState: "read", readSymbol: "1", nextState: "write1", writeSymbol: "_", moveDirection: "R" }, { id: uuidv4(), currentState: "read", readSymbol: "_", nextState: "accept", writeSymbol: "_", moveDirection: "S" }, { id: uuidv4(), currentState: "write0", readSymbol: "0", nextState: "write0", writeSymbol: "0", moveDirection: "R" }, { id: uuidv4(), currentState: "write0", readSymbol: "1", nextState: "write1", writeSymbol: "0", moveDirection: "R" }, { id: uuidv4(), currentState: "write0", readSymbol: "_", nextState: "read", writeSymbol: "0", moveDirection: "L" }, { id: uuidv4(), currentState: "write1", readSymbol: "0", nextState: "write0", writeSymbol: "1", moveDirection: "R" }, { id: uuidv4(), currentState: "write1", readSymbol: "1", nextState: "write1", writeSymbol: "1", moveDirection: "R" }, { id: uuidv4(), currentState: "write1", readSymbol: "_", nextState: "read", writeSymbol: "1", moveDirection: "L" }] },
  { id: "parity-check", category: "Language Recognition", name: "Parity Check (Even)", description: "Checks if the number of 1s in a string is even.", initialTape: "10111", initialHeadPosition: 0, initialState: "even", acceptStates: ["accept_even"], rules: [{ id: uuidv4(), currentState: "even", readSymbol: "0", nextState: "even", writeSymbol: "0", moveDirection: "R" }, { id: uuidv4(), currentState: "even", readSymbol: "1", nextState: "odd", writeSymbol: "1", moveDirection: "R" }, { id: uuidv4(), currentState: "even", readSymbol: "_", nextState: "accept_even", writeSymbol: "E", moveDirection: "L" }, { id: uuidv4(), currentState: "odd", readSymbol: "0", nextState: "odd", writeSymbol: "0", moveDirection: "R" }, { id: uuidv4(), currentState: "odd", readSymbol: "1", nextState: "even", writeSymbol: "1", moveDirection: "R" }, { id: uuidv4(), currentState: "odd", readSymbol: "_", nextState: "reject", writeSymbol: "O", moveDirection: "L" }] },
  { id: "multiply-by-2", category: "Unary Math", name: "Multiply by 2 (Unary)", description: "Doubles the length of a unary string.", initialTape: "111", initialHeadPosition: 0, initialState: "read", acceptStates: ["accept"], rules: [{ id: uuidv4(), currentState: "read", readSymbol: "1", nextState: "right", writeSymbol: "X", moveDirection: "R" }, { id: uuidv4(), currentState: "read", readSymbol: "_", nextState: "cleanup", writeSymbol: "_", moveDirection: "L" }, { id: uuidv4(), currentState: "right", readSymbol: "1", nextState: "right", writeSymbol: "1", moveDirection: "R" }, { id: uuidv4(), currentState: "right", readSymbol: "A", nextState: "right", writeSymbol: "A", moveDirection: "R" }, { id: uuidv4(), currentState: "right", readSymbol: "_", nextState: "left", writeSymbol: "A", moveDirection: "L" }, { id: uuidv4(), currentState: "left", readSymbol: "1", nextState: "left", writeSymbol: "1", moveDirection: "L" }, { id: uuidv4(), currentState: "left", readSymbol: "A", nextState: "left", writeSymbol: "A", moveDirection: "L" }, { id: uuidv4(), currentState: "left", readSymbol: "X", nextState: "read", writeSymbol: "X", moveDirection: "R" }, { id: uuidv4(), currentState: "cleanup", readSymbol: "X", nextState: "cleanup", writeSymbol: "1", moveDirection: "L" }, { id: uuidv4(), currentState: "cleanup", readSymbol: "A", nextState: "cleanup", writeSymbol: "1", moveDirection: "L" }, { id: uuidv4(), currentState: "cleanup", readSymbol: "_", nextState: "accept", writeSymbol: "_", moveDirection: "R" }] }
];

