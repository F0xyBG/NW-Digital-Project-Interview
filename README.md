# Test Project Job

This project is a **Flow-based chat system** designed as part of a job interview task. It features a chat application with a backend server, database integration, and a frontend interface for interacting with a chatbot. The chatbot uses a flow-based system to guide conversations and integrates OpenAI's GPT model for intent recognition.

---

## Features

### Backend

- **REST API**:
- `GET /api/getFlow`: Fetches the current JSON flow from the database.
- Example request:

```js
fetch('http://localhost:7070/api/getFlow').then((response) => {
  return response.json();
});
```

- Example response:

```json
{
  "startBlock": "greeting",
  "blocks": [
    {
      "id": "greeting",
      "type": "message",
      "message": "Hello!",
      "next": "wait"
    },
    {
      "id": "wait",
      "type": "wait",
      "next": "intent"
    },
    {
      "id": "intent",
      "type": "intent",
      "intents": [
        {
          "name": "example",
          "match_phrases": ["example phrase"],
          "next": "end_message"
        }
      ],
      "fallback": "fallback_message"
    },
    {
      "id": "end_message",
      "type": "message",
      "message": "This is the end.",
      "next": null
    },
    {
      "id": "fallback_message",
      "type": "message",
      "message": "Sorry, I didn’t understand that.",
      "next": "wait"
    }
  ]
}
```

- `POST /api/createFlow`: Creates or updates the JSON flow in the database and returns the newly created id.

- Example request:

```js
fetch('http://localhost:7070/api/createFlow', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ jsonFlow }),
});
```

- Example response:

```json
{
  "flowId": 1
}
```

---

- **WebSocket Communication**:
  - Real-time chat functionality using `Socket.IO`.
  - Handles user messages and processes them through a flow-based system.
- **OpenAI Integration**:
  - Uses OpenAI's GPT model for intent recognition when no predefined intent matches the user's input.
- **Database**:
  - SQLite database (`flow_chats.db`) for storing conversations, flows, and chat responses.
  - Tables:
    - `Conversation`: Tracks individual chat sessions.
    - `Flow`: Stores the JSON flow structure.
    - `Chat`: Logs user prompts, bot responses, and flow steps.

### Frontend

- **Chat Interface**:
  - Real-time messaging with bot responses.
  - Input field for user messages.
- **Flow Management**:
  - Textarea for entering or updating the JSON flow.
  - Button to submit the flow to the backend.
- **Styling**:
  - Styled using CSS for a clean and modern look.

---

## Project Structure

```
Test Project Job/
├── chat-app-frontend/         # Frontend application
│   ├── css/
│   │   └── styles.css       # Frontend styles
│   ├── js/
│   │   └── app.js             # Frontend logic
│   └── index.html             # Frontend HTML
├── Database/                  # Database related code
│   ├── Database.ts            # SQLite database setup
│   └── DBFunctions.ts         # Database helper functions
├── src/                       # Backend source code
│   ├── config/                # Configuration files
│   │   └── config.ts          # App configuration
│   ├── routes/                # API routes
│   │   └── flow.routes.ts     # Flow management routes
│   ├── services/              # Business logic services
│   │   ├── flow.service.ts    # Flow processing service
│   │   └── openai.service.ts  # OpenAI integration service
│   ├── types/                 # TypeScript type definitions
│   │   └── index.ts           # Type definitions for the app
│   └── websocket/             # WebSocket handlers
│       └── chat.handler.ts    # Chat socket handler
├── tests/                     # Test files
│   ├── Database/              # Database tests
│   │   └── DBFunctions.test.ts # Database functions tests
│   ├── src/                   # Backend tests
│   │   ├── config/            # Config tests
│   │   │   └── config.test.ts # Configuration tests
│   │   ├── routes/            # Routes tests
│   │   │   └── flow.routes.test.ts # Flow routes tests
│   │   ├── services/          # Service tests
│   │   │   ├── flow.service.test.ts # Flow service tests
│   │   │   └── openai.service.test.ts # OpenAI service tests
│   │   └── websocket/         # WebSocket tests
│   │       └── chat.handler.test.ts # Chat handler tests
│   └── server.test.ts         # Server tests
├── .env                       # Environment variables(ignored by Git)
├── .gitignore                 # Git ignore configuration
├── jest.config.ts             # Jest testing configuration
├── package.json               # Project dependencies and scripts
├── server.ts                  # Backend server entry point
├── tsconfig.json              # TypeScript configuration
└── flow_chats.db              # SQLite database file (ignored by Git, created automatically)
```

---

## Installation

### Prerequisites

- Node.js (v16+ recommended)
- TypeScript

### Steps

1. Clone the repository:

   ```bash
   git clone https://github.com/F0xyBG/NW-Digital-Project-Interview.git
   cd Test-Project-Job
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add your OpenAI API key:

   ```
   OPENAI_API_KEY=your_openai_api_key
   ```
- Optional settings in env (default values[shown below] loaded if not set)
   ```bash
   PORT=7070  
   CORS_ORIGINS=http://127.0.0.1:8080
   OPENAI_MODEL=gpt-4.1-nano
   ```

4. Compile TypeScript:

   ```bash
   npx tsc
   ```

5. Start the server:

   ```bash
   node server.js
   ```

6. Open the frontend:
   - Serve the `chat-app-frontend` folder using a static server like `http-server`:
     ```bash
     npx http-server chat-app-frontend
     ```
   - Open `http://127.0.0.1:8080` in your browser.

---

## Testing

The project includes a comprehensive test suite using Jest. The tests cover database functions, services, routes, and WebSocket handlers.

### Running Tests

To run all tests:

```bash
npm test
```

To run tests with coverage report:

```bash
npm run test:coverage
```

### Test Structure

- **Unit Tests**: Tests for individual components like services and database functions
- **Integration Tests**: Tests for routes and WebSocket handlers
- **Configuration Tests**: Tests for the application configuration

---

## Usage

1. **Start the Server**:

   - The backend server runs on `http://localhost:7070`.

2. **Manage JSON Flow**:

   - Use the textarea in the frontend to define or update the chatbot's flow.
   - Submit the flow using the "Create/update JSON Flow" button.

3. **Chat with the Bot**:
   - Type a message in the input field and click "Send" or press Enter.
   - The bot responds based on the flow or uses OpenAI for intent recognition.

---

## JSON Flow Structure

The chatbot uses a flow-based system defined in JSON. This is a minimal valid example:

```json
{
  "startBlock": "greeting",
  "blocks": [
    {
      "id": "greeting",
      "type": "message",
      "message": "Hello!",
      "next": "wait"
    },
    {
      "id": "wait",
      "type": "wait",
      "next": "intent"
    },
    {
      "id": "intent",
      "type": "intent",
      "intents": [
        {
          "name": "example",
          "match_phrases": ["example phrase"],
          "next": "end_message"
        }
      ],
      "fallback": "fallback_message"
    },
    {
      "id": "end_message",
      "type": "message",
      "message": "This is the end.",
      "next": null
    },
    {
      "id": "fallback_message",
      "type": "message",
      "message": "Sorry, I didn’t understand that.",
      "next": "wait"
    }
  ]
}
```

---

## Dependencies

### Backend

- `better-sqlite3`: SQLite database integration.
- `dotenv`: Environment variable management.
- `restify`: REST API framework.
- `socket.io`: WebSocket communication.
- `openai`: OpenAI API client.

### Frontend

- `http-server`: Server to host the frontend

---

## Development

### Scripts

- **Start Server**:
  ```bash
  npm run dev
  ```
- **Run TypeScript Compiler to build**:
  ```bash
  npm build
  ```
- **Run build of server**:
  ```bash
  npm start
  ```
- **Run Tests**:
  ```bash
  npm test
  ```
- **Run Tests with Coverage**:
  ```bash
  npm run test:coverage
  ```

---

## Dependencies

### Backend

- `better-sqlite3`: SQLite database integration
- `dotenv`: Environment variable management
- `restify`: REST API framework
- `socket.io`: WebSocket communication
- `openai`: OpenAI API client
- `restify-cors-middleware2`: CORS middleware for Restify

### Frontend

- `http-server`: Server to host the frontend

### Development

- `jest`: Testing framework
- `ts-jest`: TypeScript support for Jest
- `typescript`: TypeScript compiler
- `eslint`: Linting tool
- `prettier`: Code formatter

---


## Author

**Simeon Teremkov**
