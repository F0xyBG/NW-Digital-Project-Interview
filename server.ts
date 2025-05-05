import * as restify from 'restify';
import { Server as SocketIOServer, Socket } from 'socket.io';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import db from './Database/DBFunctions';
import corsMiddleware from 'restify-cors-middleware';

dotenv.config();

const server = restify.createServer();

const cors = corsMiddleware({
  origins: ['http://127.0.0.1:8080'],
  allowHeaders: ['Authorization', 'Content-Type'],
  exposeHeaders: ['Authorization'],
});

server.pre(cors.preflight);
server.use(cors.actual);

const io = new SocketIOServer(server.server, {
  cors: {
    origin: 'http://127.0.0.1:8080',
    methods: ['GET', 'POST'],
  },
});

server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser());

// Get endpoint to fetch the current flow
server.get('/api/getFlow', (req, res, next) => {
  try {
    const flow = db.getFlow();
    res.send(200, flow);
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

// Store the current block for each user session
const userSessions: Record<string, { currentBlockId: string | null }> = {};

io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
  console.log('A user connected:', socket.id);
  const conversationID: number | bigint = db.createConversation();

  // Fetch the flow from the database
  const flowData = db.getFlow();
  if (!flowData || flowData.length === 0) {
    socket.emit('error', { error: 'No valid flow found in the database' });
    return;
  }

  // Parse the JSON flow
  let flow: { startBlock: string; blocks: any[] };
  try {
    flow = JSON.parse(String((flowData[0] as { Json_flow: string }).Json_flow));
  } catch (error) {
    console.error('Error parsing flow JSON:', error);
    socket.emit('error', { error: 'Invalid flow structure in the database' });
    return;
  }

  // Ensure the flow has the required structure
  if (!flow.startBlock || !Array.isArray(flow.blocks)) {
    socket.emit('error', { error: 'Invalid flow structure' });
    return;
  }

  // Initialize the user's session
  const startBlock = flow.blocks.find((block) => block.id === flow.startBlock);
  const waitAfterStart = flow.blocks.find((block) => block.id === startBlock?.next);

  if (startBlock && startBlock.type === 'message' && typeof startBlock.message === 'string') {
    // Send the start message to the client
    socket.emit('chatResponse', startBlock.message);

    // Update the user's session to the next block
    userSessions[socket.id] = { currentBlockId: waitAfterStart.next };
  } else {
    socket.emit('error', { error: 'Invalid start block structure' });
    return;
  }

  // Handle chat messages
  socket.on('chatMessage', async (data: { messages: { role: string; content: string }[] }) => {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Get the user's current block
    const session = userSessions[socket.id];
    if (!session || !session.currentBlockId) {
      socket.emit('error', { error: 'Session not initialized' });
      return;
    }

    // Find the current block in the flow
    let currentBlock = flow.blocks.find((block) => block.id === session.currentBlockId);

    // Process the flow
    while (currentBlock) {
      if (currentBlock.type === 'message') {

        // Send the message to the client
        if (typeof currentBlock.message === 'string') {
          socket.emit('chatResponse', currentBlock.message);
        } else {
          socket.emit('error', { error: 'Invalid message block structure' });
          return;
        }

        // Update the session's current block
        session.currentBlockId = currentBlock.next; 
        currentBlock = flow.blocks.find((block) => block.id === currentBlock.next);
      } else if (currentBlock.type === 'wait') {

        // Stop processing and wait for user input and update the session's current block
        session.currentBlockId = currentBlock.next; 
        return;
      } else if (currentBlock.type === 'intent') {
        const userMessage = data.messages[0]?.content.toLowerCase();
        if (!userMessage) {
          socket.emit('error', { error: 'Invalid user message' });
          return;
        }

        // Try matching the user's message with match_phrases
        const matchedIntent = currentBlock.intents?.find((intent: { match_phrases: string[] }) =>
          intent.match_phrases.some((phrase: string) => userMessage.includes(phrase))
        );

        if (matchedIntent) {

          // If a match is found, proceed to the next block
          session.currentBlockId = matchedIntent.next;
          currentBlock = flow.blocks.find((block) => block.id === matchedIntent.next);
        } else {

          // If no match is found or no match_phrases exist, send the message to ChatGPT
          try {
            // Prepare the prompt for ChatGPT by using the intents from the current block to create a prompt for the model
            let prompt =
              "You are an intent recognition system. Your task is to identify the intent of the user's message, using the predetermined intents at the end of this message and send back just the matching intent. Please send back answers including JUST the intent from the list, which matches the message. If you cannot identify the intent, please send back 'unknown'. The intents are: ";
            for (const intent of currentBlock.intents) {
              prompt += intent.name + ', ';
            }
            const messagesToSend = [
              { role: 'system', content: prompt },
              { role: 'user', content: data.messages[0]?.content || '' },
            ];

            // Call OpenAI's API to detect the intent 
            const detectedIntent = await openai.chat.completions.create({
              model: 'gpt-4.1-nano',
              messages: messagesToSend as OpenAI.Chat.ChatCompletionMessage[],
            });

            const content = detectedIntent.choices[0]?.message?.content ?? 'No response';

            // Check if ChatGPT's response matches any intent
            const chatGPTMatchedIntent = currentBlock.intents?.find((intent: { match_phrases: string[] }) =>
              intent.match_phrases.some((phrase: string) => content.includes(phrase))
            );

            // If a match is found, proceed to the next block
            if (chatGPTMatchedIntent) {
              // Update the session's current block
              session.currentBlockId = chatGPTMatchedIntent.next; 
              currentBlock = flow.blocks.find((block) => block.id === chatGPTMatchedIntent.next);
            } else if (currentBlock.fallback) {
              // Use fallback if no intent matches
              session.currentBlockId = currentBlock.fallback;
              currentBlock = flow.blocks.find((block) => block.id === currentBlock.fallback);
            }

            // Save the chat response to the database
            db.createChatResponse(
              data.messages[0]?.content || '', // user_prompt
              content, // bot_answer
              currentBlock?.id || '', // flow_step_taken
              Number(conversationID) // conversation_id
            );
          } catch (error) {
            console.error('Error:', error);
            socket.emit('error', { error: 'Internal Server Error' });
            return;
          }
        }
      } else {
        socket.emit('error', { error: 'Unknown block type' });
        return;
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Clean up the user's session from the server memory
    delete userSessions[socket.id]; 
  });
});

const PORT = 7070;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});