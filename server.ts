import * as restify from 'restify';
import { Server as SocketIOServer, Socket } from 'socket.io'; 
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const server = restify.createServer();
const io = new SocketIOServer(server.server, {
  cors: {
    origin: "http://127.0.0.1:8080", 
    methods: ["GET", "POST"], 
  },
});

server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser());

// Defining custom event types
interface ServerToClientEvents {
  chatResponse: (message: string) => void;
  error: (error: { error: string }) => void;
}

interface ClientToServerEvents {
  chatMessage: (data: { messages: { role: string; content: string }[] }) => void;
}

// Use the custom types for the socket
io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
  console.log('A user connected:', socket.id);

  socket.on('chatMessage', async (data) => {
    console.log('Received message:', data);

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: data.messages as OpenAI.Chat.ChatCompletionMessage[]
      });

      console.log('AI Response:', response);
      const content = response.choices[0].message.content ?? 'No response';
      console.log('Content:', response.choices[0].message);
      socket.emit('chatResponse', content); 
    } catch (error) {
      console.error('Error:', error);
      socket.emit('error', { error: 'Internal Server Error' });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = 7070;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});