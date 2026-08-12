import http from 'http';
import app from './src/app.js';
import { attachWebSocketServer } from './src/ws/server.js';

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Binds raw HTTP protocol to Express to support WebSocket upgrades
const server = http.createServer(app);

const { broadcastMatchCreated, broadcastCommentaryToMatch } = attachWebSocketServer(server);
app.locals.broadcastMatchCreated = broadcastMatchCreated;
app.locals.broadcastCommentaryToMatch = broadcastCommentaryToMatch;

server.listen(PORT, HOST, () => {
  console.log(`Server is running on http://${HOST}:${PORT}`);
});