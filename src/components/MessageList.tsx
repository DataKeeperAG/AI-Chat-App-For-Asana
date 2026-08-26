import type { Message as MessageType } from "@/types/chat";
import Message from "./Message";

type MessageListProps = {
  messages: MessageType[];
};

export default function MessageList({ messages }: Readonly<MessageListProps>) {
  return (
    <section
      className="flex flex-1 flex-col gap-4 overflow-y-auto py-6"
      aria-live="polite"
      aria-label="Chat messages"
    >
      {messages.map((message) => (
        <Message key={message.id} message={message} />
      ))}
    </section>
  );
}