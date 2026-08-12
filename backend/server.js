import http from 'http';
import app from './src/app.js';
import { attachWebSocketServer } from './src/ws/server.js';
import { env } from './src/config/env.js';

// env.js has already called dotenv.config() and validated all required vars.
// Import PORT and HOST from there so we have a single source of truth.
const { PORT, HOST } = env;

// Binds raw HTTP protocol to Express to support WebSocket upgrades
const server = http.createServer(app);

const { broadcastMatchCreated, broadcastCommentaryToMatch } = attachWebSocketServer(server);
app.locals.broadcastMatchCreated = broadcastMatchCreated;
app.locals.broadcastCommentaryToMatch = broadcastCommentaryToMatch;

server.listen(PORT, HOST, () => {
  console.log(`Server is running on http://${HOST}:${PORT}`);
});