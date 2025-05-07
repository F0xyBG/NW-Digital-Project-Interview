import { setupSocketHandlers } from '../../../src/websocket/chat.handler';
import db from '../../../Database/DBFunctions';
import { flowService } from '../../../src/services/flow.service';
import { Flow, FlowBlock } from '../../../src/types';
import { Server as SocketIOServer, Socket } from 'socket.io';

// Mock dependencies
jest.mock('../../../Database/DBFunctions');
jest.mock('../../../src/services/flow.service');

// Types for mocks
interface MockSocket extends Partial<Socket> {
  id: string;
  data: Record<string, any>;
  emit: jest.Mock;
  on: jest.Mock;
}

interface MockSocketServer extends Partial<SocketIOServer> {
  on: jest.Mock;
}

describe('Chat Handler', () => {
  let mockSocketIO: MockSocketServer;
  let mockSocket: MockSocket;
  let connectionCallback: (socket: MockSocket) => void;
  
  beforeEach(() => {
    // Mock socket.io server
    mockSocket = {
      id: 'socket-123',
      data: {},
      emit: jest.fn(),
      on: jest.fn()
    };
    
    mockSocketIO = {
      on: jest.fn().mockImplementation((event: string, callback: (socket: MockSocket) => void) => {
        if (event === 'connection') {
          // Store the callback but don't execute it immediately
          connectionCallback = callback;
        }
        return mockSocketIO;
      })
    };
    
    // Mock database and flow service
    (db.createConversation as jest.Mock).mockReturnValue(456);
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('setupSocketHandlers', () => {
    it('should set up connection handler and event listeners', () => {
      setupSocketHandlers(mockSocketIO as unknown as SocketIOServer);
      
      expect(mockSocketIO.on).toHaveBeenCalledWith(
        'connection',
        expect.any(Function)
      );
      
      // Execute the connection callback manually
      connectionCallback(mockSocket);
      
      expect(mockSocket.on).toHaveBeenCalledWith(
        'chatMessage',
        expect.any(Function)
      );
      
      expect(mockSocket.on).toHaveBeenCalledWith(
        'disconnect',
        expect.any(Function)
      );
    });
  });

  describe('handleNewConnection', () => {
    it('should initialize a new user session', async () => {
      // Mock the flow service
      const mockFlow: Flow = {
        startBlock: 'start',
        blocks: [
          {
            id: 'start',
            type: 'message',
            message: 'Welcome!',
            next: 'wait'
          },
          {
            id: 'wait',
            type: 'wait',
            next: 'intent'
          }
        ]
      };
      
      (flowService.getFlow as jest.Mock).mockResolvedValue(mockFlow);
      (flowService.findBlock as jest.Mock).mockImplementation((flow: Flow, id: string) => 
        flow.blocks.find(block => block.id === id)
      );
      
      setupSocketHandlers(mockSocketIO as unknown as SocketIOServer);
      
      // Execute the connection callback and wait for it to complete
      await connectionCallback(mockSocket);
      
      // Verify database call
      expect(db.createConversation).toHaveBeenCalled();
      expect(mockSocket.data.conversationID).toBe(456);
      
      // Verify flow is fetched
      expect(flowService.getFlow).toHaveBeenCalled();
      
      // Verify initial message is sent
      expect(mockSocket.emit).toHaveBeenCalledWith('chatResponse', 'Welcome!');
    });

    it('should handle missing flow', async () => {
      (flowService.getFlow as jest.Mock).mockResolvedValue(null);
      
      setupSocketHandlers(mockSocketIO as unknown as SocketIOServer);
      
      // Execute connection callback and wait for it to complete
      await connectionCallback(mockSocket);
      
      expect(mockSocket.emit).toHaveBeenCalledWith(
        'error',
        { error: 'No valid flow found in the database' }
      );
    });

    it('should handle invalid start block', async () => {
      const mockFlow: Flow = {
        startBlock: 'invalid',
        blocks: [
          { id: 'start', type: 'message', message: 'Welcome!' }
        ]
      };
      
      (flowService.getFlow as jest.Mock).mockResolvedValue(mockFlow);
      (flowService.findBlock as jest.Mock).mockReturnValue(undefined);
      
      setupSocketHandlers(mockSocketIO as unknown as SocketIOServer);
      
      // Execute connection callback and wait for it to complete
      await connectionCallback(mockSocket);
      
      expect(mockSocket.emit).toHaveBeenCalledWith(
        'error',
        { error: 'Invalid start block structure' }
      );
    });
  });

  describe('handleChatMessage', () => {
    it('should process user message through flow blocks', async () => {
      // Setup mock flow and session
      const mockFlow: Flow = {
        startBlock: 'start',
        blocks: [
          { id: 'intent', type: 'intent', intents: [] }
        ]
      };
      
      // Mock the flow service responses
      (flowService.getFlow as jest.Mock).mockResolvedValue(mockFlow);
      (flowService.findBlock as jest.Mock).mockImplementation((flow: Flow, id: string) => 
        flow.blocks.find(block => block.id === id)
      );
      
      (flowService.processIntentBlock as jest.Mock).mockResolvedValue({
        nextBlockId: 'next-block'
      });
      
      // Setup the handlers
      setupSocketHandlers(mockSocketIO as unknown as SocketIOServer);
      
      // Execute connection callback to register the event handlers
      connectionCallback(mockSocket);
      
      // Verify the chatMessage handler was registered
      expect(mockSocket.on).toHaveBeenCalledWith(
        'chatMessage',
        expect.any(Function)
      );
      
      // Extract the actual handler function
      const chatMessageHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'chatMessage'
      )[1] as (data: any) => Promise<void>;
      
      // Set up the conversation ID
      mockSocket.data.conversationID = 456;
      
      // Call the handler directly with test data
      await chatMessageHandler({
        messages: [{ role: 'user', content: 'Hello' }]
      });
      
      // Verify flow is fetched during message processing
      expect(flowService.getFlow).toHaveBeenCalled();
    });
  });
});