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
    server: httpServer,
    path: '/ws',
    maxPayload: 1024 * 1024,
  });

  webSocketServer.on('connection', async (clientSocket, incomingReq) => {
    // Track liveness from the moment the socket connects, before the
    // arcjet check resolves — arcjet.protect() is async, so without this
    // a slow check could leave the socket untracked for a beat.
    clientSocket.isAlive = true;
    clientSocket.on('pong', () => {
      clientSocket.isAlive = true;
    });

    clientSocket.on('error', (err) => {
      console.error('WebSocket client error:', err);
    });

    try {
      // Validates connection against security policies before accepting payload traffic
      const arcjetDecision = await wsArcjet.protect(incomingReq);
      if (arcjetDecision.isDenied()) {
        // 1008 indicates policy violation per RFC 6455
        clientSocket.close(1008, 'Access Denied');
        return;
      }

      sendJson(clientSocket, { type: 'Welcome' });
    } catch (validationError) {
      console.error('Arcjet validation failed:', validationError);

      // 1011 indicates internal server processing error
      clientSocket.close(1011, 'Internal Server Error');
    }
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