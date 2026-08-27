import { NextRequest, NextResponse } from "next/server";

import { CHAT_MODEL, SYSTEM_PROMPT, getOpenAIClient } from "@/lib/openai";
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

    const completion = await getOpenAIClient().chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        // Send the whole conversation so the assistant keeps its context.
        ...turns.map(({ role, content }) => ({ role, content })),
      ],
    });

    const message = completion.choices[0]?.message?.content?.trim();

    if (!message) {
      return NextResponse.json(
        { error: "The assistant returned an empty response." },
        { status: 502 }
      );
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Chat API error:", error);

    return NextResponse.json(
      { error: "Failed to process request." },
      { status: 500 }
    );
  }
}
