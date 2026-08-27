import { describe, expect, it } from "vitest";

import { errorMessageFor } from "./Chat";

describe("errorMessageFor", () => {
  it("reports a timeout when the request is aborted by the deadline", () => {
    const timeout = new DOMException("The operation timed out.", "TimeoutError");

    expect(errorMessageFor(timeout)).toBe(
      "The request timed out. Please try again."
    );
  });

  it("reports a connection problem when the request never left the browser", () => {
    expect(errorMessageFor(new TypeError("Failed to fetch"))).toBe(
      "Could not reach the server. Check your connection and try again."
    );
  });

  it("passes a server supplied message through unchanged", () => {
    const fromServer = new Error("A non-empty list of messages is required.");

    expect(errorMessageFor(fromServer)).toBe(
      "A non-empty list of messages is required."
    );
  });

  it.each([["a string", "nope"], ["null", null], ["an empty error", new Error("")]])(
    "falls back to a generic message for %s",
    (_label, value) => {
      expect(errorMessageFor(value)).toBe(
        "Something went wrong. Please try again."
      );
    }
  );
});
