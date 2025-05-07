import { registerFlowRoutes } from '../../../src/routes/flow.routes';
import { flowService } from '../../../src/services/flow.service';
import db from '../../../Database/DBFunctions';

// Mock dependencies
jest.mock('../../../src/services/flow.service');
jest.mock('../../../Database/DBFunctions');

describe('Flow Routes', () => {
  let mockServer: any;
  let mockReq: any;
  let mockRes: any;
  
  beforeEach(() => {
    // Create mock restify server
    mockServer = {
      get: jest.fn(),
      post: jest.fn()
    };
    
    // Mock request and response objects
    mockReq = { params: {}, body: {} };
    mockRes = {
      send: jest.fn()
    };
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('registerFlowRoutes', () => {
    it('should register GET and POST routes', () => {
      registerFlowRoutes(mockServer);
      
      expect(mockServer.get).toHaveBeenCalledWith(
        '/api/getFlow',
        expect.any(Function)
      );
      
      expect(mockServer.post).toHaveBeenCalledWith(
        '/api/createFlow',
        expect.any(Function)
      );
    });
  });

  describe('GET /api/getFlow', () => {
    it('should return flow data with status 200', async () => {
      const mockFlowData = [{ Json_flow: '{"test":"data"}' }];
      (db.getFlow as jest.Mock).mockReturnValue(mockFlowData);
      
      registerFlowRoutes(mockServer);
      
      // Extract and call the handler function
      const getHandler = mockServer.get.mock.calls[0][1];
      await getHandler(mockReq, mockRes);
      
      expect(db.getFlow).toHaveBeenCalled();
      expect(mockRes.send).toHaveBeenCalledWith(200, mockFlowData);
    });

    it('should return 500 error when database query fails', async () => {
      (db.getFlow as jest.Mock).mockImplementation(() => {
        throw new Error('Database error');
      });
      
      registerFlowRoutes(mockServer);
      
      // Extract and call the handler function
      const getHandler = mockServer.get.mock.calls[0][1];
      await getHandler(mockReq, mockRes);
      
      expect(db.getFlow).toHaveBeenCalled();
      expect(mockRes.send).toHaveBeenCalledWith(
        500, 
        { error: 'Internal Server Error' }
      );
    });
  });

  describe('POST /api/createFlow', () => {
    it('should create flow and return ID with status 200', async () => {
      mockReq.body = { jsonFlow: '{"test":"flow"}' };
      (flowService.createUpdateFlow as jest.Mock).mockResolvedValue(123);
      
      registerFlowRoutes(mockServer);
      
      // Extract and call the handler function
      const postHandler = mockServer.post.mock.calls[0][1];
      await postHandler(mockReq, mockRes);
      
      expect(flowService.createUpdateFlow).toHaveBeenCalledWith('{"test":"flow"}');
      expect(mockRes.send).toHaveBeenCalledWith(200, { flowId: 123 });
    });

    it('should return 400 when jsonFlow is missing', async () => {
      mockReq.body = {};
      
      registerFlowRoutes(mockServer);
      
      // Extract and call the handler function
      const postHandler = mockServer.post.mock.calls[0][1];
      await postHandler(mockReq, mockRes);
      
      expect(flowService.createUpdateFlow).not.toHaveBeenCalled();
      expect(mockRes.send).toHaveBeenCalledWith(
        400, 
        { error: 'Invalid JSON flow' }
      );
    });

    it('should return 500 with error message when flow creation fails', async () => {
      mockReq.body = { jsonFlow: '{"test":"flow"}' };
      
      (flowService.createUpdateFlow as jest.Mock).mockRejectedValue(
        new Error('Invalid JSON format')
      );
      
      registerFlowRoutes(mockServer);
      
      // Extract and call the handler function
      const postHandler = mockServer.post.mock.calls[0][1];
      await postHandler(mockReq, mockRes);
      
      expect(flowService.createUpdateFlow).toHaveBeenCalled();
      expect(mockRes.send).toHaveBeenCalledWith(
        500, 
        { error: 'Invalid JSON format' }
      );
    });
  });
});