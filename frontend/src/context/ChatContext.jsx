import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState({});
  const [currentChat, setCurrentChat] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [connectionError, setConnectionError] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState({});
  const [totalUnread, setTotalUnread] = useState(0);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const wsInstance = useRef(null);
  const isConnecting = useRef(false);
  const reconnectTimeout = useRef(null);
  const connectingTimeout = useRef(null);
  // Keep track of processed message IDs to avoid duplicates
  const processedMessages = useRef(new Set());
  const [conversationsLoaded, setConversationsLoaded] = useState(false);

  // Load persisted connection state from localStorage
  useEffect(() => {
    try {
      const persistedState = localStorage.getItem('chat_connection_state');
      if (persistedState) {
        const { lastConnectAttempt, attemptCount } = JSON.parse(persistedState);
        
        // Only use persisted attempts if they were from the last 2 minutes
        const lastAttemptTime = new Date(lastConnectAttempt);
        const now = new Date();
        const timeDiff = (now - lastAttemptTime) / 1000 / 60; // in minutes
        
        if (timeDiff <= 2) {
          reconnectAttempts.current = attemptCount;
          console.log(`Loaded persisted reconnect attempts: ${attemptCount}`);
        } else {
          // Reset if last attempt was more than 2 minutes ago
          reconnectAttempts.current = 0;
          console.log('Resetting reconnect attempts due to time elapsed');
          localStorage.removeItem('chat_connection_state');
        }
      }
    } catch (error) {
      console.error('Error loading persisted connection state:', error);
    }
  }, []);

  // Load unread messages from localStorage
  useEffect(() => {
    try {
      const storedUnread = localStorage.getItem('unread_messages');
      if (storedUnread && user?._id) {
        const parsedUnread = JSON.parse(storedUnread);
        setUnreadMessages(parsedUnread);
        
        // Calculate total unread count
        const total = Object.values(parsedUnread).reduce((sum, count) => sum + count, 0);
        setTotalUnread(total);
      }
    } catch (error) {
      console.error('Error loading unread messages:', error);
    }
  }, [user]);

  // Clear any existing timeouts
  const clearTimeouts = () => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }
    if (connectingTimeout.current) {
      clearTimeout(connectingTimeout.current);
      connectingTimeout.current = null;
    }
  };

  // Connect to WebSocket server
  const connectWebSocket = useCallback(() => {
    if (!user || !user._id) return;
    
    // Don't try to connect if already connecting
    if (isConnecting.current) {
      console.log('Already attempting to connect, skipping duplicate connection attempt');
      return;
    }
    
    // Clear any existing timeouts
    clearTimeouts();
    
    // Set connecting state
    isConnecting.current = true;
    
    // Persist connection attempt state to localStorage
    try {
      localStorage.setItem('chat_connection_state', JSON.stringify({
        lastConnectAttempt: new Date().toISOString(),
        attemptCount: reconnectAttempts.current
      }));
    } catch (error) {
      console.error('Error persisting connection state:', error);
    }
    
    // Set a timeout to reset connecting state if connection attempt hangs
    connectingTimeout.current = setTimeout(() => {
      console.log('Connection attempt timed out');
      isConnecting.current = false;
    }, 10000); // 10 second timeout
    
    try {
      // Create WebSocket connection
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = import.meta.env.VITE_CHAT_SERVICE_URL || window.location.hostname;
      const port = import.meta.env.VITE_CHAT_SERVICE_PORT || '3005';
      
      // Ensure all query parameters are properly encoded
      const userId = encodeURIComponent(user._id);
      const userName = encodeURIComponent(user.fullName || 'User');
      const userRole = encodeURIComponent(user.role || 'user');
      
      const wsUrl = `${protocol}//${host}:${port}?userId=${userId}&name=${userName}&role=${userRole}`;
      
      console.log('Connecting to chat server:', wsUrl);
      
      // Close any existing connection first
      if (wsInstance.current && wsInstance.current.readyState !== WebSocket.CLOSED) {
        try {
          wsInstance.current.close();
        } catch (e) {
          console.error('Error closing existing connection:', e);
        }
      }
      
      const newSocket = new WebSocket(wsUrl);
      wsInstance.current = newSocket;
      
      newSocket.onopen = () => {
        console.log('Connected to chat server');
        setConnected(true);
        setConnectionError(false);
        reconnectAttempts.current = 0;
        isConnecting.current = false;
        clearTimeouts();
        setSocket(newSocket);
        
        // Clear persisted connection state on successful connection
        try {
          localStorage.removeItem('chat_connection_state');
        } catch (error) {
          console.error('Error clearing persisted connection state:', error);
        }
        
        // Load user conversations after connection is established
        loadUserConversations();
      };
      
      newSocket.onclose = (event) => {
        console.log('Disconnected from chat server:', event);
        setConnected(false);
        setSocket(null);
        
        // Clear the connecting timeout
        clearTimeouts();
        
        // Reset connecting state
        isConnecting.current = false;
        
        // Only attempt to reconnect if we haven't exceeded max attempts and
        // if the close wasn't initiated by the user (e.g., navigating away)
        if (reconnectAttempts.current < maxReconnectAttempts) {
          console.log(`Reconnecting, attempt ${reconnectAttempts.current + 1} of ${maxReconnectAttempts}...`);
          reconnectAttempts.current++;
          
          // Persist updated attempt count
          try {
            localStorage.setItem('chat_connection_state', JSON.stringify({
              lastConnectAttempt: new Date().toISOString(),
              attemptCount: reconnectAttempts.current
            }));
          } catch (error) {
            console.error('Error persisting connection state:', error);
          }
          
          // Use increasing backoff for reconnect attempts
          const delay = 1000 + (reconnectAttempts.current * 2000);
          reconnectTimeout.current = setTimeout(() => {
            connectWebSocket();
          }, delay);
        } else {
          console.error('Failed to connect to chat server after multiple attempts');
          setConnectionError(true);
          
          // Allow the user to try again in 30 seconds
          reconnectTimeout.current = setTimeout(() => {
            console.log('Auto-resetting reconnect attempts after timeout');
            reconnectAttempts.current = 0;
            // Clear persisted state after timeout
            try {
              localStorage.removeItem('chat_connection_state');
            } catch (error) {
              console.error('Error clearing persisted connection state:', error);
            }
          }, 30000); // 30 seconds
        }
      };
      
      newSocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        // Don't set connection error here as onclose will be called next
      };
      
      newSocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleIncomingMessage(data);
        } catch (err) {
          console.error('Error parsing message:', err);
        }
      };
    } catch (err) {
      console.error('Error establishing WebSocket connection:', err);
      setConnectionError(true);
      isConnecting.current = false;
      clearTimeouts();
    }
  }, [user]);

  // Connect when user changes
  useEffect(() => {
    if (user && user._id) {
      // Reset reconnect attempts when user changes
      reconnectAttempts.current = 0;
      connectWebSocket();
    } else {
      // Clear all chat state when user logs out
      setMessages({});
      setCurrentChat(null);
      setUnreadMessages({});
      setTotalUnread(0);
      processedMessages.current.clear();
      setConversationsLoaded(false);
      
      // Clear persisted data
      try {
        localStorage.removeItem('unread_messages');
        localStorage.removeItem('chat_connection_state');
      } catch (error) {
        console.error('Error clearing persisted chat data:', error);
      }
    }
    
    // Clean up on unmount
    return () => {
      clearTimeouts();
      if (wsInstance.current) {
        try {
          wsInstance.current.close();
        } catch (e) {
          console.error('Error closing WebSocket on unmount:', e);
        }
        wsInstance.current = null;
      }
    };
  }, [connectWebSocket, user]);

  // Load user conversations from the server
  const loadUserConversations = useCallback(async () => {
    if (!user || !user._id || conversationsLoaded) return;
    
    try {
      console.log('Loading conversations for user:', user._id);
      const host = import.meta.env.VITE_CHAT_SERVICE_URL || window.location.hostname;
      const port = import.meta.env.VITE_CHAT_SERVICE_PORT || '3005';
      const response = await fetch(`http://${host}:${port}/api/conversations/${user._id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }
      
      const conversations = await response.json();
      console.log('Loaded conversations:', conversations);
      
      // Initialize local message state with conversation data
      if (conversations && conversations.length > 0) {
        // Load all conversations into memory
        const newMessages = { ...messages };
        
        for (const conversation of conversations) {
          // Create chat ID
          const chatId = conversation.chatId;
          
          // Initialize an empty array for this chat if it doesn't exist
          if (!newMessages[chatId]) {
            newMessages[chatId] = [];
          }
          
          // Load messages for this conversation
          await loadChatMessages(chatId, newMessages);
        }
        
        setConversationsLoaded(true);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  }, [user, conversationsLoaded, messages]);
  
  // Load messages for a specific chat
  const loadChatMessages = useCallback(async (chatId) => {
    if (!chatId || !user?._id) return [];
    
    try {
      console.log('Loading messages for chat:', chatId);
      const host = import.meta.env.VITE_CHAT_SERVICE_URL || window.location.hostname;
      const port = import.meta.env.VITE_CHAT_SERVICE_PORT || '3005';
      const response = await fetch(`http://${host}:${port}/api/messages/${chatId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      const chatMessages = await response.json();
      console.log(`Loaded ${chatMessages.length} messages for chat ${chatId}`);
      
      // Update the messages state with the loaded messages
      setMessages(prev => {
        const newMessages = { ...prev };
        newMessages[chatId] = chatMessages.map(msg => ({
          text: msg.text,
          senderId: msg.senderId,
          recipientId: msg.recipientId,
          timestamp: msg.timestamp,
          chatId: msg.chatId,
          name: msg.senderName,
          id: msg.senderId,
          color: msg.color || '#4a69bd'
        }));
        return newMessages;
      });
      
      return chatMessages;
    } catch (error) {
      console.error(`Error loading messages for chat ${chatId}:`, error);
      return [];
    }
  }, [user]);

  // Generate a unique message ID
  const generateMessageId = (data) => {
    return `${data.senderId}_${data.timestamp}_${data.text.substring(0, 10)}`;
  };

  // Handle incoming WebSocket messages
  const handleIncomingMessage = useCallback((data) => {
    if (!data || !data.type) return;
    
    console.log('Received WebSocket message:', data);
    
    switch (data.type) {
      case 'connection':
        setOnlineUsers(data.data?.users || []);
        break;
        
      case 'user-connected':
      case 'user-disconnected':
        setOnlineUsers(data.data?.users || []);
        break;
        
      case 'chat-message':
        // Add message to the appropriate conversation
        setMessages(prevMessages => {
          const messageData = data.data;
          if (!messageData || !messageData.chatId) return prevMessages;
          
          // Generate a unique ID for this message to prevent duplicates
          const messageId = generateMessageId(messageData);
          
          // Skip if we've already processed this message
          if (processedMessages.current.has(messageId)) {
            console.log('Skipping duplicate message:', messageId);
            return prevMessages;
          }
          
          console.log('Processing new message:', messageData);
          
          // Mark this message as processed
          processedMessages.current.add(messageId);
          
          // Add to the conversation
          const chatId = messageData.chatId;
          const newMessages = { ...prevMessages };
          
          if (!newMessages[chatId]) {
            newMessages[chatId] = [];
          }
          
          // Format the message for consistency
          const formattedMessage = {
            senderId: messageData.senderId,
            text: messageData.text,
            timestamp: messageData.timestamp,
            id: messageData.senderId,
            name: messageData.senderName || 'User',
            color: messageData.color || '#cccccc',
            chatId
          };

          // First check if this message is already in the state to avoid duplicates
          const isDuplicate = newMessages[chatId].some(msg => 
            msg.senderId === formattedMessage.senderId && 
            msg.text === formattedMessage.text && 
            msg.timestamp === formattedMessage.timestamp
          );
          
          if (!isDuplicate) {
            // Add message to conversation and sort by timestamp
            newMessages[chatId] = [...newMessages[chatId], formattedMessage]
              .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
              
            // Increment unread count if message is from someone else and not in current chat
            const isFromOther = user && formattedMessage.senderId !== user._id;
            const isNotCurrentChat = !currentChat || currentChat.id !== chatId;
            
            if (isFromOther && isNotCurrentChat) {
              setUnreadMessages(prev => {
                const newUnread = { ...prev };
                newUnread[chatId] = (newUnread[chatId] || 0) + 1;
                
                // Store updated unread counts in localStorage
                try {
                  localStorage.setItem('unread_messages', JSON.stringify(newUnread));
                } catch (error) {
                  console.error('Error storing unread messages:', error);
                }
                
                return newUnread;
              });
              
              // Update total unread count
              setTotalUnread(prev => prev + 1);
            }
          } else {
            console.log('Message already exists in state, skipping:', formattedMessage);
          }
          
          // Dispatch an event so other components can listen for new messages
          // Use a short timeout to ensure this runs after the state update
          setTimeout(() => {
            console.log('Dispatching chat-message event with payload:', formattedMessage);
            try {
              const messageEvent = new CustomEvent('chat-message', {
                detail: formattedMessage
              });
              window.dispatchEvent(messageEvent);
            } catch (error) {
              console.error('Error dispatching chat-message event:', error);
            }
          }, 0);

          return newMessages;
        });
        break;
        
      case 'error':
        console.error('WebSocket error:', data.data);
        toast.error(data.data?.message || 'Chat service error');
        break;
        
      default:
        console.warn('Unknown message type:', data.type);
    }
  }, [user]);

  // Add a function to create consistent chat IDs
  const createChatId = useCallback((senderId, recipientId) => {
    if (!senderId || !recipientId) return null;
    // Always sort IDs to ensure the same chatId regardless of who initiates
    return [senderId, recipientId].sort().join('_');
  }, []);

  // Send message function - Update to use the consistent chatId generation
  const sendMessage = useCallback((message) => {
    if (!socket || socket.readyState !== WebSocket.OPEN || !connected || !user) {
      console.error('Cannot send message: not connected');
      return false;
    }

    try {
      // Create or use existing chatId
      let chatId = message.chatId;
      if (!chatId && message.recipientId) {
        chatId = createChatId(user._id, message.recipientId);
      }

      if (!chatId) {
        console.error('Cannot send message: no valid chatId');
        return false;
      }

      const messageData = {
        text: message.content,
        timestamp: new Date().toISOString(),
        chatId: chatId,
        recipientId: message.recipientId || null
      };

      socket.send(JSON.stringify(messageData));
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }, [socket, connected, user, createChatId]);

  // Start a new chat or select an existing one
  const startChat = useCallback((recipient) => {
    if (!user || !user._id || !recipient || !recipient._id) {
      console.error('Cannot start chat - invalid user or recipient');
      return null;
    }
    
    // Create unique chat ID (smaller ID first to maintain consistency)
    const chatId = [user._id, recipient._id].sort().join('_');
    
    setCurrentChat({
      id: chatId,
      recipient: recipient
    });
    
    // Initialize messages array for this chat if it doesn't exist
    setMessages(prevMessages => {
      if (!prevMessages[chatId]) {
        // Load chat history from server
        loadChatMessages(chatId);
        return { ...prevMessages, [chatId]: [] };
      }
      return prevMessages;
    });
    
    return chatId;
  }, [user, loadChatMessages]);

  // Get messages for current chat
  const getCurrentChatMessages = useCallback(() => {
    if (!currentChat) return [];
    return messages[currentChat.id] || [];
  }, [currentChat, messages]);
  
  // Clear chat history for current chat or all chats
  const clearChatHistory = useCallback((chatId = null) => {
    processedMessages.current.clear();
    
    if (chatId) {
      setMessages(prev => {
        const newMessages = { ...prev };
        delete newMessages[chatId];
        return newMessages;
      });
    } else if (currentChat) {
      setMessages(prev => {
        const newMessages = { ...prev };
        delete newMessages[currentChat.id];
        return newMessages;
      });
    }
  }, [currentChat]);
  
  // Reset connection and reconnect
  const reconnect = useCallback(() => {
    // Reset connection state
    if (wsInstance.current) {
      try {
        wsInstance.current.close();
      } catch (e) {
        console.error('Error closing connection for reconnect:', e);
      }
      wsInstance.current = null;
    }
    
    // Clear all timeouts
    clearTimeouts();
    
    // Reset reconnect attempts
    reconnectAttempts.current = 0;
    isConnecting.current = false;
    setConnectionError(false);
    
    // Reconnect
    connectWebSocket();
  }, [connectWebSocket]);

  // Mark messages as read for a specific chat
  const markMessagesAsRead = useCallback((chatId) => {
    if (!chatId) return;
    
    // Store the current unread count for this chat before updating
    const chatUnreadCount = unreadMessages[chatId] || 0;
    
    if (chatUnreadCount === 0) return; // Skip if there are no unread messages
    
    setUnreadMessages(prev => {
      const newUnread = { ...prev };
      // Remove this chat from unread
      delete newUnread[chatId];
      
      // Update localStorage
      try {
        localStorage.setItem('unread_messages', JSON.stringify(newUnread));
      } catch (error) {
        console.error('Error storing unread messages:', error);
      }
      
      return newUnread;
    });
    
    // Update total count
    setTotalUnread(prev => Math.max(0, prev - chatUnreadCount));
  }, [unreadMessages]);

  // Update when current chat changes to mark messages as read
  useEffect(() => {
    if (currentChat && currentChat.id) {
      // Use a small delay to avoid state update conflicts
      const timerId = setTimeout(() => {
        markMessagesAsRead(currentChat.id);
      }, 100);
      
      return () => clearTimeout(timerId);
    }
  }, [currentChat, markMessagesAsRead]);

  const value = {
    connected,
    connectionError,
    currentChat,
    messages,
    onlineUsers,
    sendMessage,
    startChat,
    getCurrentChatMessages,
    setCurrentChat,
    clearChatHistory,
    reconnect,
    loadChatMessages,
    createChatId,
    unreadMessages,
    totalUnread,
    markMessagesAsRead
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

// Create a custom hook to get chat messages with real-time updates
export const useMessages = (chatId) => {
  const { messages, currentChat } = useChat();
  const [chatMessages, setChatMessages] = useState([]);
  
  // Initialize messages from context
  useEffect(() => {
    if (!chatId) return;
    
    // Get messages for this chat from context
    const currentMessages = messages[chatId] || [];
    setChatMessages(currentMessages);
    
    // Listen for message updates
    const handleNewMessage = (event) => {
      const { detail } = event;
      if (detail && detail.chatId === chatId) {
        console.log('Received new message for chat:', chatId, detail.message);
        
        setChatMessages(prev => {
          // Check if we already have this message to prevent duplicates
          const exists = prev.some(msg => 
            msg.senderId === detail.message.senderId && 
            msg.timestamp === detail.message.timestamp &&
            msg.text === detail.message.text
          );
          
          if (!exists) {
            // Sort messages by timestamp
            const newMessages = [...prev, detail.message].sort((a, b) => 
              new Date(a.timestamp) - new Date(b.timestamp)
            );
            return newMessages;
          }
          return prev;
        });
      }
    };
    
    // Listen for message events
    window.addEventListener('chat-message', handleNewMessage);
    
    return () => {
      window.removeEventListener('chat-message', handleNewMessage);
    };
  }, [chatId, messages]);
  
  // Update messages when context messages change
  useEffect(() => {
    if (!chatId) return;
    
    const currentMessages = messages[chatId] || [];
    if (currentMessages.length > 0) {
      setChatMessages(currentMessages);
    }
  }, [chatId, messages]);
  
  return chatMessages;
}; 