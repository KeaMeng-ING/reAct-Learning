import { GoogleGenAI } from "@google/genai";
import { getCurrentWeather, getLocation, tools } from "./tools.js";

// Node (CLI) reads process.env via dotenv; the browser (Vite) exposes
// VITE_-prefixed vars on import.meta.env instead. Support both.
const isBrowser = typeof document !== "undefined";
if (!isBrowser) {
  await import("dotenv/config");
}
const apiKey = isBrowser
  ? import.meta.env.VITE_GEMINI_API_KEY
  : process.env.VITE_GEMINI_API_KEY;

export const ai = new GoogleGenAI({ apiKey });

const availableFunctions = {
  getCurrentWeather,
  getLocation,
};

export async function agent(query, onEvent = () => {}) {
  // Chat keeps the message history for us (the Gemini equivalent of the runner)
  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction:
        "You are a helpful AI agent. Give highly specific answers based on the information you're provided. Prefer to gather information with the tools provided to you rather than giving basic, generic answers.",
      thinkingConfig: {
        thinkingBudget: 0,
      },
      tools,
    },
  });

  const MAX_ITERATIONS = 5;
  let response;

  try {
    response = await chat.sendMessage({ message: query });
  } catch (err) {
    const message = `Sorry, I couldn't reach the model: ${err.message ?? err}`;
    onEvent({ type: "error", message });
    return message;
  }

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    console.log(`Iteration ${i + 1}`);
    console.log("Model response:", response.candidates[0].content);

    const functionCalls = response.functionCalls ?? [];

    // No function calls -> the model is done, return its final text answer
    if (functionCalls.length === 0) {
      console.log("Final answer:", response.text);
      onEvent({ type: "answer", message: response.text });
      return response.text;
    }

    // Execute each function call and send the results back
    const functionResponseParts = [];
    for (const functionCall of functionCalls) {
      console.log(
        `Calling ${functionCall.name}(${JSON.stringify(functionCall.args)})`,
      );
      onEvent({
        type: "tool-call",
        name: functionCall.name,
        args: functionCall.args,
      });

      const fn = availableFunctions[functionCall.name];
      let result;
      if (!fn) {
        result = JSON.stringify({
          error: `Unknown tool: ${functionCall.name}`,
        });
      } else {
        try {
          result = await fn(functionCall.args);
        } catch (err) {
          result = JSON.stringify({ error: err.message ?? String(err) });
        }
      }

      onEvent({ type: "tool-result", name: functionCall.name, result });

      functionResponseParts.push({
        functionResponse: {
          name: functionCall.name,
          id: functionCall.id,
          response: { result },
        },
      });
    }

    try {
      response = await chat.sendMessage({ message: functionResponseParts });
    } catch (err) {
      const message = `Sorry, I couldn't reach the model: ${err.message ?? err}`;
      onEvent({ type: "error", message });
      return message;
    }
  }

  const message = "Reached max iterations without a final answer.";
  console.log(message);
  onEvent({ type: "error", message });
  return message;
}

// Browser UI (index.html) wires itself up; the Node CLI path only runs
// the demo query when executed directly with `node index.js`.
if (!isBrowser) {
  const finalContent = await agent(
    "What's the current weather in my current location?",
  );
  console.log(finalContent);
}
