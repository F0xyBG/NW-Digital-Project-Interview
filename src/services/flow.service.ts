import db from '../../Database/DBFunctions';
import { Flow, FlowBlock, Intent } from '../types';
import { openAIService } from './openai.service';

export class FlowService {
  async getFlow(): Promise<Flow | null> {
    const flowData = db.getFlow();
    
    if (!flowData || flowData.length === 0) {
      return null;
    }

    try {
      const flowJson = String((flowData[0] as { Json_flow: string }).Json_flow);
      const flow = JSON.parse(flowJson) as Flow;
      
      if (!this.validateFlow(flow)) {
        throw new Error('Invalid flow structure');
      }
      
      return flow;
    } catch (error) {
      console.error('Error parsing flow JSON:', error);
      return null;
    }
  }

  validateFlow(flow: any): flow is Flow {
    return (
      typeof flow.startBlock === 'string' &&
      Array.isArray(flow.blocks) &&
      flow.blocks.every((block: any) => 
        typeof block.id === 'string' && 
        ['message', 'wait', 'intent'].includes(block.type)
      )
    );
  }

  async createUpdateFlow(jsonFlow: string): Promise<number | bigint> {
    try {
      // Validate JSON format
      JSON.parse(jsonFlow);
      return db.createUpdateFlow(jsonFlow);
    } catch (error) {
      throw new Error('Invalid JSON format');
    }
  }

  findBlock(flow: Flow, blockId: string): FlowBlock | undefined {
    return flow.blocks.find(block => block.id === blockId);
  }

  async processMessageBlock(
    block: FlowBlock,
    socket: any,
    userSessionId: string,
    userSessions: Record<string, { currentBlockId: string | null }>
  ): Promise<{ nextBlockId: string | null }> {
    if (typeof block.message !== 'string') {
      throw new Error('Invalid message block structure');
    }
    
    socket.emit('chatResponse', block.message);
    return { nextBlockId: block.next || null };
  }

  async processWaitBlock(
    block: FlowBlock
  ): Promise<{ nextBlockId: string | null }> {
    return { nextBlockId: block.next || null };
  }

  async processIntentBlock(
    block: FlowBlock,
    userMessage: string,
    flow: Flow,
    conversationID: number | bigint,
    socket: any
  ): Promise<{ nextBlockId: string | null }> {
    if (!block.intents || !Array.isArray(block.intents)) {
      throw new Error('Invalid intent block structure');
    }

    // Try direct matching first
    const matchedIntent = this.findMatchingIntent(block.intents, userMessage);
    
    if (matchedIntent) {
      return { nextBlockId: matchedIntent.next };
    }
    
    // If no direct match, use OpenAI for intent detection
    try {
      const prompt = this.createIntentPrompt(block.intents);
      const content = await openAIService.detectIntent(prompt, userMessage);
      
      // Check if the AI response matches any intent
      const aiMatchedIntent = this.findIntentByName(block.intents, content);
      
      // Save chat response to database
      db.createChatResponse(
        userMessage,
        content,
        block.id,
        Number(conversationID)
      );
      
      if (aiMatchedIntent) {
        return { nextBlockId: aiMatchedIntent.next };
      } else if (block.fallback) {
        return { nextBlockId: block.fallback };
      }
      
      return { nextBlockId: null };
    } catch (error) {
      console.error('Error in intent recognition:', error);
      socket.emit('error', { error: 'Intent recognition failed' });
      return { nextBlockId: block.fallback || null };
    }
  }

  private findMatchingIntent(intents: Intent[], userMessage: string): Intent | undefined {
    const normalizedMessage = userMessage.toLowerCase();
    return intents.find(intent => 
      intent.match_phrases.some(phrase => 
        normalizedMessage.includes(phrase.toLowerCase())
      )
    );
  }

  private findIntentByName(intents: Intent[], content: string): Intent | undefined {
    return intents.find(intent => 
      content.toLowerCase().includes(intent.name.toLowerCase())
    );
  }

  private createIntentPrompt(intents: Intent[]): string {
    let prompt = "You are an intent recognition system. Your task is to identify the intent of the user's message, using the predetermined intents at the end of this message and send back just the matching intent. Please send back answers including JUST the intent from the list, which matches the message. If you cannot identify the intent, please send back 'unknown'. The intents are: ";
    
    intents.forEach(intent => {
      prompt += intent.name + ', ';
    });
    
    return prompt.trim().replace(/,\s*$/, '');
  }
}

export const flowService = new FlowService();