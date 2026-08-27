// OpenAI client configuration.
//
// Keeping external API configuration separate from the route
// makes the integration easier to maintain and test.

import OpenAI from "openai";

export const CHAT_MODEL = "gpt-5.5";

export const SYSTEM_PROMPT =
  "You are a helpful assistant. Answer clearly and concisely.";

let client: OpenAI | null = null;

// Constructed lazily so that a missing key surfaces as a handled request
// error instead of crashing the build when the module is first imported.
export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set.");
  }

  client ??= new OpenAI({ apiKey });

  return client;
}
