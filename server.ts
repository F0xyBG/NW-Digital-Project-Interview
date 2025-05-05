import * as restify from 'restify';
import { Server as SocketIOServer, Socket } from 'socket.io';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import db from './Database/db-functions';
import corsMiddleware from 'restify-cors-middleware';

dotenv.config();

const server = restify.createServer();

const cors = corsMiddleware({
  origins: ['http://127.0.0.1:8080'],
  allowHeaders: ['Authorization', 'Content-Type'], 
  exposeHeaders: ['Authorization']
});

server.pre(cors.preflight);
server.use(cors.actual);

const io = new SocketIOServer(server.server, {
  cors: {
    origin: "http://127.0.0.1:8080",
    methods: ["GET", "POST"],
  },
});

server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser());

// Get endpoint to fetch the current flow
server.get('/api/getFlow', (req, res, next) => {
  try {
    const flow = db.getFlow();
    res.send(200,  flow );
    return next();
  } catch (error) {
    console.error('Error fetching flows:', error);
    res.send(500, { error: 'Internal Server Error' });
    return next(error);
  }
});

// Post endpoint to create/update the flow
server.post('/api/createFlow', (req, res, next) => {
  const { jsonFlow } = req.body;

  if (!jsonFlow) {
    res.send(400, { error: 'Invalid JSON flow' });
    return next();
  }

  try {
    const flowId = db.createUpdateFlow(String(jsonFlow));
    console.log('Flow created/updated with ID:', flowId);
    res.send(200, { flowId });
    return next();
  } catch (error) {
    console.error('Error creating/updating flow:', error);
    res.send(500, { error: 'Internal Server Error' });
    return next(error);
  }
});

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
  const conversationID: number | bigint = db.createConversation(); 

  socket.on('chatMessage', async (data) => {

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: data.messages as OpenAI.Chat.ChatCompletionMessage[]
      });
    

    db.createChatResponse(
      data.messages[0].content, // user_prompt
      response.choices[0].message.content ?? 'No response', // bot_answer
      data.messages[0].role, // flow_step_taken
      Number(conversationID) // conversation_id
    );

      const content = response.choices[0].message.content ?? 'No response';
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