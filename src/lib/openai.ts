// OpenAI client configuration.
//
// Keeping external API configuration separate from the route
// makes the integration easier to maintain and test.

import OpenAI from "openai";

export const CHAT_MODEL = "gpt-5.5";

export const SYSTEM_PROMPT =
  "You are a helpful assistant. Answer clearly and concisely.";

// The SDK defaults to a 10 minute timeout and 2 retries. Retries are off so
// the deadline stays predictable.
export const REQUEST_TIMEOUT_MS = 25_000;

let client: OpenAI | null = null;

// Lazy so a missing key fails the request instead of the build.
export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set.");
  }

  client ??= new OpenAI({
    apiKey,
    timeout: REQUEST_TIMEOUT_MS,
    maxRetries: 0,
  });

  return client;
}
