# AI Chat App for Asana

A clean, responsive AI chatbot built as a front-end technical assessment. The application integrates with the OpenAI API and focuses on thoughtful UI, robust state management, accessibility, and a polished user experience.

## Features

* Clean, responsive chat interface
* OpenAI API integration
* Dynamic AI responses without page reloads
* Loading and error states
* Persistent chat history using LocalStorage
* Session management with a Clear Chat action
* Markdown rendering for AI responses
* Keyboard-friendly message input
* Responsive design for desktop and mobile
* Unit tests for core functionality

## Tech Stack

* Next.js
* React
* TypeScript
* Tailwind CSS
* OpenAI API
* LocalStorage
* React Markdown
* Vitest / React Testing Library

## Getting Started

### 1. Clone the repository

```bash
git clone <https://github.com/DataKeeperAG/AI-Chat-App-For-Asana.git>
cd ai-chat-app-for-asana
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the root of the project:

```env
OPENAI_API_KEY=an_openai_api_key
```

The OpenAI API key is only used server-side and should never be committed to source control.

### 4. Start the development server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Available Scripts

Run the development server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

Run linting:

```bash
npm run lint
```

Run tests:

```bash
npm test
```

## Project Structure

```text
src/
├── app/
│   ├── api/
│   │   └── chat/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
├── hooks/
├── lib/
└── types/
```

The application is organized around reusable UI components, isolated API logic, and small utilities/hooks for state persistence and chat behavior.

## Architecture

The browser does not communicate directly with OpenAI. Messages are sent to a server-side Next.js API route, which securely communicates with the OpenAI API.

```text
Browser
   ↓
Next.js API Route
   ↓
OpenAI API
   ↓
Next.js API Route
   ↓
Browser
```

This keeps the OpenAI API key out of the client bundle.

## Design Considerations

The project prioritizes:

* Clear separation of concerns between UI, state, and API logic
* Semantic and accessible HTML
* Responsive layouts
* Graceful loading and failure states
* Protection against empty prompts
* Persistent session history
* Maintainable, component-based architecture

## Technical Assessment

This project was created in response to a front-end engineering technical assessment focused on building a functional AI-powered interface while demonstrating modern frontend development practices.

The implementation emphasizes both the required functionality and additional details such as persistent chat history, Markdown rendering, session management, testing, accessibility, and resilient error handling.

