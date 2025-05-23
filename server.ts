import * as restify from 'restify';
import { Server as SocketIOServer } from 'socket.io';
import { config } from './src/config/config.js';
import corsMiddleware from 'restify-cors-middleware2';
import { registerFlowRoutes } from './src/routes/flow.routes.js';
import { setupSocketHandlers } from './src/websocket/chat.handler.js';

// Create the server
const server = restify.createServer({
  name: 'chat-flow-server',
  version: '1.0.0',
});

// Middleware for CORS
const cors = corsMiddleware({
  origins: config.server.corsOrigins,
  allowHeaders: ['Authorization', 'Content-Type'],
  exposeHeaders: ['Authorization'],
});

// Set up middleware
server.pre(cors.preflight);
server.use(cors.actual);
server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser());

// Set up Socket.IO
const io = new SocketIOServer(server.server, {
  cors: {
    origin: config.server.corsOrigins,
    methods: ['GET', 'POST'],
  },
});

// Register routes
registerFlowRoutes(server);

// Set up WebSocket handlers
setupSocketHandlers(io);

// Start the server
const PORT = config.server.port;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.close(() => {
    console.log('Server shut down');
    process.exit(0);
  });
});
