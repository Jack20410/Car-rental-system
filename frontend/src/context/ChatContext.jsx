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
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3;
  const wsInstance = useRef(null);
  const isConnecting = useRef(false);
  const reconnectTimeout = useRef(null);
  const connectingTimeout = useRef(null);
  // Keep track of processed message IDs to avoid duplicates
  const processedMessages = useRef(new Set());

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
    
    // Set a timeout to reset connecting state if connection attempt hangs
    connectingTimeout.current = setTimeout(() => {
      console.log('Connection attempt timed out');
      isConnecting.current = false;
    }, 10000); // 10 second timeout
    
    try {
      // Create WebSocket connection
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      
      // Ensure all query parameters are properly encoded
      const userId = encodeURIComponent(user._id);
      const userName = encodeURIComponent(user.fullName || 'User');
      const userRole = encodeURIComponent(user.role || 'user');
      
      const wsUrl = `${protocol}//localhost:3005?userId=${userId}&name=${userName}&role=${userRole}`;
      
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
          
          // Use increasing backoff for reconnect attempts (1s, 3s, 5s)
          const delay = 1000 + (reconnectAttempts.current * 2000);
          reconnectTimeout.current = setTimeout(() => {
            connectWebSocket();
          }, delay);
        } else {
          console.error('Failed to connect to chat server after multiple attempts');
          setConnectionError(true);
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

  // Generate a unique message ID
  const generateMessageId = (data) => {
    return `${data.senderId}_${data.timestamp}_${data.text.substring(0, 10)}`;
  };

  // Handle incoming WebSocket messages
  const handleIncomingMessage = useCallback((data) => {
    if (!data || !data.type) return;
    
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
            return prevMessages;
          }
          
          // Mark this message as processed
          processedMessages.current.add(messageId);
          
          // Add to the conversation
          const chatId = messageData.chatId;
          const newMessages = { ...prevMessages };
          
          if (!newMessages[chatId]) {
            newMessages[chatId] = [];
          }
          
          newMessages[chatId] = [...newMessages[chatId], messageData];
          return newMessages;
        });
        break;
        
      default:
        break;
    }
  }, []);

  // Send message through WebSocket
  const sendMessage = useCallback((message) => {
    // Check if we have a valid socket connection
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      // If we're not connected, store the message locally and show a notice
      if (!currentChat) {
        toast.error('No active chat selected');
        return false;
      }
      
      // Add message to local state anyway, but mark it as pending
      const timestamp = new Date().toISOString();
      const localMessage = {
        text: message.content,
        recipientId: message.recipientId,
        senderId: user._id,
        chatId: currentChat.id,
        timestamp,
        id: user._id,
        name: user.fullName || 'You',
        color: '#4a69bd',
        pending: true
      };
      
      setMessages(prevMessages => {
        const chatId = currentChat.id;
        const newMessages = { ...prevMessages };
        
        if (!newMessages[chatId]) {
          newMessages[chatId] = [];
        }
        
        // Add our message to local state
        newMessages[chatId] = [...newMessages[chatId], localMessage];
        return newMessages;
      });
      
      toast.warning('Message saved but not sent - connection issue');
      
      // Try to reconnect
      if (!isConnecting.current && reconnectAttempts.current < maxReconnectAttempts) {
        connectWebSocket();
      }
      
      return true; // Return true so the input field clears
    }
    
    try {
      const timestamp = new Date().toISOString();
      const messageData = {
        text: message.content,
        recipientId: message.recipientId,
        senderId: user._id,
        chatId: currentChat.id,
        timestamp: timestamp
      };
      
      socket.send(JSON.stringify(messageData));
      
      // Also add message to our local state
      setMessages(prevMessages => {
        const chatId = currentChat.id;
        const newMessages = { ...prevMessages };
        
        if (!newMessages[chatId]) {
          newMessages[chatId] = [];
        }
        
        // Create a complete message object for local state
        const localMessage = {
          ...messageData,
          id: user._id,
          name: user.fullName || 'You',
          color: '#4a69bd'
        };
        
        // Generate a unique ID for this message
        const messageId = generateMessageId(localMessage);
        
        // Add to processed messages so we don't duplicate if we get it back from server
        processedMessages.current.add(messageId);
        
        // Add our sent message to the local state (only if it doesn't exist)
        const messageExists = newMessages[chatId].some(
          msg => generateMessageId(msg) === messageId
        );
        
        if (!messageExists) {
          newMessages[chatId] = [...newMessages[chatId], localMessage];
        }
        
        return newMessages;
      });
      
      return true;
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Failed to send message');
      return false;
    }
  }, [socket, currentChat, user, connectWebSocket]);

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
        return { ...prevMessages, [chatId]: [] };
      }
      return prevMessages;
    });
    
    return chatId;
  }, [user]);

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
    reconnect
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}; 