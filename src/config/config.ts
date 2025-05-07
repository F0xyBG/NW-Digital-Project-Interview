import dotenv from 'dotenv';

dotenv.config();

if (!process.env.OPENAI_API_KEY) {
  console.warn('Warning: OPENAI_API_KEY is not set in environment variables');
}

export const config = {
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 7070,
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || [
      'http://127.0.0.1:8080',
    ],
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4.1-nano',
  },
};
