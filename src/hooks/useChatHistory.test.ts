import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Message } from "@/types/chat";
import { useChatHistory } from "./useChatHistory";

const STORAGE_KEY = "asana-ai-chat-history";

function message(id: string, content: string): Message {
  return { id, role: "user", content };
}

beforeEach(() => {
  localStorage.clear();
});

describe("useChatHistory", () => {
  it("starts empty when nothing has been stored", () => {
    const { result } = renderHook(() => useChatHistory());

    expect(result.current.messages).toEqual([]);
    expect(result.current.isInitialized).toBe(true);
  });

  it("loads a stored conversation", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([message("1", "hi")]));

    const { result } = renderHook(() => useChatHistory());

    expect(result.current.messages).toEqual([message("1", "hi")]);
  });

  it("persists messages that are appended", () => {
    const { result } = renderHook(() => useChatHistory());

    act(() => {
      result.current.setMessages([message("1", "hi")]);
    });

    expect(result.current.messages).toEqual([message("1", "hi")]);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null")).toEqual([
      message("1", "hi"),
    ]);
  });

  it("re-reads the store so back to back updates do not overwrite each other", () => {
    const { result } = renderHook(() => useChatHistory());

    act(() => {
      result.current.setMessages([message("1", "first")]);
      result.current.setMessages((current) => [...current, message("2", "second")]);
    });

    expect(result.current.messages.map(({ id }) => id)).toEqual(["1", "2"]);
  });

  it("recovers from corrupt stored data", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    localStorage.setItem(STORAGE_KEY, "{not json");

    const { result } = renderHook(() => useChatHistory());

    expect(result.current.messages).toEqual([]);
    vi.restoreAllMocks();
  });

  it("ignores a stored value that is not a list", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ nope: true }));

    const { result } = renderHook(() => useChatHistory());

    expect(result.current.messages).toEqual([]);
  });

  it("clears the conversation and removes the stored key", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([message("1", "hi")]));

    const { result } = renderHook(() => useChatHistory());

    act(() => {
      result.current.clearMessages();
    });

    expect(result.current.messages).toEqual([]);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
