import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateWithRetry(prompt: string, maxRetries = 3, config?: any) {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      const model = "gemini-3.5-flash";
      return await ai.models.generateContent({
        model,
        contents: prompt,
        config,
      });
    } catch (error: any) {
      attempt++;
      const isRetriable = 
        error?.status === 503 || 
        error?.status === 429 || 
        error?.status === 'UNAVAILABLE' ||
        error?.status === 'RESOURCE_EXHAUSTED' ||
        error?.message?.includes("503") || 
        error?.message?.includes("429");
        
      if (attempt >= maxRetries || !isRetriable) {
        throw error;
      }
      console.warn(`Model generation attempt ${attempt} failed, retrying... (${error?.message || 'Unknown error'})`);
      // Wait a bit longer for 429s, otherwise standard backoff
      const delay = error?.message?.includes("429") ? 5000 : 1000 * attempt;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error("Failed to generate content after retries");
}

function simulateTuringMachine(scenario: any) {
  const tape: Record<number, string> = {};
  const initTapeStr = scenario.initialTape || "";
  for (let i = 0; i < initTapeStr.length; i++) {
    tape[i] = initTapeStr[i];
  }
  
  let headPosition = scenario.initialHeadPosition || 0;
  let currentState = scenario.initialState || "q0";
  const acceptStates = new Set(scenario.acceptStates || []);
  const rules = scenario.rules || [];
  
  let steps = 0;
  const maxSteps = 500;
  const visitedStates = new Set<string>([currentState]);
  
  let status: 'accepted' | 'rejected' | 'halted' | 'timeout' = 'halted';
  
  while (steps < maxSteps) {
    if (acceptStates.has(currentState)) {
      status = 'accepted';
      break;
    }
    
    const currentSymbol = tape[headPosition] || '_';
    
    // Find matching rule
    const matchingRule = rules.find(
      (r: any) => r.currentState === currentState && r.readSymbol === currentSymbol
    );
    
    if (!matchingRule) {
      status = acceptStates.has(currentState) ? 'accepted' : 'rejected';
      break;
    }
    
    // Apply rule
    tape[headPosition] = matchingRule.writeSymbol;
    currentState = matchingRule.nextState;
    visitedStates.add(currentState);
    
    if (matchingRule.moveDirection === 'R') {
      headPosition++;
    } else if (matchingRule.moveDirection === 'L') {
      headPosition--;
    }
    // S means Stay
    
    steps++;
  }
  
  if (steps >= maxSteps) {
    status = 'timeout';
  }
  
  // Format final tape output
  const keys = Object.keys(tape).map(Number);
  const minIdx = keys.length ? Math.min(0, ...keys) : 0;
  const maxIdx = keys.length ? Math.max(0, ...keys) : 0;
  let finalTapeStr = "";
  for (let i = minIdx; i <= maxIdx; i++) {
    finalTapeStr += tape[i] || '_';
  }
  
  return {
    status,
    stepsExecuted: steps,
    uniqueStatesVisited: visitedStates.size,
    finalTape: finalTapeStr.trim(),
    haltedState: currentState,
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Check Health
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // API to generate Turing Simulator Scenario using Gemini
  app.post("/api/generate-scenario", async (req, res) => {
    try {
      const { description, baseScenario } = req.body;
      
      let prompt = `You are an expert in Turing Machines. The user wants to create a new scenario with the following objective:\n"${description}"\n\nGenerate a Turing Machine configuration in JSON format. The scenario MUST have a fully visual state chart layout configuration included inside the "customPositions" dictionary, matching colors in "stateColors", and semantic labels in "stateLabels".\n\n`;

      if (baseScenario) {
        prompt = `You are an expert in Turing Machines. We already have the following Turing Machine scenario configuration:\n\n${JSON.stringify(baseScenario, null, 2)}\n\nThe user wants to apply the following changes or modifications:\n"${description}"\n\nPlease update the configuration to meet these new requirements, keeping everything else intact if not instructed to change, and return the FULL UPDATED Turing Machine configuration in JSON format. Do not truncate the existing rules unless asked. The scenario MUST have a fully visual state chart layout configuration included inside the "customPositions" dictionary, matching colors in "stateColors", and semantic labels in "stateLabels".\n\n`;
      }

      prompt += `It must adhere to the following structure:
      {
        "id": "scenario-slug",
        "name": "Scenario Name",
        "description": "Human-readable description of what the scenario does and how it works. IMPORTANT: This description MUST include and end with a sentence of the exact format: 'Expected Outcome: <brief description of what characters will be on the tape, or which state the machine will halt in, to verify correctness>.' This is critical for the application's verification UI.",
        "initialTape": "010101", // A string of characters representing the initial tape
        "initialHeadPosition": 0, // Integer
        "initialState": "q0",
        "acceptStates": ["q_accept"], // Can be multiple
        "rules": [
          {
            "id": "uuid-or-slug-1",
            "currentState": "q0",
            "readSymbol": "0",
            "nextState": "q1",
            "writeSymbol": "1",
            "moveDirection": "R" // R, L, or S
          }
        ],
        "customPositions": {
          "__start__": { "x": 60, "y": 200 },
          "q0": { "x": 160, "y": 200 },
          "q1": { "x": 325, "y": 140 },
          "q2": { "x": 325, "y": 260 },
          // Place intermediate states smoothly between x=160 and x=550 with vertical rhythm to avoid arrows overlapping
          "q_accept": { "x": 650, "y": 200 }
        },
        "stateColors": {
          "q0": "#3b82f6", // soft blue
          "q1": "#8b5cf6", // violet
          "q_accept": "#10b981" // emerald
        },
        "stateLabels": {
          "q0": "Scan Symbol",
          "q1": "Processing State",
          "q_accept": "Bypass Halt"
        }
      }
      
      Respond with ONLY valid, parseable JSON, and NO COMMENTS in the JSON. The symbols on the tape should be single characters.
      If a rule reads empty/blank, use "_" (underscore). Write "_" for blank.
      Make sure the logic corresponds correctly to the user's objective and is physically testable.`;

      const response = await generateWithRetry(prompt, 3, { responseMimeType: "application/json" });
      let responseText = response.text || "";
      // Clean up markdown wrapper if returned notwithstanding
      if (responseText.startsWith("```json")) {
        responseText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      }
      responseText = responseText.replace(/\/\/.*$/gm, '').trim();

      const configuration = JSON.parse(responseText);

      // Perform backend-level upfront execution test immediately before storing/returning!
      const testResult = simulateTuringMachine(configuration);

      // Embed the testing outcome as a validated system property
      configuration.upfrontTestResult = testResult;

      res.json({ configuration, testResult });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message || "Failed to generate scenario" });
    }
  });

  // API to explain Turing Simulator Scenario using Gemini
  app.post("/api/explain-scenario", async (req, res) => {
    try {
      const { scenario } = req.body;
      
      const prompt = `You are an expert in Turing Machines. Summarize the logical computation performed by this state machine in 2-4 sentences. Explain what the state machine is actually computing, how it navigates the tape, and what the final output implies.
      
      Scenario Data (JSON):
      ${JSON.stringify(scenario)}
      
      Respond with plain text only, no markdown formatting.`;

      const response = await generateWithRetry(prompt);
      res.json({ explanation: response.text || "Explanation could not be generated." });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message || "Failed to explain scenario" });
    }
  });

  // API to fix rules using Gemini
  app.post("/api/fix-rules", async (req, res) => {
    try {
      const { rules, issues } = req.body;
      
      const prompt = `You are an expert in Turing Machines. The user has a Turing Machine with the following transition rules:
      ${JSON.stringify(rules)}
      
      The validator found the following issues:
      ${JSON.stringify(issues)}
      
      Please provide a modified array of rules that fixes these issues (e.g. resolve deterministic conflicts, remove unreachable states or add rules to reach them). Keep the same JSON structure for rules: [{"id": "...", "currentState": "...", "readSymbol": "...", "nextState": "...", "writeSymbol": "...", "moveDirection": "..."}].
      Only return valid JSON array.`;

      const response = await generateWithRetry(prompt, 3, { responseMimeType: "application/json" });
      let responseText = response.text || "";
      if (responseText.startsWith("```json")) {
        responseText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      } else if (responseText.startsWith("```")) {
        responseText = responseText.replace(/```/g, "").trim();
      }
      responseText = responseText.replace(/\/\/.*$/gm, '').trim();

      const fixedRules = JSON.parse(responseText);
      res.json({ fixedRules });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message || "Failed to fix rules" });
    }
  });

  // API to generate a creative Turing Machine scenario description using Gemini
  app.post("/api/generate-scenario-idea", async (req, res) => {
    try {
      const prompt = `You are a creative computer science professor. Generate a unique, interesting, and educational Turing Machine scenario prompt / description that can be simulated.
      
      It should clearly describe:
      1. What mathematical or logic problem the machine is solving (e.g., binary palindrome, binary increment, parentheses matching, unary division/multiplication, ternary addition, string replacement, sequence finder, busy beaver).
      2. The format of the initial string on the tape (e.g. '0101', '11011', '(())', 'abc').
      3. What the final expected tape string or halting state should be.
      
      Requirements for the prompt output:
      - Do NOT mention physical/hardware elements, just computational logic or fun theme mappings (such as space routing, spy codebreaking, clean math, etc.).
      - Keep it short, conversational, and direct (1-3 sentences maximum).
      - Do NOT say "Here is a prompt:" or add introductory/concluding remarks. Return ONLY the plain text prompt itself so the user can immediately use it to generate a Turing Machine.
      - Ensure that each generation is different and highly creative! Try to vary the computation task randomly (e.g., palindrome check, basic arithmetic, balance check, symbol replication, count-to-five, string parsing, sorting binary arrays).`;

      const response = await generateWithRetry(prompt, 3);
      res.json({ idea: response.text?.trim() || "A machine that increments a binary number on the tape by 1." });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message || "Failed to generate scenario idea" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
