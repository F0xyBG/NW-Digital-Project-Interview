import { config } from '../../../src/config/config';
import dotenv from 'dotenv';

// Mock dotenv
jest.mock('dotenv', () => ({
  config: jest.fn()
}));

describe('Configuration', () => {
  let originalEnv: NodeJS.ProcessEnv;
  
  beforeEach(() => {
    // Save original process.env
    originalEnv = { ...process.env };
    
    // Reset modules to get fresh config
    jest.resetModules();
  });
  
  afterEach(() => {
    // Restore original process.env
    process.env = originalEnv;
  });

  it('should use default values when environment variables are not set', () => {
    // Clear relevant environment variables
    delete process.env.PORT;
    delete process.env.CORS_ORIGINS;
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_MODEL;
    
    // Re-import config to get fresh values
    const { config } = require('../../../src/config/config');
    
    // Check default values
    expect(config.server.port).toBe(7070);
    expect(config.server.corsOrigins).toEqual(['http://127.0.0.1:8080']);
    expect(config.openai.apiKey).toBe('');
    expect(config.openai.model).toBe('gpt-4.1-nano');
  });

  it('should use environment variables when they are set', () => {
    // Set environment variables
    process.env.PORT = '8080';
    process.env.CORS_ORIGINS = 'http://localhost:3000,http://example.com';
    process.env.OPENAI_API_KEY = 'test-api-key';
    process.env.OPENAI_MODEL = 'gpt-3.5-turbo';
    
    // Re-import config to get fresh values
    const { config } = require('../../../src/config/config');
    
    // Check values from environment
    expect(config.server.port).toBe(8080);
    expect(config.server.corsOrigins).toEqual(['http://localhost:3000', 'http://example.com']);
    expect(config.openai.apiKey).toBe('test-api-key');
    expect(config.openai.model).toBe('gpt-3.5-turbo');
  });
});