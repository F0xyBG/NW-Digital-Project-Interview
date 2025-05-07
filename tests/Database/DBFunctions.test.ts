import db from '../../Database/Database';
import dbFunctions from '../../Database/DBFunctions';

// Mock the Database module
jest.mock('../../Database/Database', () => ({
  prepare: jest.fn(),
  exec: jest.fn()
}));

describe('Database Functions', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createConversation', () => {
    it('should insert a new conversation and return the ID', () => {
      // Mock implementation
      const runMock = jest.fn().mockReturnValue({ lastInsertRowid: 123 });
      const prepareStmtMock = jest.fn().mockReturnValue({ run: runMock });
      
      (db.prepare as jest.Mock).mockImplementation(prepareStmtMock);
      
      const result = dbFunctions.createConversation();
      
      expect(db.prepare).toHaveBeenCalledWith('INSERT INTO Conversation DEFAULT VALUES');
      expect(runMock).toHaveBeenCalled();
      expect(result).toBe(123);
    });
  });

  describe('createUpdateFlow', () => {
    it('should delete existing flow and insert new flow', () => {
      // Mock implementation
      const deleteRunMock = jest.fn();
      const insertRunMock = jest.fn().mockReturnValue({ lastInsertRowid: 456 });
      const getMock = jest.fn().mockReturnValue({ count: 1 });
      
      (db.prepare as jest.Mock).mockImplementation((query) => {
        if (query.includes('DELETE')) {
          return { run: deleteRunMock };
        } else if (query.includes('INSERT')) {
          return { run: insertRunMock };
        } else {
          return { get: getMock };
        }
      });
      
      const result = dbFunctions.createUpdateFlow('{"test":"flow"}');
      
      expect(db.prepare).toHaveBeenCalledWith('SELECT COUNT(*) AS count FROM Flow');
      expect(db.prepare).toHaveBeenCalledWith('DELETE FROM Flow');
      expect(db.prepare).toHaveBeenCalledWith('INSERT INTO Flow (Json_flow) VALUES (?)');
      expect(deleteRunMock).toHaveBeenCalled();
      expect(insertRunMock).toHaveBeenCalledWith('{"test":"flow"}');
      expect(result).toBe(456);
    });

    it('should only insert flow if no existing flow found', () => {
      // Mock implementation
      const insertRunMock = jest.fn().mockReturnValue({ lastInsertRowid: 456 });
      const getMock = jest.fn().mockReturnValue({ count: 0 });
      
      (db.prepare as jest.Mock).mockImplementation((query) => {
        if (query.includes('INSERT')) {
          return { run: insertRunMock };
        } else {
          return { get: getMock };
        }
      });
      
      const result = dbFunctions.createUpdateFlow('{"test":"flow"}');
      
      expect(db.prepare).toHaveBeenCalledWith('SELECT COUNT(*) AS count FROM Flow');
      expect(insertRunMock).toHaveBeenCalledWith('{"test":"flow"}');
      expect(result).toBe(456);
    });
  });

  describe('createChatResponse', () => {
    it('should insert a chat response and return ID', () => {
      // Mock implementation
      const runMock = jest.fn().mockReturnValue({ lastInsertRowid: 789 });
      
      (db.prepare as jest.Mock).mockImplementation(() => ({ run: runMock }));
      
      const result = dbFunctions.createChatResponse(
        'User message', 
        'Bot response', 
        'intent_block', 
        123
      );
      
      expect(db.prepare).toHaveBeenCalled();
      expect(runMock).toHaveBeenCalledWith(
        'User message', 
        'Bot response', 
        'intent_block', 
        123
      );
      expect(result).toBe(789);
    });
  });

  describe('getFlow', () => {
    it('should retrieve flow data', () => {
      // Mock implementation
      const allMock = jest.fn().mockReturnValue([{ Json_flow: '{"test":"data"}' }]);
      
      (db.prepare as jest.Mock).mockImplementation(() => ({ all: allMock }));
      
      const result = dbFunctions.getFlow();
      
      expect(db.prepare).toHaveBeenCalledWith('SELECT Json_flow FROM Flow');
      expect(allMock).toHaveBeenCalled();
      expect(result).toEqual([{ Json_flow: '{"test":"data"}' }]);
    });
  });

  describe('getAllConversations', () => {
    it('should retrieve all conversations', () => {
      // Mock implementation
      const allMock = jest.fn().mockReturnValue([{ id: 1 }, { id: 2 }]);
      
      (db.prepare as jest.Mock).mockImplementation(() => ({ all: allMock }));
      
      const result = dbFunctions.getAllConversations();
      
      expect(db.prepare).toHaveBeenCalledWith('SELECT * FROM Conversation');
      expect(allMock).toHaveBeenCalled();
      expect(result).toEqual([{ id: 1 }, { id: 2 }]);
    });
  });

  describe('getAllChats', () => {
    it('should retrieve all chats', () => {
      // Mock implementation
      const allMock = jest.fn().mockReturnValue([
        { id: 1, user_prompt: 'Hello' },
        { id: 2, user_prompt: 'Hi' }
      ]);
      
      (db.prepare as jest.Mock).mockImplementation(() => ({ all: allMock }));
      
      const result = dbFunctions.getAllChats();
      
      expect(db.prepare).toHaveBeenCalledWith('SELECT * FROM Chat');
      expect(allMock).toHaveBeenCalled();
      expect(result).toEqual([
        { id: 1, user_prompt: 'Hello' },
        { id: 2, user_prompt: 'Hi' }
      ]);
    });
  });
});