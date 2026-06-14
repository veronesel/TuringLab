import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateWithRetry(prompt: string, maxRetries = 3) {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      const model = "gemini-2.5-flash";
      return await ai.models.generateContent({
        model,
        contents: prompt,
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
      const { description } = req.body;
      
      const prompt = `You are an expert in Turing Machines. The user wants to create a new scenario with the following objective:
      "${description}"
      
      Generate a Turing Machine configuration in JSON format. It must adhere to the following structure:
      {
        "id": "scenario-slug",
        "name": "Scenario Name",
        "description": "Human-readable description of what the scenario does and how it works.",
        "initialTape": "010101", // A string of characters representing the initial tape
        "initialHeadPosition": 0, // Integer
        "initialState": "q0",
        "acceptStates": ["q_accept"], // Can be multiple
        "rules": [
          {
            "id": "generate-uuid-or-slug",
            "currentState": "q0",
            "readSymbol": "0",
            "nextState": "q1",
            "writeSymbol": "1",
            "moveDirection": "R" // R, L, or S
          }
        ]
      }
      
      Respond with ONLY valid, parseable JSON, no markdown formatting, and NO COMMENTS in the JSON. The symbols on the tape should be single characters.
      If a rule reads empty/blank, use "_" (underscore). Write "_" for blank.
      Make sure the logic corresponds correctly to the user's objective (e.g. unary addition, binary palindrome, busy beaver, etc).`;

      const response = await generateWithRetry(prompt);
      let responseText = response.text || "";
      // Clean up markdown wrapper
      if (responseText.startsWith("```json")) {
        responseText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      }
      // Remove any trailing or inline comments from the parsed JSON text
      responseText = responseText.replace(/\/\/.*$/gm, '').trim();

      const configuration = JSON.parse(responseText);
      res.json({ configuration });
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
      Only return valid JSON array without any markdown formatting.`;

      const response = await generateWithRetry(prompt);
      let responseText = response.text || "";
      if (responseText.startsWith("\`\`\`json")) {
        responseText = responseText.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();
      } else if (responseText.startsWith("\`\`\`")) {
        responseText = responseText.replace(/\`\`\`/g, "").trim();
      }
      responseText = responseText.replace(/\/\/.*$/gm, '').trim();

      const fixedRules = JSON.parse(responseText);
      res.json({ fixedRules });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message || "Failed to fix rules" });
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
