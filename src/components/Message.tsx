import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import type { Message as MessageType } from "@/types/chat";

type MessageProps = {
  message: MessageType;
};

export default function Message({ message }: Readonly<MessageProps>) {
  const isUser = message.role === "user";

  return (
    <article
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
      aria-label={`${isUser ? "You" : "Assistant"} message`}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-black text-white"
            : "bg-gray-100 text-gray-900"
        }`}
      >
        {isUser ? (
          // User text is literal, so it is not parsed as Markdown.
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-sm prose-neutral max-w-none prose-pre:bg-gray-900 prose-pre:text-gray-100">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </article>
  );
}