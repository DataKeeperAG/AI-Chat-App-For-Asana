"use client";

import { useEffect, useState } from "react";
import type { Message } from "@/types/chat";

const STORAGE_KEY = "asana-ai-chat-history";

export function useChatHistory() {
     const [isInitialized, setIsInitialized] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const savedMessages = localStorage.getItem(STORAGE_KEY);
      return savedMessages ? JSON.parse(savedMessages) : [];
    } catch (error) {
      console.error("Failed to load chat history:", error);
      return [];
    }finally{
        setIsInitialized(true);
    }
  });
 

  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (error) {
      console.error("Failed to save chat history:", error);
    }
  }, [messages, isInitialized]);

  function clearMessages() {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  }

  return {
    messages,
    setMessages,
    clearMessages,
    isInitialized,
  };
}