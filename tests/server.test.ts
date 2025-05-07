import * as restify from 'restify';
import { Server as SocketIOServer } from 'socket.io';
import { config } from '../src/config/config';
import { registerFlowRoutes } from '../src/routes/flow.routes';
import { setupSocketHandlers } from '../src/websocket/chat.handler';

// Mock dependencies
jest.mock('restify');
jest.mock('socket.io');
jest.mock('../src/config/config', () => ({
  config: {
    server: {
      port: 7070,
      corsOrigins: ['http://localhost:3000']
    },
    openai: {
      apiKey: 'test-api-key',
      model: 'test-model'
    }
  }
}));
jest.mock('../src/routes/flow.routes');
jest.mock('../src/websocket/chat.handler');

describe('Server', () => {
  let mockServer: any;
  let mockSocketIO: any;
  
  beforeEach(() => {
    // Mock server and its methods
    mockServer = {
      server: {},
      pre: jest.fn(),
      use: jest.fn(),
      listen: jest.fn().mockImplementation((port, callback) => {
        if (callback) callback();
      }),
      close: jest.fn().mockImplementation((callback) => {
        if (callback) callback();
      })
    };
    
    // Mock createServer function
    (restify.createServer as jest.Mock).mockReturnValue(mockServer);
    
    // Mock Socket.IO
    mockSocketIO = {};
    (SocketIOServer as unknown as jest.Mock).mockReturnValue(mockSocketIO);
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should create and configure the server', () => {
    // We need to import the server to execute it
    // This is just for testing - normally you'd separate server setup from start
    jest.isolateModules(() => {
      require('../server');
      
      // Verify server creation
      expect(restify.createServer).toHaveBeenCalledWith({
        name: 'chat-flow-server',
        version: '1.0.0'
      });
      
      // Verify Socket.IO setup
      expect(SocketIOServer).toHaveBeenCalledWith(mockServer.server, {
        cors: {
          origin: config.server.corsOrigins,
          methods: ['GET', 'POST']
        }
      });
      
      // Verify middleware setup
      expect(mockServer.use).toHaveBeenCalledWith(expect.any(Function));
      
      // Verify routes registration
      expect(registerFlowRoutes).toHaveBeenCalledWith(mockServer);
      
      // Verify socket handlers setup
      expect(setupSocketHandlers).toHaveBeenCalledWith(mockSocketIO);
      
      // Verify server listening
      expect(mockServer.listen).toHaveBeenCalledWith(
        config.server.port,
        expect.any(Function)
      );
    });
  });

  it('should handle graceful shutdown', () => {
    const originalProcess = { ...process };
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
      return undefined as never;
    });
    
    // We need a way to trigger the SIGINT handler
    const sigintHandlers: Function[] = [];
    jest.spyOn(process, 'on').mockImplementation((event, handler) => {
      if (event === 'SIGINT') {
        sigintHandlers.push(handler as Function);
      }
      return process;
    });
    
    // Import server to set up handlers
    jest.isolateModules(() => {
      require('../server');
      
      // Trigger SIGINT handler
      if (sigintHandlers.length > 0) {
        sigintHandlers[0]();
      }
      
      // Verify server shutdown
      expect(mockServer.close).toHaveBeenCalled();
      
      // Callback should trigger process.exit
      const closeCallback = mockServer.close.mock.calls[0][0];
      closeCallback();
      
      expect(mockExit).toHaveBeenCalledWith(0);
    });
    
    // Restore process.exit
    mockExit.mockRestore();
  });
});