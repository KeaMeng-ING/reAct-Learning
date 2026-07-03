import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { getCurrentWeather, getLocation } from "./tools.js";

export const ai = new GoogleGenAI({
  apiKey: process.env.VITE_GEMINI_API_KEY,
});

/**
 * Goal - build an agent that can answer any questions that might require knowledge about my current location and the current weather at my location.
 */

const availableFunctions = {
  getCurrentWeather,
  getLocation,
};

const systemPrompt = `
You cycle through Thought, Action, PAUSE, Observation. At the end of the loop you output a final Answer. Your final answer should be highly specific to the observations you have from running
the actions.
1. Thought: Describe your thoughts about the question you have been asked.
2. Action: run one of the actions available to you - then return PAUSE.
3. PAUSE
4. Observation: will be the result of running those actions.

Available actions:
- getCurrentWeather: 
    E.g. getCurrentWeather: Salt Lake City
    Returns the current weather of the location specified.
- getLocation:
    E.g. getLocation: null
    Returns user's location details. No arguments needed.

Here is the format you should follow for your output:
Thought: <Your thoughts about the question>
Action: <The action you want to run, or "none" if you don't need to run any actions>
PAUSE

Example session:
Question: Please give me some ideas for activities to do this afternoon.
Thought: I should look up the user's location so I can give location-specific activity ideas.
Action: getLocation: null
PAUSE

You will be called again with something like this:
Observation: "New York City, NY"

Then you loop again:
Thought: To get even more specific activity ideas, I should get the current weather at the user's location.
Action: getCurrentWeather: New York City
PAUSE

You'll then be called again with something like this:
Observation: { location: "New York City, NY", forecast: ["sunny"] }

You then output:
Answer: <Suggested activities based on sunny weather that are highly specific to New York City and surrounding areas.>
`;

async function agent(query) {
  const messages = [
    {
      role: "user",
      parts: [{ text: query }],
    },
  ];

  const MAX_ITERATIONS = 5;
  const actionRegex = /^Action: (\w+): (.*)$/;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    console.log(`Iteration ${i + 1}`);
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // Update the model
      config: {
        systemInstruction: systemPrompt,
        thinkingConfig: {
          thinkingBudget: 0,
        },
      },
      contents: messages,
    });

    const responseText = response.text;
    messages.push({
      role: "MODEL",
      parts: [{ text: responseText }],
    });
    const responseLines = responseText.split("\n");
    const foundActionStr = responseLines.find((line) => actionRegex.test(line));

    if (foundActionStr) {
      const actions = actionRegex["exec"](foundActionStr);
      const [_, action, actionArgs] = actions;

      if (!availableFunctions.hasOwnProperty(action)) {
        throw new Error(`Action ${action} is not available.`);
      }
      const observation = await availableFunctions[action](actionArgs);
      messages.push({
        role: "MODEL",
        parts: [{ text: `Observation: ${observation}` }],
      });
    } else {
      return responseText;
    }
  }
}

console.log(
  await agent(
    "What are some activity ideas that I can do this afternoon based on my location and weather?",
  ),
);
