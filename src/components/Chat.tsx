"use client";

import { useState } from "react";

import ChatInput from "./ChatInput";
import ClearChatButton from "./ClearChatButton";
import EmptyState from "./EmptyState";
import MessageList from "./MessageList";

import { useChatHistory } from "@/hooks/useChatHistory";
import type { Message } from "@/types/chat";

// Backstop for stalls that never reach the route, which has a shorter deadline.
const REQUEST_TIMEOUT_MS = 30_000;

function errorMessageFor(error: unknown) {
  // AbortSignal.timeout rejects with a TimeoutError DOMException.
  if (error instanceof DOMException && error.name === "TimeoutError") {
    return "The request timed out. Please try again.";
  }

  // fetch rejects with a TypeError when the request never reached the server.
  if (error instanceof TypeError) {
    return "Could not reach the server. Check your connection and try again.";
  }

  return error instanceof Error && error.message
    ? error.message
    : "Something went wrong. Please try again.";
}

export default function Chat() {
  const { messages, setMessages, clearMessages, isInitialized } =
    useChatHistory();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(content: string) {
    setError(null);

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
    };

    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);

    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map(({ role, content }) => ({
            role,
            content,
          })),
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      // Error responses may not carry a JSON body.
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error ?? "Something went wrong. Please try again.");
      }

      if (!data?.message) {
        throw new Error("The assistant returned an empty response.");
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.message,
      };

      setMessages((currentMessages) => [...currentMessages, assistantMessage]);
    } catch (error) {
      console.error(error);

      setError(errorMessageFor(error));
    } finally {
      setIsLoading(false);
    }
  }

  if (!isInitialized) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div
          className="relative inline-block h-8 w-8"
          role="status"
          aria-label="Loading"
        >
          <span className="absolute inset-1 animate-[spin_1.1s_linear_infinite] border-2 border-current" />

          <span className="absolute inset-2 animate-[spin_0.7s_linear_infinite_reverse] rotate-45 border border-current" />

          <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 animate-[ping_1s_cubic-bezier(0,0,0.2,1)_infinite] bg-current" />

          <span className="absolute bottom-0 left-0 h-1.5 w-1.5 animate-bounce bg-current" />

          <span className="absolute right-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 animate-pulse bg-current" />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-6 sm:px-6">
      <header className="flex items-center justify-between border-b border-gray-200 pb-4 bg-black/5 px-4 py-3 text-white shadow-md shadow-cyan-500/50 sm:px-6">
        <div className="flex flex-col gap-1 bg-[rgba(200,250,252,0.9)] rounded-xl px-4 py-2 text-center text-black shadow-md shadow-cyan-500/50s">
          <h1 className="text-xl font-semibold">AI Chat For Asana</h1>
          <p className="text-sm text-gray-500">Powered by OpenAI</p>
        </div>

        {messages.length > 0 && (
          <ClearChatButton onClear={clearMessages} disabled={isLoading} />
        )}
      </header>

      {messages.length === 0 ? (
        <EmptyState />
      ) : (
        <MessageList messages={messages} />
      )}

      {isLoading && (
        <p className="mb-3 text-sm text-gray-500" role="status">
          Assistant is thinking...
        </p>
      )}

      {error && (
        <p className="mb-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <ChatInput onSubmit={handleSubmit} isLoading={isLoading} />
    </main>
  );
}
