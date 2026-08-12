import { WebSocket, WebSocketServer } from 'ws';
import { wsArcjet } from '../config/arcjet.js';

const HEARTBEAT_INTERVAL_MS = 30_000;

const MESSAGE_TYPE = {
  SUBSCRIBE: 'subscribe',
  UNSUBSCRIBE: 'unsubscribe',
};

const matchSubscribers = new Map();

const subscribe = (matchId, clientSocket) => {
  if (!matchSubscribers.has(matchId)) {
    matchSubscribers.set(matchId, new Set());
  }

  matchSubscribers.get(matchId).add(clientSocket);
};

const unsubscribe = (matchId, clientSocket) => {
  const subscribers = matchSubscribers.get(matchId);

  if (!subscribers) return;

  subscribers.delete(clientSocket);
  if (subscribers.size === 0) matchSubscribers.delete(matchId);
};

const cleanUpSubscriptions = (clientSocket) => {
  for (const matchId of clientSocket.subscriptions) {
    unsubscribe(matchId, clientSocket);
  }
};

const broadCastToMatch = (matchId, payload) => {
  const subscribers = matchSubscribers.get(matchId);

  if (!subscribers || subscribers.size === 0) return;

  const message = JSON.stringify(payload);

  for (const client of subscribers) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
};

const sendJson = (clientSocket, payload) => {
  if (clientSocket.readyState !== WebSocket.OPEN) return;

  try {
    clientSocket.send(JSON.stringify(payload));
  } catch (err) {
    console.error('Failed to send WS payload:', err);
  }
};

const broadcastToAll = (webSocketServer, payload) => {
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

const handleMessage = (clientSocket, data) => {
  let message;

  try {
    message = JSON.parse(data.toString());
  } catch {
    sendJson(clientSocket, { type: 'error', message: 'Invalid JSON' });
    return;
  }

  if (message?.type === MESSAGE_TYPE.SUBSCRIBE && Number.isInteger(message.matchId)) {
    subscribe(message.matchId, clientSocket);
    clientSocket.subscriptions.add(message.matchId);
    sendJson(clientSocket, { type: 'subscribed', matchId: message.matchId });
    return;
  }

  if (message?.type === MESSAGE_TYPE.UNSUBSCRIBE && Number.isInteger(message.matchId)) {
    unsubscribe(message.matchId, clientSocket);
    clientSocket.subscriptions.delete(message.matchId);
    sendJson(clientSocket, { type: 'unsubscribed', matchId: message.matchId });
    return;
  }

  sendJson(clientSocket, { type: 'error', message: 'Unknown message type' });
};

export const attachWebSocketServer = (httpServer) => {
  const webSocketServer = new WebSocketServer({
    noServer: true,
    maxPayload: 1024 * 1024,
  });

  // Intercept HTTP upgrade requests before WebSocket connection
  // This allows Arcjet to deny requests before socket creation
  httpServer.on('upgrade', async (req, socket, head) => {
    // Compare pathname only, so query strings (e.g. /ws?token=...) still match
    const { pathname } = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);

    if (pathname !== '/ws') {
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

  webSocketServer.on('connection', (clientSocket) => {
    // Track liveness from the moment the socket connects
    clientSocket.isAlive = true;
    clientSocket.subscriptions = new Set();

    clientSocket.on('pong', () => {
      clientSocket.isAlive = true;
    });

    clientSocket.on('error', (err) => {
      console.error('WebSocket client error:', err);
    });

    // Clean up this client's subscriptions when it disconnects
    // (tab closed, network drop, or heartbeat termination)
    clientSocket.on('close', () => {
      cleanUpSubscriptions(clientSocket);
    });

    clientSocket.on('message', (data) => {
      handleMessage(clientSocket, data);
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
        clientSocket.terminate(); // triggers 'close', which cleans up subscriptions
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
    broadcastToAll(webSocketServer, {
      type: 'match_created',
      data: matchData,
    });
  };

  const broadcastCommentaryToMatch = (matchId, comment) => {
    broadCastToMatch(matchId, { type: 'commentary', data: comment });
  };

  return { broadcastMatchCreated, broadcastCommentaryToMatch };
};