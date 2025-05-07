export interface FlowBlock {
  id: string;
  type: 'message' | 'wait' | 'intent';
  message?: string;
  next?: string | null;
  intents?: Intent[];
  fallback?: string;
}

export interface Intent {
  name: string;
  match_phrases: string[];
  next: string;
}

export interface Flow {
  startBlock: string;
  blocks: FlowBlock[];
}

export interface UserSession {
  currentBlockId: string | null;
}

export interface ServerToClientEvents {
  chatResponse: (message: string) => void;
  error: (error: { error: string }) => void;
}

export interface ClientToServerEvents {
  chatMessage: (data: {
    messages: { role: string; content: string }[];
  }) => void;
}

export interface ChatMessage {
  role: string;
  content: string;
}
