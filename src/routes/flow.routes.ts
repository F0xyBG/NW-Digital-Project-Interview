import * as restify from 'restify';
import { flowService } from '../services/flow.service.js';
import db from '../../Database/DBFunctions.js';

export function registerFlowRoutes(server: restify.Server) {
  
  // Get endpoint to fetch the current flow
  server.get('/api/getFlow', async (req, res) => {
    try {
      const flow = await db.getFlow();
      res.send(200, flow);
    } catch (error) {
      console.error('Error fetching flows:', error);
      res.send(500, { error: 'Internal Server Error' });
    }
  });

  // Post endpoint to create/update the flow
  server.post('/api/createFlow', async (req, res) => {
    const { jsonFlow } = req.body;

    if (!jsonFlow) {
      res.send(400, { error: 'Invalid JSON flow' });
      return;
    }

    try {
      const flowId = await flowService.createUpdateFlow(String(jsonFlow));
      console.log('Flow created/updated with ID:', flowId);
      res.send(200, { flowId });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Internal Server Error';
      console.error('Error creating/updating flow:', error);
      res.send(500, { error: errorMessage });
    }
  });
}
