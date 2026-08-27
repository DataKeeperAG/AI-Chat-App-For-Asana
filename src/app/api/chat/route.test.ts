// @vitest-environment node

import { NextRequest } from "next/server";
import { APIConnectionTimeoutError, APIUserAbortError } from "openai";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getOpenAIClient } from "@/lib/openai";
import { POST } from "./route";

vi.mock("@/lib/openai", () => ({
  CHAT_MODEL: "test-model",
  SYSTEM_PROMPT: "test system prompt",
  REQUEST_TIMEOUT_MS: 25_000,
  getOpenAIClient: vi.fn(),
}));

const mockedGetClient = vi.mocked(getOpenAIClient);

function postRequest(body: unknown) {
  return new NextRequest("http://localhost/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function mockCompletion(create: () => unknown) {
  mockedGetClient.mockReturnValue({
    chat: { completions: { create } },
  } as unknown as ReturnType<typeof getOpenAIClient>);
}

beforeEach(() => {
  // The route logs failures on purpose, so keep the reporter readable.
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("POST /api/chat", () => {
  it.each([
    ["a missing messages field", {}],
    ["an empty conversation", { messages: [] }],
    ["a whitespace-only prompt", { messages: [{ role: "user", content: "   " }] }],
    ["an unknown role", { messages: [{ role: "system", content: "hi" }] }],
    ["a non-string content", { messages: [{ role: "user", content: 42 }] }],
    ["messages that are not an array", { messages: "hi" }],
  ])("rejects %s with 400", async (_label, body) => {
    const response = await POST(postRequest(body));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "A non-empty list of messages is required.",
    });
  });

  it("returns the assistant reply and forwards the whole conversation", async () => {
    const create = vi.fn().mockResolvedValue({
      choices: [{ message: { content: "  hello there  " } }],
    });
    mockCompletion(create);

    const response = await POST(
      postRequest({
        messages: [
          { role: "user", content: "first" },
          { role: "assistant", content: "second" },
          { role: "user", content: "third" },
        ],
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ message: "hello there" });

    const [payload] = create.mock.calls[0];
    expect(payload.messages).toEqual([
      { role: "system", content: "test system prompt" },
      { role: "user", content: "first" },
      { role: "assistant", content: "second" },
      { role: "user", content: "third" },
    ]);
  });

  it("returns 504 when the upstream call times out", async () => {
    mockCompletion(
      vi.fn().mockRejectedValue(
        new APIConnectionTimeoutError({ message: "timed out" })
      )
    );

    const response = await POST(
      postRequest({ messages: [{ role: "user", content: "hi" }] })
    );

    expect(response.status).toBe(504);
    await expect(response.json()).resolves.toEqual({
      error: "The assistant took too long to respond. Please try again.",
    });
  });

  it("returns 499 without a body when the browser disconnects", async () => {
    mockCompletion(vi.fn().mockRejectedValue(new APIUserAbortError()));

    const response = await POST(
      postRequest({ messages: [{ role: "user", content: "hi" }] })
    );

    expect(response.status).toBe(499);
    await expect(response.text()).resolves.toBe("");
  });

  it("returns 502 when the model replies with nothing usable", async () => {
    mockCompletion(
      vi.fn().mockResolvedValue({ choices: [{ message: { content: "   " } }] })
    );

    const response = await POST(
      postRequest({ messages: [{ role: "user", content: "hi" }] })
    );

    expect(response.status).toBe(502);
  });

  it("returns 500 when the key is missing", async () => {
    mockedGetClient.mockImplementation(() => {
      throw new Error("OPENAI_API_KEY is not set.");
    });

    const response = await POST(
      postRequest({ messages: [{ role: "user", content: "hi" }] })
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to process request.",
    });
  });
});
