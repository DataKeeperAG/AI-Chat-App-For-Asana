import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Message as MessageType } from "@/types/chat";
import Message from "./Message";

function assistant(content: string): MessageType {
  return { id: "1", role: "assistant", content };
}

describe("Message", () => {
  it("renders assistant markdown as formatted html", () => {
    render(<Message message={assistant("**bold** and `code`")} />);

    expect(screen.getByText("bold").tagName).toBe("STRONG");
    expect(screen.getByText("code").tagName).toBe("CODE");
  });

  it("renders fenced code blocks", () => {
    const { container } = render(
      <Message message={assistant("```js\nconst x = 1;\n```")} />
    );

    expect(container.querySelector("pre code")).toHaveTextContent("const x = 1;");
  });

  it("renders gfm tables", () => {
    const { container } = render(
      <Message message={assistant("| a | b |\n| - | - |\n| 1 | 2 |")} />
    );

    expect(container.querySelector("table")).toBeInTheDocument();
  });

  it("leaves user text literal instead of parsing it as markdown", () => {
    const { container } = render(
      <Message message={{ id: "1", role: "user", content: "**not bold**" }} />
    );

    expect(screen.getByText("**not bold**")).toBeInTheDocument();
    expect(container.querySelector("strong")).toBeNull();
  });

  it("does not render raw html returned by the model", () => {
    const { container } = render(
      <Message message={assistant('<img src=x onerror="alert(1)">')} />
    );

    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText(/<img src=x/)).toBeInTheDocument();
  });
});
