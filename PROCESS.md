# Process & Design Notes

Notes on how this application was built and why it is put together the way it is. The code is short
enough to read in full, so this covers the decisions behind it rather than restating what it does.

## What was built

A chat interface for talking to an AI model. A user types a prompt, the reply is appended to the
conversation without a page reload, and the conversation survives a refresh. Loading and failure
states are explicit, and each failure the app can hit has its own message.

Stack: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, the OpenAI SDK, and Vitest
with React Testing Library.

## Architecture

The browser never talks to OpenAI directly.

```
Browser  →  POST /api/chat  →  OpenAI  →  /api/chat  →  Browser
```

`OPENAI_API_KEY` is read inside `src/lib/openai.ts`, which is only imported by the route handler, so
the key never reaches the client bundle. Calling OpenAI from the browser would expose it to anyone
who opens DevTools, however it was stored.

The folders split along those lines: `components/` renders, `hooks/` handles persistence so
components do not, `app/api/chat/` validates requests and makes the upstream call, `lib/` holds
client configuration, and `types/` holds the one shared `Message` shape.

## Key decisions

### Chat history reads from an external store instead of `useState`

The obvious approach is to seed `useState` from `localStorage`. I started there and hit two problems:

1. `localStorage` does not exist while Next prerenders the page, so the initialiser threw on the
   server.
2. After guarding that, the server rendered an empty conversation while the client rendered a
   populated one, which is a hydration mismatch for any returning user.

`localStorage` can change outside React, so `useChatHistory` subscribes to it with
`useSyncExternalStore`. The server snapshot is always empty, the client snapshot is whatever is
stored, and React swaps the stored conversation in after hydration rather than during it.

This also fixed a second problem. Writes go through the store rather than through component state,
so a functional update re-reads what is actually persisted and two updates in the same tick cannot
overwrite each other. There is a test for that case.

### Failures are separated rather than collapsed into one message

Server side, `/api/chat` distinguishes:

| Condition | Status | Behaviour |
| --- | --- | --- |
| Missing, empty, or malformed messages | `400` | Rejected before any upstream call |
| Upstream timeout | `504` | "The assistant took too long to respond." |
| Browser disconnected mid-flight | `499` | No body, since nothing is listening |
| Model returned nothing usable | `502` | Avoids rendering an empty bubble |
| Anything else | `500` | Logged on the server, generic message to the client |

On the client, `errorMessageFor` separates a timeout from an unreachable server from a message the
server supplied. "Check your connection" and "the assistant is slow" ask different things of the
user, so they should not share a message.

### Timeouts bound the wait, and retries are off

The OpenAI SDK defaults to a ten minute timeout with two automatic retries, which in a chat UI looks
the same as a hang. Requests are capped at 25 seconds instead.

Retries are off on purpose. With two retries the actual deadline becomes a multiple of the configured
timeout, so a 25 second limit can leave someone waiting over a minute. Resending is one keystroke,
and a stalled request is usually still stalled on a second attempt.

The client adds a 30 second `AbortSignal.timeout` as a backstop. It is longer than the server's limit
so the server's more specific message wins when the request arrives; the client limit only catches
connections that stall before reaching the route.

The route forwards `request.signal` to the SDK, so closing the tab cancels the upstream call instead
of paying for a completion nobody reads.

### Only assistant messages are parsed as Markdown

Model output renders through `react-markdown` with `remark-gfm`, covering code blocks, tables, and
lists. User messages render as plain text, because what someone typed is literal and parsing it would
only mangle their input.

Raw HTML is not rendered. `react-markdown` escapes it unless `rehype-raw` is added, and it is not
added. Model output is untrusted, and a test asserts that an `<img onerror=...>` payload appears as
visible text rather than as an element.

### Accessibility and semantics

Structure uses real elements: `main`, `header`, `section`, and an `article` per message. The message
list is an `aria-live="polite"` region so replies are announced as they arrive. The textarea has a
visually hidden `<label>`. Status and error text use `role="status"` and `role="alert"`. Enter
submits, Shift+Enter adds a newline, and the submit button is disabled while a request is in flight
or the input is empty.

## Testing

29 tests across 4 files, run with `npm test`.

| Target | Covers |
| --- | --- |
| `route.test.ts` | Six rejection cases, full-history forwarding, and the 504/499/502/500 branches |
| `useChatHistory.test.ts` | Load, persist, clear, corrupt JSON, non-array data, back-to-back updates |
| `Message.test.tsx` | Markdown, code blocks, GFM tables, literal user text, unrendered raw HTML |
| `Chat.test.tsx` | Error classification across timeout, unreachable, server message, fallback |

The tests target logic that can break quietly: request validation, persistence, and the rules that
keep untrusted output safe. I avoided asserting on Tailwind class names, since those change with
every restyle without indicating anything is broken.

To check the suite would actually catch a regression, I broke two things on purpose (rendering user
text as Markdown, and dropping the whitespace check from validation) and confirmed that exactly the
two relevant tests failed before reverting.

## Trade-offs and known limits

- **No streaming.** Responses appear all at once. Streaming would be my next change, but it
  complicates persistence and error handling, and I preferred a working non-streaming version to a
  rushed streaming one.
- **Light theme only.** The scaffold included a dark-mode block the components were never styled
  for, which left user bubbles nearly invisible on a dark background. I removed it rather than ship
  a half-themed UI.
- **History lives in `localStorage`.** Single device, single browser, no accounts. This matches the
  brief and avoids adding a backend it did not ask for.
- **No rate limiting.** The route would need it before facing real traffic.
- **The AI model name is a constant.** Fine for a single-purpose app; a real product would make it
  configurable.

## Running it

```bash
npm install
cp .env.example .env.local   # add an OPENAI_API_KEY
npm run dev
```

Then `npm test`, `npm run lint`, and `npm run build`.