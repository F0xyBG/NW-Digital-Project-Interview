import { Server as SocketIOServer, Socket } from 'socket.io';
import db from '../../Database/DBFunctions';
import { ClientToServerEvents, Flow, ServerToClientEvents, UserSession } from '../types';
import { flowService } from '../services/flow.service';

// Store the current block for each user session
const userSessions: Record<string, UserSession> = {};

export function setupSocketHandlers(io: SocketIOServer) {
  io.on(
    'connection',
    (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
      console.log('A user connected:', socket.id);
      handleNewConnection(socket);

      socket.on('chatMessage', async (data) => {
        await handleChatMessage(socket, data);
      });

      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Clean up the user's session from the server memory
        delete userSessions[socket.id];
      });
    }
  );
}

async function handleNewConnection(socket: Socket<ClientToServerEvents, ServerToClientEvents>) {
  const conversationID = db.createConversation();
  
  // Store the conversation ID in the user session
  socket.data.conversationID = conversationID;

  // Fetch and initialize the flow
  const flow = await flowService.getFlow();
  
  if (!flow) {
    socket.emit('error', { error: 'No valid flow found in the database' });
    return;
  }

  // Initialize the user's session with the first message
  await initializeUserSession(socket, flow);
}

async function initializeUserSession(
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
  flow: Flow
) {
  // Find the starting block
  const startBlock = flowService.findBlock(flow, flow.startBlock);
  
  if (!startBlock || startBlock.type !== 'message' || typeof startBlock.message !== 'string') {
    socket.emit('error', { error: 'Invalid start block structure' });
    return;
  }

  // Send the initial message
  socket.emit('chatResponse', startBlock.message);

  // Find the next block after start (typically a wait block)
  if (startBlock.next) {
    const waitBlock = flowService.findBlock(flow, startBlock.next);
    
    if (waitBlock && waitBlock.next) {
      // Set the next block as the current block in the user session
      userSessions[socket.id] = { currentBlockId: waitBlock.next };
    } else {
      socket.emit('error', { error: 'Invalid flow structure after start block' });
    }
  }
}

async function handleChatMessage(
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
  data: { messages: { role: string; content: string }[] }
) {
  const conversationID = socket.data.conversationID;
  
  // Get the user's current block
  const session = userSessions[socket.id];
  if (!session || !session.currentBlockId) {
    socket.emit('error', { error: 'Session not initialized' });
    return;
  }

  // Get the current flow
  const flow = await flowService.getFlow();
  if (!flow) {
    socket.emit('error', { error: 'Flow not found' });
    return;
  }

  // Process blocks until we reach a wait block or end of flow
  await processFlowBlocks(socket, flow, session, data.messages[0]?.content || '', conversationID);
}

async function processFlowBlocks(
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
  flow: Flow,
  session: UserSession,
  userMessage: string,
  conversationID: number | bigint
) {
  let currentBlockId = session.currentBlockId;
  
  while (currentBlockId) {
    const currentBlock = flowService.findBlock(flow, currentBlockId);
    
    if (!currentBlock) {
      socket.emit('error', { error: `Block not found: ${currentBlockId}` });
      return;
    }

    try {
      let result;

      switch (currentBlock.type) {
        case 'message':
          result = await flowService.processMessageBlock(
            currentBlock, 
            socket, 
            socket.id, 
            userSessions
          );
          break;
          
        case 'wait':
          result = await flowService.processWaitBlock(currentBlock);
          // For wait blocks, we stop processing here
          userSessions[socket.id].currentBlockId = result.nextBlockId;
          return;
          
        case 'intent':
          result = await flowService.processIntentBlock(
            currentBlock,
            userMessage,
            flow,
            conversationID,
            socket
          );
          break;
          
        default:
          socket.emit('error', { error: 'Unknown block type' });
          return;
      }

      // Update the session with the next block ID
      currentBlockId = result.nextBlockId;
      userSessions[socket.id].currentBlockId = currentBlockId;
      
    } catch (error) {
      console.error('Error processing flow block:', error);
      socket.emit('error', { error: 'Error processing flow' });
      return;
    }
  }
}