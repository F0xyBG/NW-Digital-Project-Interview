import OpenAI from 'openai';
import { config } from '../config/config';
import { ChatMessage } from '../types';

export class OpenAIService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: config.openai.apiKey,
    });
  }

  async detectIntent(
    systemPrompt: string,
    userMessage: string
  ): Promise<string> {
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ];

    const response = await this.client.chat.completions.create({
      model: config.openai.model,
      messages: messages as OpenAI.Chat.ChatCompletionMessage[],
    });

    return response.choices[0]?.message?.content ?? 'No response';
  }
}

export const openAIService = new OpenAIService();
