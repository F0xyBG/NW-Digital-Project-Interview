import { flowService, FlowService } from '../../../src/services/flow.service';
import db from '../../../Database/DBFunctions';
import { openAIService } from '../../../src/services/openai.service';
import { Flow, FlowBlock } from '../../../src/types';

// Mock dependencies
jest.mock('../../../Database/DBFunctions');
jest.mock('../../../src/services/openai.service');

describe('Flow Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getFlow', () => {
    it('should return parsed flow data when valid JSON is retrieved', async () => {
      const mockFlowData = [{ Json_flow: '{"startBlock":"start","blocks":[]}' }];
      (db.getFlow as jest.Mock).mockReturnValue(mockFlowData);
      
      const result = await flowService.getFlow();
      
      expect(db.getFlow).toHaveBeenCalled();
      expect(result).toEqual({ startBlock: 'start', blocks: [] });
    });

    it('should return null when no flow data is found', async () => {
      (db.getFlow as jest.Mock).mockReturnValue([]);
      
      const result = await flowService.getFlow();
      
      expect(db.getFlow).toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should return null when flow JSON is invalid', async () => {
      const mockFlowData = [{ Json_flow: 'invalid-json' }];
      (db.getFlow as jest.Mock).mockReturnValue(mockFlowData);
      
      const result = await flowService.getFlow();
      
      expect(db.getFlow).toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('validateFlow', () => {
    it('should return true for valid flow', () => {
      const validFlow = {
        startBlock: 'start',
        blocks: [
          { id: 'start', type: 'message' },
          { id: 'wait', type: 'wait' }
        ]
      };

      const result = flowService.validateFlow(validFlow);
      
      expect(result).toBe(true);
    });

    it('should return false for invalid flow', () => {
      const invalidFlow = {
        blocks: [{ id: 'start', type: 'message' }]
      };

      const result = flowService.validateFlow(invalidFlow);
      
      expect(result).toBe(false);
    });
  });

  describe('createUpdateFlow', () => {
    it('should create/update flow with valid JSON', async () => {
      const validJson = '{"startBlock":"start","blocks":[]}';
      (db.createUpdateFlow as jest.Mock).mockReturnValue(123);
      
      const result = await flowService.createUpdateFlow(validJson);
      
      expect(db.createUpdateFlow).toHaveBeenCalledWith(validJson);
      expect(result).toBe(123);
    });

    it('should throw error with invalid JSON', async () => {
      const invalidJson = 'invalid-json';
      
      await expect(flowService.createUpdateFlow(invalidJson))
        .rejects.toThrow('Invalid JSON format');
      
      expect(db.createUpdateFlow).not.toHaveBeenCalled();
    });
  });

  describe('findBlock', () => {
    it('should find a block by ID', () => {
      const flow: Flow = {
        startBlock: 'start',
        blocks: [
          { id: 'start', type: 'message', message: 'Hello' },
          { id: 'wait', type: 'wait' }
        ]
      };

      const result = flowService.findBlock(flow, 'start');
      
      expect(result).toEqual({ id: 'start', type: 'message', message: 'Hello' });
    });

    it('should return undefined if block not found', () => {
      const flow: Flow = {
        startBlock: 'start',
        blocks: [{ id: 'start', type: 'message' }]
      };

      const result = flowService.findBlock(flow, 'nonexistent');
      
      expect(result).toBeUndefined();
    });
  });

  describe('processMessageBlock', () => {
    it('should emit message and return next block ID', async () => {
      const socket = { emit: jest.fn() };
      const block: FlowBlock = {
        id: 'msg1',
        type: 'message',
        message: 'Hello user',
        next: 'wait1'
      };
      const userSessions = {};

      const result = await flowService.processMessageBlock(
        block,
        socket,
        'user123',
        userSessions
      );

      expect(socket.emit).toHaveBeenCalledWith('chatResponse', 'Hello user');
      expect(result).toEqual({ nextBlockId: 'wait1' });
    });

    it('should throw error if message is missing', async () => {
      const socket = { emit: jest.fn() };
      const block: FlowBlock = {
        id: 'msg1',
        type: 'message',
        next: 'wait1'
      };
      const userSessions = {};

      await expect(
        flowService.processMessageBlock(block, socket, 'user123', userSessions)
      ).rejects.toThrow('Invalid message block structure');
    });
  });

  describe('processWaitBlock', () => {
    it('should return next block ID', async () => {
      const block: FlowBlock = {
        id: 'wait1',
        type: 'wait',
        next: 'intent1'
      };

      const result = await flowService.processWaitBlock(block);
      
      expect(result).toEqual({ nextBlockId: 'intent1' });
    });

    it('should return null if no next block', async () => {
      const block: FlowBlock = {
        id: 'wait1',
        type: 'wait'
      };

      const result = await flowService.processWaitBlock(block);
      
      expect(result).toEqual({ nextBlockId: null });
    });
  });

  describe('processIntentBlock', () => {
    it('should find direct match from intent phrases', async () => {
      const block: FlowBlock = {
        id: 'intent1',
        type: 'intent',
        intents: [
          { name: 'greeting', match_phrases: ['hello', 'hi'], next: 'msg2' },
          { name: 'goodbye', match_phrases: ['bye'], next: 'end' }
        ],
        fallback: 'fallback1'
      };
      const flow: Flow = { startBlock: 'start', blocks: [] };
      const socket = { emit: jest.fn() };

      const result = await flowService.processIntentBlock(
        block,
        'hello there',
        flow,
        123,
        socket
      );

      expect(result).toEqual({ nextBlockId: 'msg2' });
    });

    it('should use OpenAI when no direct match found', async () => {
      const block: FlowBlock = {
        id: 'intent1',
        type: 'intent',
        intents: [
          { name: 'greeting', match_phrases: ['hello', 'hi'], next: 'msg2' },
          { name: 'goodbye', match_phrases: ['bye'], next: 'end' }
        ],
        fallback: 'fallback1'
      };
      const flow: Flow = { startBlock: 'start', blocks: [] };
      const socket = { emit: jest.fn() };

      // Mock OpenAI to return 'greeting' intent
      (openAIService.detectIntent as jest.Mock).mockResolvedValue('greeting');
      
      const result = await flowService.processIntentBlock(
        block,
        'good day',
        flow,
        123,
        socket
      );

      expect(openAIService.detectIntent).toHaveBeenCalled();
      expect(db.createChatResponse).toHaveBeenCalledWith(
        'good day',
        'greeting',
        'intent1',
        123
      );
      expect(result).toEqual({ nextBlockId: 'msg2' });
    });

    it('should use fallback if no intent match found', async () => {
      const block: FlowBlock = {
        id: 'intent1',
        type: 'intent',
        intents: [
          { name: 'greeting', match_phrases: ['hello'], next: 'msg2' },
          { name: 'goodbye', match_phrases: ['bye'], next: 'end' }
        ],
        fallback: 'fallback1'
      };
      const flow: Flow = { startBlock: 'start', blocks: [] };
      const socket = { emit: jest.fn() };

      // Mock OpenAI to return 'unknown'
      (openAIService.detectIntent as jest.Mock).mockResolvedValue('unknown');
      
      const result = await flowService.processIntentBlock(
        block,
        'nonsense input',
        flow,
        123,
        socket
      );

      expect(result).toEqual({ nextBlockId: 'fallback1' });
    });

    it('should handle errors in intent recognition', async () => {
      const block: FlowBlock = {
        id: 'intent1',
        type: 'intent',
        intents: [{ name: 'test', match_phrases: [], next: 'next' }],
        fallback: 'fallback1'
      };
      const flow: Flow = { startBlock: 'start', blocks: [] };
      const socket = { emit: jest.fn() };

      // Mock OpenAI to throw error
      (openAIService.detectIntent as jest.Mock).mockRejectedValue(new Error('API error'));
      
      const result = await flowService.processIntentBlock(
        block,
        'test input',
        flow,
        123,
        socket
      );

      expect(socket.emit).toHaveBeenCalledWith('error', { error: 'Intent recognition failed' });
      expect(result).toEqual({ nextBlockId: 'fallback1' });
    });
  });
});