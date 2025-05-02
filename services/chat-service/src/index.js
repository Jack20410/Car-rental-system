const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const url = require('url');
const cors = require('cors');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3005;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ 
  server,
  // This verifyClient function allows us to check auth or reject connections
  verifyClient: (info, cb) => {
    // In a real app, you might validate a token here
    // For now we'll just check that userId is present
    const parsedUrl = url.parse(info.req.url, true);
    const userId = parsedUrl.query.userId;
    
    if (!userId) {
      cb(false, 401, 'Unauthorized');
    } else {
      cb(true);
    }
  }
});

// Store connected clients with user information
const clients = new Map();

// Track recently processed messages to prevent duplicates
const processedMessages = new Set();
const MESSAGE_HISTORY_LIMIT = 1000; // Maximum number of message IDs to track

// Helper function to create a unique message ID
function createMessageId(message) {
  return `${message.senderId}_${message.timestamp}_${message.text.substring(0, 10)}`;
}

// Add a function to check for duplicate messages
function isDuplicateMessage(message) {
  const messageId = createMessageId(message);
  
  if (processedMessages.has(messageId)) {
    return true;
  }
  
  // Add to processed messages and maintain size limit
  processedMessages.add(messageId);
  if (processedMessages.size > MESSAGE_HISTORY_LIMIT) {
    // Remove oldest entries when we exceed the limit
    const iterator = processedMessages.values();
    processedMessages.delete(iterator.next().value);
  }
  
  return false;
}

// Helper function to get all connected users
const getAllUsers = () => {
  return Array.from(clients.values()).map(client => ({
    id: client.id,
    name: client.name,
    color: client.color,
    role: client.role
  }));
};

// Helper function to notify users about online status changes
const notifyUserStatusChange = (type, user) => {
  const message = {
    type: type, // 'user-connected' or 'user-disconnected'
    data: {
      id: user.id,
      name: user.name,
      color: user.color,
      role: user.role,
      message: `${user.name} has ${type === 'user-connected' ? 'joined' : 'left'} the chat!`,
      users: getAllUsers()
    }
  };
  
  broadcastMessage(message);
};

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  const parsedUrl = url.parse(req.url, true);
  const userId = parsedUrl.query.userId;
  const userName = parsedUrl.query.name || 'Anonymous';
  const userRole = parsedUrl.query.role || 'user';
  
  console.log(`New connection: User ${userName} (${userId}) with role ${userRole}`);
  
  // Generate random color for user
  const color = getRandomColor();
  
  // Store user metadata
  const metadata = { 
    id: userId,
    name: userName,
    color: color,
    role: userRole
  };
  
  clients.set(ws, metadata);
  
  // Send welcome message and list of online users to the connected client
  ws.send(JSON.stringify({
    type: 'connection',
    data: {
      message: 'Connected to chat server',
      id: userId,
      name: userName,
      color: color,
      users: getAllUsers()
    }
  }));
  
  // Broadcast to all clients about new user
  notifyUserStatusChange('user-connected', metadata);
  
  // Handle incoming messages
  ws.on('message', (messageAsString) => {
    try {
      const message = JSON.parse(messageAsString);
      const metadata = clients.get(ws);
      
      console.log(`Received message from ${metadata.name}: ${JSON.stringify(message)}`);
      
      // Ensure the message has required fields
      if (!message.text) {
        return;
      }
      
      // Create standard message format
      const formattedMessage = {
        type: 'chat-message',
        data: {
          id: metadata.id,
          name: metadata.name,
          color: metadata.color,
          text: message.text,
          timestamp: message.timestamp || new Date().toISOString(),
          chatId: message.chatId || `${metadata.id}_${message.recipientId}`.split('_').sort().join('_'),
          senderId: metadata.id,
          recipientId: message.recipientId || null
        }
      };
      
      // Skip duplicate messages
      if (isDuplicateMessage(formattedMessage.data)) {
        console.log('Skipping duplicate message');
        return;
      }
      
      // If the message has a specific recipient, send it only to them
      if (message.recipientId) {
        console.log(`Sending direct message to ${message.recipientId}`);
        const success = sendDirectMessage(formattedMessage, metadata.id, message.recipientId);
        if (!success) {
          console.log(`Recipient ${message.recipientId} not found or offline`);
        }
      } else {
        // Otherwise broadcast to all
        broadcastMessage(formattedMessage);
      }
    } catch (e) {
      console.error('Error parsing message:', e);
    }
  });
  
  // Handle client disconnection
  ws.on('close', () => {
    const metadata = clients.get(ws);
    if (!metadata) return;
    
    console.log(`Disconnected: User ${metadata.name} (${metadata.id})`);
    
    clients.delete(ws);
    
    // Notify all clients about disconnection
    notifyUserStatusChange('user-disconnected', metadata);
  });
});

// Send message to a specific user
function sendDirectMessage(message, senderId, recipientId) {
  // Send to recipient
  let recipientFound = false;
  
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      const metadata = clients.get(client);
      // Send to both the sender and the recipient
      if (metadata.id === recipientId || metadata.id === senderId) {
        if (metadata.id === recipientId) {
          recipientFound = true;
        }
        client.send(JSON.stringify(message));
      }
    }
  });
  
  return recipientFound;
}

// Broadcast message to all connected clients
function broadcastMessage(message) {
  const messageString = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageString);
    }
  });
}

// Generate random color for user
function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

// API route to check server status
app.get('/status', (req, res) => {
  res.json({
    status: 'ok',
    connections: clients.size,
    users: getAllUsers()
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Chat server is running on http://localhost:${PORT}`);
});
