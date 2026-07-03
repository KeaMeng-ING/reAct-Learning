# reAct

A minimal ReAct-style (Reason + Act) agent built with the Google Gemini API. The agent
cycles through `Thought` → `Action` → `PAUSE` → `Observation` steps, calling local tool
functions until it can produce a final `Answer`.

Based on the [Scrimba AI Engineer Path](https://scrimba.com/the-ai-engineer-path-c02v/~02g).

## How it works

`index.js` sends a system prompt to the Gemini model instructing it to reason step by
step and invoke one of the available actions when it needs more information. The loop:

1. Sends the conversation so far to the model.
2. Looks for an `Action: <name>: <args>` line in the response.
3. If found, runs the matching function from `tools.js` and feeds the result back as an
   `Observation`.
4. Repeats until the model returns a final `Answer` or the iteration limit is reached.

## Available tools

- `getCurrentWeather` — returns the current weather for a location.
- `getLocation` — returns the user's current location.

(Both are currently stubbed with hardcoded data in `tools.js`.)

## Setup

Install dependencies:

```bash
npm install
```

Create a `.env` file in the project root with your Gemini API key:

```
VITE_GEMINI_API_KEY=your_api_key_here
```

## Usage

Run the agent script directly with Node:

```bash
node index.js
```

Or start the Vite dev server (serves `index.html`, which loads `index.js` as a module):

```bash
npm run dev
```
