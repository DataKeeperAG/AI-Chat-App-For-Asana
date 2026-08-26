"use client";

import { FormEvent, KeyboardEvent, useState } from "react";

type ChatInputProps = {
  onSubmit: (message: string) => void;
  isLoading?: boolean;
};

export default function ChatInput({
  onSubmit,
  isLoading = false,
}: Readonly<ChatInputProps>) {
  const [input, setInput] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedInput = input.trim();

    if (!trimmedInput || isLoading) {
      return;
    }

    onSubmit(trimmedInput);
    setInput("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      const form = event.currentTarget.form;
      form?.requestSubmit();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-3 border-t border-gray-200 pt-4"
    >
      <label htmlFor="chat-input" className="sr-only">
        Message
      </label>

      <textarea
        id="chat-input"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask me anything..."
        rows={1}
        disabled={isLoading}
        className="min-h-12 flex-1 resize-none rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black focus:font-bold disabled:opacity-50"
      />

      <button
        type="submit"
        disabled={!input.trim() || isLoading}
        className="min-h-12 rounded-xl bg-black px-5 py-3 text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isLoading ? "Sending..." : "Send"}
      </button>
    </form>
  );
}