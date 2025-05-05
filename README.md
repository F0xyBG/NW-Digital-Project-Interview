# Test Project Job

This project is a **Flow-based chat system** designed as part of a job interview task. It features a chat application with a backend server, database integration, and a frontend interface for interacting with a chatbot. The chatbot uses a flow-based system to guide conversations and integrates OpenAI's GPT model for intent recognition.

---

## Features

### Backend
- **REST API**:
 - `GET /api/getFlow`: Fetches the current JSON flow from the database.
  - Example request:
 ```js
fetch('http://localhost:7070/api/getFlow')
  .then(response => {
    return response.json();
  })
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
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ jsonFlow })
})
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
├── chat-app-frontend/
│   ├── css/
│   │   └── styles.css       # Frontend styles
│   ├── js/
│   │   └── app.js           # Frontend logic
│   └── index.html           # Frontend HTML
├── Database/
│   ├── Database.ts          # SQLite database setup
│   └── DBFunctions.ts       # Database helper functions
├── .gitignore               # Ignored files and folders
├── package.json             # Project dependencies and scripts
├── server.ts                # Backend server logic
├── tsconfig.json            # TypeScript configuration
└── flow_chats.db            # SQLite database file (ignored by Git, created automatically by the server)
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
  npm start
  ```
- **Run TypeScript Compiler**:
  ```bash
  npx tsc
  ```


---

## Future Improvements
- Add unit tests for backend logic.
- Using Docker for setup

---

## Author
**Simeon Teremkov**