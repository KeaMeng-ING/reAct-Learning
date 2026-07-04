export async function getCurrentWeather({ location }) {
  const weather = {
    location,
    temperature: "75",
    forecast: "sunny",
  };
  return JSON.stringify(weather);
}

export async function getLocation() {
  try {
    const response = await fetch("https://ipwho.is/");
    if (!response.ok) {
      return JSON.stringify({
        error: `Location lookup failed with status ${response.status}`,
      });
    }
    const data = await response.json();
    if (data.success === false) {
      return JSON.stringify({ error: data.message ?? "Location lookup failed" });
    }
    return JSON.stringify(data);
  } catch (err) {
    return JSON.stringify({ error: err.message ?? "Location lookup failed" });
  }
}

export const tools = [
  {
    functionDeclarations: [
      {
        name: "getCurrentWeather",
        description: "Get the current weather at a given location.",
        parameters: {
          type: "object",
          properties: {
            location: {
              type: "string",
              description: "The city and state, e.g. San Francisco, CA",
            },
          },
          required: ["location"],
        },
      },
      {
        name: "getLocation",
        description:
          "Get the user's current location based on their IP address.",
      },
    ],
  },
];
