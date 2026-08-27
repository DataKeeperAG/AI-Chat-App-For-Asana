import { NextRequest, NextResponse } from "next/server";
import { APIConnectionTimeoutError, APIUserAbortError } from "openai";

import {
  CHAT_MODEL,
  REQUEST_TIMEOUT_MS,
  SYSTEM_PROMPT,
  getOpenAIClient,
} from "@/lib/openai";
import type { Message } from "@/types/chat";

type ChatTurn = Pick<Message, "role" | "content">;

function isChatTurn(value: unknown): value is ChatTurn {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const { role, content } = value as Partial<ChatTurn>;

  return (
    (role === "user" || role === "assistant") &&
    typeof content === "string" &&
    content.trim().length > 0
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const turns: unknown = body.messages;

    if (!Array.isArray(turns) || turns.length === 0 || !turns.every(isChatTurn)) {
      return NextResponse.json(
        { error: "A non-empty list of messages is required." },
        { status: 400 }
      );
    }

    const completion = await getOpenAIClient().chat.completions.create(
      {
        model: CHAT_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          // Send the full conversation for context.
          ...turns.map(({ role, content }) => ({ role, content })),
        ],
      },
      // Cancel the upstream call if the browser disconnects.
      { signal: request.signal }
    );

    const message = completion.choices[0]?.message?.content?.trim();

    if (!message) {
      return NextResponse.json(
        { error: "The assistant returned an empty response." },
        { status: 502 }
      );
    }

    return NextResponse.json({ message });
  } catch (error) {
    // Browser disconnected, so there is no body to return.
    if (error instanceof APIUserAbortError) {
      return new NextResponse(null, { status: 499 });
    }

    if (error instanceof APIConnectionTimeoutError) {
      console.error(`Chat API timed out after ${REQUEST_TIMEOUT_MS}ms`);

      return NextResponse.json(
        { error: "The assistant took too long to respond. Please try again." },
        { status: 504 }
      );
    }

    console.error("Chat API error:", error);

    return NextResponse.json(
      { error: "Failed to process request." },
      { status: 500 }
    );
  }
}
