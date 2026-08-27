"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { Message } from "@/types/chat";

const STORAGE_KEY = "asana-ai-chat-history";
const CHANGE_EVENT = "chat-history-change";

// localStorage is an external store, so it is subscribed to rather than
// copied into state. This keeps the server and client renders in agreement:
// the server snapshot is always empty, and React swaps in the stored
// conversation after hydration instead of mismatching during it.
function subscribe(onStoreChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener(CHANGE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

// The snapshot is the raw string stored in localStorage. It is parsed into messages in the hook.
function getSnapshot() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to load chat history:", error);
    return null;
  }
}

function getServerSnapshot(): string | null {
  return null;
}

function parseMessages(raw: string | null): Message[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to load chat history:", error);
    return [];
  }
}

function writeMessages(messages: Message[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch (error) {
    console.error("Failed to save chat history:", error);
  }

  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useChatHistory() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // False while rendering on the server and during hydration, true once
  // mounted.
  const isInitialized = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

  const messages = useMemo(() => parseMessages(raw), [raw]);

  function setMessages(
    update: Message[] | ((currentMessages: Message[]) => Message[])
  ) {
    // Functional updates re-read the store so concurrent sends cannot
    // overwrite each other with a stale copy of the conversation.
    const next =
      typeof update === "function" ? update(parseMessages(getSnapshot())) : update;

    writeMessages(next);
  }

  function clearMessages() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear chat history:", error);
    }

    window.dispatchEvent(new Event(CHANGE_EVENT));
  }

  return {
    messages,
    setMessages,
    clearMessages,
    isInitialized,
  };
}