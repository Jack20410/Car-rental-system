const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const url = require('url');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const connectDB = require('./config/db');
connectDB();

// Import models
const Conversation = require('./models/Conversation');
const Message = require('./models/Message');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3005;

// Parse allowed origins from environment variable
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:4000').split(',');

// Enable CORS for all routes with specific configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true
}));
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server with CORS options
const wss = new WebSocket.Server({ 
  server,
  // This verifyClient function allows us to check auth or reject connections
  verifyClient: (info, cb) => {
    // Check origin
    const origin = info.origin || info.req.headers.origin;
    
    // Allow if origin is in our allowed list
    if (!allowedOrigins.includes(origin)) {
      console.log(`Rejected WebSocket connection from origin: ${origin}`);
      console.log('Allowed origins:', allowedOrigins);
      cb(false, 403, 'Forbidden - Origin not allowed');
      return;
    }
    
    // Check userId
    const parsedUrl = url.parse(info.req.url, true);
    const userId = parsedUrl.query.userId;
    
    if (!userId) {
      console.log('Rejected WebSocket connection: No userId provided');
      cb(false, 401, 'Unauthorized - No userId provided');
      return;
    }
    
    cb(true);
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

// Add a function to create consistent chat IDs
function createChatId(senderId, recipientId) {
  // Always sort IDs to ensure the same chatId regardless of who initiates
  return [senderId, recipientId].sort().join('_');
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

// Save message to database
async function saveMessageToDatabase(message) {
  try {
    const messageId = createMessageId(message);
    const { senderId, text, timestamp, chatId, recipientId } = message;
    const senderMetadata = Array.from(clients.values()).find(user => user.id === senderId);
    
    if (!senderMetadata) {
      console.error('Sender metadata not found');
      return;
    }

    // First, check if conversation exists
    let conversation = await Conversation.findOne({ chatId });
    
    // If no conversation, create one
    if (!conversation) {
      console.log(`Creating new conversation with chatId: ${chatId}`);
      
      // Create participants array starting with the sender
      const participants = [
        {
          userId: senderId,
          name: senderMetadata.name,
          role: senderMetadata.role
        }
      ];

      // Find recipient metadata if this is a direct message
      const recipientMetadata = recipientId 
        ? Array.from(clients.values()).find(user => user.id === recipientId)
        : null;

      // If recipient is online, use their current metadata
      if (recipientId && recipientMetadata) {
        participants.push({
          userId: recipientId,
          name: recipientMetadata.name,
          role: recipientMetadata.role
        });
      } 
      // If recipient is not online but we have their ID, still add them to participants
      else if (recipientId) {
        // First check if we already have a saved message from this recipient to get their details
        const existingMessage = await Message.findOne({ senderId: recipientId });
        
        if (existingMessage) {
          // Use data from previous messages
          participants.push({
            userId: recipientId,
            name: existingMessage.senderName,
            role: existingMessage.senderRole
          });
        } else {
          // Add recipient with minimal information if we don't know more
          participants.push({
            userId: recipientId,
            name: 'User',  // This will be updated when they connect
            role: recipientId.includes('provider') ? 'car_provider' : 'customer'  // Better role determination
          });
        }
      }

      // Create new conversation - add better error handling
      try {
        // Log the conversation data we're trying to create
        console.log('Attempting to create conversation with data:', {
          chatId,
          participants,
          lastMessage: text,
          lastMessageTime: timestamp
        });
        
        conversation = await Conversation.create({
          chatId,
          participants,
          lastMessage: text,
          lastMessageTime: timestamp
        });
        console.log(`Created new conversation: ${chatId}, id: ${conversation._id}`);
      } catch (error) {
        // Handle potential race condition where conversation was created by another process
        if (error.code === 11000) { // Duplicate key error
          console.log('Conversation already exists (concurrent creation), retrieving it');
          conversation = await Conversation.findOne({ chatId });
          
          // Update the conversation
          if (conversation) {
            conversation.lastMessage = text;
            conversation.lastMessageTime = timestamp;
            await conversation.save();
          } else {
            // This shouldn't happen but handle it anyway
            console.error('Failed to retrieve conversation after duplicate key error');
          }
        } else {
          console.error('Error creating conversation:', error.message);
          // Try creating with just essential fields
          try {
            conversation = await Conversation.create({
              chatId,
              participants: participants.map(p => ({
                userId: p.userId,
                name: p.name || 'User',
                role: p.role || 'user'
              })),
              lastMessage: text.substring(0, 100), // Truncate message to avoid issues
              lastMessageTime: timestamp
            });
            console.log(`Created new conversation with minimal data: ${chatId}`);
          } catch (fallbackError) {
            console.error('Failed even with fallback conversation creation:', fallbackError);
            // Create a very basic conversation as last resort
            try {
              conversation = new Conversation({
                chatId,
                participants: [{ userId: senderId, name: 'User', role: 'user' }],
                lastMessage: 'New conversation',
                lastMessageTime: new Date()
              });
              await conversation.save();
              console.log('Created backup conversation with minimal fields');
            } catch (lastError) {
              console.error('All attempts to create conversation failed:', lastError);
            }
          }
        }
      }
    } else {
      // Update conversation with last message
      conversation.lastMessage = text;
      conversation.lastMessageTime = timestamp;
      await conversation.save();
      console.log(`Updated existing conversation: ${chatId}`);
    }
    
    // Save the message
    const savedMessage = await Message.create({
      messageId,
      chatId,
      senderId,
      senderName: senderMetadata.name,
      senderRole: senderMetadata.role,
      recipientId: recipientId || null,
      text,
      timestamp
    });
    
    console.log(`Message saved to database: ${messageId}`);
    return savedMessage;
  } catch (error) {
    console.error('Error saving message to database:', error);
    return null;
  }
}

// Send message to a specific user
function sendDirectMessage(message, senderId, recipientId) {
  let recipientFound = false;
  let messageSent = false;
  
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      const metadata = clients.get(client);
      // Skip clients without metadata
      if (!metadata) return;
      
      // Send to both the sender and the recipient
      if (metadata.id === recipientId || metadata.id === senderId) {
        if (metadata.id === recipientId) {
          recipientFound = true;
        }
        try {
          client.send(JSON.stringify(message));
          messageSent = true;
        } catch (err) {
          console.error(`Error sending message to ${metadata.id}:`, err);
        }
      }
    }
  });
  
  if (!messageSent) {
    console.log(`Warning: Message could not be delivered to any clients. Sender: ${senderId}, Recipient: ${recipientId}`);
  }
  
  return recipientFound;
}

// Broadcast message to all connected clients
function broadcastMessage(message) {
  const messageString = JSON.stringify(message);
  let deliveryCount = 0;
  
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(messageString);
        deliveryCount++;
      } catch (err) {
        console.error('Error broadcasting message:', err);
      }
    }
  });
  
  console.log(`Message broadcast to ${deliveryCount} clients`);
}

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
      role: userRole,
      users: getAllUsers()
    }
  }));
  
  // Broadcast to all clients about new user
  notifyUserStatusChange('user-connected', metadata);
  
  // Handle incoming messages
  ws.on('message', async (messageAsString) => {
    try {
      const message = JSON.parse(messageAsString);
      const metadata = clients.get(ws);
      
      console.log(`Received message from ${metadata.name}: ${JSON.stringify(message)}`);
      
      // Ensure the message has required fields
      if (!message.text) {
        console.error('Message missing required field: text');
        return;
      }
      
      // Create standard message format
      const formattedMessage = {
        type: 'chat-message',
        data: {
          id: metadata.id,
          senderId: metadata.id,
          senderName: metadata.name,
          senderRole: metadata.role,
          color: metadata.color,
          text: message.text,
          timestamp: message.timestamp || new Date().toISOString(),
          chatId: message.chatId || createChatId(metadata.id, message.recipientId),
          recipientId: message.recipientId || null
        }
      };
      
      // Skip duplicate messages
      if (isDuplicateMessage(formattedMessage.data)) {
        console.log('Skipping duplicate message');
        return;
      }
      
      // Save message to database
      const savedMessage = await saveMessageToDatabase(formattedMessage.data);
      if (!savedMessage) {
        console.error('Failed to save message to database');
        // Send error message back to sender
        ws.send(JSON.stringify({
          type: 'error',
          data: {
            message: 'Failed to save message'
          }
        }));
        return;
      }
      
      // Update the message with saved data
      formattedMessage.data.messageId = savedMessage.messageId;
      
      // If the message has a specific recipient, send it only to them
      if (message.recipientId) {
        console.log(`Sending direct message to ${message.recipientId}`);
        const success = sendDirectMessage(formattedMessage, metadata.id, message.recipientId);
        if (!success) {
          console.log(`Recipient ${message.recipientId} not found or offline`);
          // Message will still be saved and delivered when recipient connects
        }
      } else {
        // Otherwise broadcast to all
        broadcastMessage(formattedMessage);
      }
    } catch (e) {
      console.error('Error processing message:', e);
      // Send error message back to sender
      ws.send(JSON.stringify({
        type: 'error',
        data: {
          message: 'Error processing message'
        }
      }));
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

// API route to get conversations for a user
app.get('/api/conversations/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Find all conversations where this user is a participant
    const conversations = await Conversation.find({
      'participants.userId': userId
    }).sort({ lastMessageTime: -1 });
    
    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// API route to get messages for a specific conversation
app.get('/api/messages/:chatId', async (req, res) => {
  try {
    const chatId = req.params.chatId;
    const limit = parseInt(req.query.limit) || 50;
    const skip = parseInt(req.query.skip) || 0;
    
    // Find messages for this conversation, with pagination
    const messages = await Message.find({ chatId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);
    
    res.json(messages.reverse()); // Reverse to get chronological order
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Start the server
server.listen(PORT, () => {
  console.log(`Chat server is running on http://localhost:${PORT}`);
});
