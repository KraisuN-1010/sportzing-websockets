import { WebSocket, WebSocketServer } from 'ws';
import { wsArcjet } from '../config/arcjet.js';

const HEARTBEAT_INTERVAL_MS = 30_000;

const sendJson = (clientSocket, payload) => {
  if (clientSocket.readyState !== WebSocket.OPEN) return;

  try {
    clientSocket.send(JSON.stringify(payload));
  } catch (err) {
    console.error('Failed to send WS payload:', err);
  }
};

const broadcast = (webSocketServer, payload) => {
  let message;
  try {
    message = JSON.stringify(payload);
  } catch (err) {
    console.error('Failed to stringify broadcast payload:', err);
    return;
  }

  for (const clientSocket of webSocketServer.clients) {
    if (clientSocket.readyState !== WebSocket.OPEN) continue;
    clientSocket.send(message);
  }
};

export const attachWebSocketServer = (httpServer) => {
  const webSocketServer = new WebSocketServer({
    path: '/ws',
    maxPayload: 1024 * 1024,
  });

  // Intercept HTTP upgrade requests before WebSocket connection
  // This allows Arcjet to deny requests before socket creation
  httpServer.on('upgrade', async (req, socket, head) => {
    // Only handle /ws path
    if (req.url !== '/ws') {
      socket.destroy();
      return;
    }

    try {
      const arcjetDecision = await wsArcjet.protect(req);
      if (arcjetDecision.isDenied()) {
        // 1008 indicates policy violation per RFC 6455
        socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
        socket.destroy();
        return;
      }

      // Request allowed: proceed with WebSocket upgrade
      webSocketServer.handleUpgrade(req, socket, head, (clientSocket) => {
        webSocketServer.emit('connection', clientSocket, req);
      });
    } catch (arcjetError) {
      console.error('Arcjet WebSocket validation failed:', arcjetError);
      // 1011 indicates internal server processing error
      socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
      socket.destroy();
    }
  });

  webSocketServer.on('connection', (clientSocket, incomingReq) => {
    // Track liveness from the moment the socket connects
    clientSocket.isAlive = true;
    clientSocket.on('pong', () => {
      clientSocket.isAlive = true;
    });

    clientSocket.on('error', (err) => {
      console.error('WebSocket client error:', err);
    });

    // At this point, client has passed Arcjet checks
    sendJson(clientSocket, { type: 'Welcome' });
  });

  webSocketServer.on('error', (err) => {
    console.error('WebSocketServer error:', err);
  });

  // Heartbeat: ping every client on an interval; terminate any
  // socket that didn't pong back since the last check.
  const heartbeatInterval = setInterval(() => {
    for (const clientSocket of webSocketServer.clients) {
      if (clientSocket.isAlive === false) {
        clientSocket.terminate();
        continue;
      }
      clientSocket.isAlive = false;
      clientSocket.ping();
    }
  }, HEARTBEAT_INTERVAL_MS);

  webSocketServer.on('close', () => {
    clearInterval(heartbeatInterval);
  });

  const broadcastMatchCreated = (matchData) => {
    broadcast(webSocketServer, {
      type: 'match_created',
      data: matchData,
    });
  };

  return { broadcastMatchCreated };
};