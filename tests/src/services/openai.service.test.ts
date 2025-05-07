import { OpenAIService } from '../../../src/services/openai.service';
import OpenAI from 'openai';
import { config } from '../../../src/config/config';

// Mock OpenAI
jest.mock('openai');
jest.mock('../../../src/config/config', () => ({
  config: {
    openai: {
      apiKey: 'test-api-key',
      model: 'test-model'
    }
  }
}));

describe('OpenAI Service', () => {
  let openAIService: OpenAIService;
  let mockOpenAIInstance: any;
  
  beforeEach(() => {
    mockOpenAIInstance = {
      chat: {
        completions: {
          create: jest.fn()
        }
      }
    };
    
    (OpenAI as unknown as jest.Mock).mockImplementation(() => mockOpenAIInstance);
    
    openAIService = new OpenAIService();
  });

  describe('constructor', () => {
    it('should initialize with the API key from config', () => {
      expect(OpenAI).toHaveBeenCalledWith({
        apiKey: 'test-api-key'
      });
    });
  });

  describe('detectIntent', () => {
    it('should call OpenAI API with correct parameters', async () => {
      const systemPrompt = 'You are an intent recognition system';
      const userMessage = 'Hello there';
      
      mockOpenAIInstance.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: 'greeting' } }]
      });
      
      const result = await openAIService.detectIntent(systemPrompt, userMessage);
      
      expect(mockOpenAIInstance.chat.completions.create).toHaveBeenCalledWith({
        model: 'test-model',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ]
      });
      
      expect(result).toBe('greeting');
    });

    it('should return default message if no response from API', async () => {
      mockOpenAIInstance.chat.completions.create.mockResolvedValue({
        choices: []
      });
      
      const result = await openAIService.detectIntent('prompt', 'message');
      
      expect(result).toBe('No response');
    });

    it('should handle API errors properly', async () => {
      mockOpenAIInstance.chat.completions.create.mockRejectedValue(
        new Error('API Error')
      );
      
      await expect(openAIService.detectIntent('prompt', 'message'))
        .rejects.toThrow('API Error');
    });
  });
});