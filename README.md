# reAct

A minimal ReAct-style (Reason + Act) agent built with the Google Gemini API, using
Gemini's native function calling. The agent calls local tool functions as needed until
it can produce a final answer, and can be driven either from the CLI or a small
browser chat UI.

Based on the [Scrimba AI Engineer Path](https://scrimba.com/the-ai-engineer-path-c02v/~02g).

## How it works

`index.js` starts a Gemini chat session with the available tool declarations
(`getCurrentWeather`, `getLocation`) attached. The loop:

1. Sends the conversation so far to the model.
2. If the response includes function calls, runs the matching functions from
   `tools.js` and sends their results back as function responses.
3. Repeats until the model returns a final text answer or the iteration limit is
   reached.

Progress (tool calls, tool results, the final answer, or errors) is reported through an
`onEvent` callback, which the browser UI (`index.html`) uses to render a live chat log.

## Available tools

- `getCurrentWeather({ location })` — returns weather for a given location (currently
  stubbed with hardcoded data in `tools.js`).
- `getLocation()` — looks up the user's current location via IP geolocation
  ([ipwho.is](https://ipwho.is/)).

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

Or start the Vite dev server and use the chat UI in your browser:

```bash
npm run dev
```
