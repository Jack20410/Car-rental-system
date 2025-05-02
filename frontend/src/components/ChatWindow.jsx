import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useChat } from '../context/ChatContext';
import ChatMessage from './ChatMessage';
import ChatRentalInfo from './ChatRentalInfo';
import { useAuth } from '../context/AuthContext';
import '../styles/chat.css';

const ChatWindow = ({ chatId, recipient }) => {
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [messageInput, setMessageInput] = useState('');
  const [isAtBottom, setIsAtBottom] = useState(true);
  const { messages, sendMessage, connected, loadChatMessages, markMessagesAsRead } = useChat();
  const [localMessages, setLocalMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const previousChatIdRef = useRef(null);
  const handledMessageIds = useRef(new Set());
  
  // Determine if the current user is a provider
  const isProvider = user?.role === 'car_provider';
  
  // Handle scroll events to determine if we're at the bottom
  const handleScroll = useCallback(() => {
    if (!chatContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 10;
    setIsAtBottom(isBottom);
  }, []);
  
  // Scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current && isAtBottom && chatContainerRef.current) {
      // Use requestAnimationFrame for smoother scrolling
      requestAnimationFrame(() => {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      });
    }
  }, [isAtBottom]);
  
  // Load messages when chat changes
  useEffect(() => {
    if (!chatId) {
      // Clear local messages when no chat is selected
      setLocalMessages([]);
      handledMessageIds.current.clear();
      return;
    }

    const loadMessages = async () => {
      setIsLoading(true);
      try {
        // Always reload messages when chat changes
        console.log(`ChatWindow: Loading fresh data for chat ${chatId}`);
        await loadChatMessages(chatId);
        previousChatIdRef.current = chatId;
        
        // Mark messages as read when opening a chat
        markMessagesAsRead(chatId);
      } catch (error) {
        console.error("Error loading chat messages:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Clear previous messages before loading new ones
    setLocalMessages([]);
    handledMessageIds.current.clear();
    loadMessages();
  }, [chatId, loadChatMessages, markMessagesAsRead]);
  
  // Synchronize messages from context when they change
  useEffect(() => {
    if (!chatId) {
      setLocalMessages([]);
      return;
    }
    
    const contextMessages = messages[chatId] || [];
    // console.log(`ChatWindow: Syncing ${contextMessages.length} messages for chat ID ${chatId}`);
    
    if (contextMessages.length > 0) {
      // Set messages from context, sorted by timestamp
      setLocalMessages(contextMessages.sort((a, b) => 
        new Date(a.timestamp) - new Date(b.timestamp)
      ));
      // Force scroll to bottom after messages load
      setTimeout(scrollToBottom, 100);
    }
  }, [chatId, messages, scrollToBottom]);
  
  // Listen for new messages via events
  const handleNewMessage = useCallback((event) => {
    const message = event.detail;
    if (!message || message.chatId !== chatId) return;
    
    // Generate a unique ID for the message to avoid duplicates
    const messageId = `${message.senderId}_${message.timestamp}_${message.text}`;
    
    // Skip if we've already handled this message
    if (handledMessageIds.current.has(messageId)) {
      return;
    }
    
    console.log("ChatWindow received new message event:", message);
    handledMessageIds.current.add(messageId);
    
    setLocalMessages(prev => {
      // Skip duplicates
      const isDuplicate = prev.some(m => 
        m.senderId === message.senderId && 
        m.text === message.text && 
        m.timestamp === message.timestamp
      );
      
      if (isDuplicate) return prev;
      
      // Add new message to the list and sort by timestamp
      return [...prev, message].sort((a, b) => 
        new Date(a.timestamp) - new Date(b.timestamp)
      );
    });
    
    // We should avoid calling markMessagesAsRead here to prevent the infinite loop
    // The markMessagesAsRead is already called when the chat is loaded initially
  }, [chatId]);
  
  // Add and remove event listener for chat messages
  useEffect(() => {
    window.addEventListener('chat-message', handleNewMessage);
    return () => {
      window.removeEventListener('chat-message', handleNewMessage);
    };
  }, [handleNewMessage]);
  
  // Scroll to bottom on mount and when messages change
  useEffect(() => {
    scrollToBottom();
  }, [localMessages, scrollToBottom]);
  
  // Mark messages as read when activeChat changes or new messages arrive in current chat
  useEffect(() => {
    if (chatId) {
      markMessagesAsRead(chatId);
    }
  }, [chatId, markMessagesAsRead]);
  
  // Add scroll event listener
  useEffect(() => {
    const container = chatContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);
  
  // Handle message submission
  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedMessage = messageInput.trim();
    
    if (!trimmedMessage || !connected) return;
    
    const success = sendMessage({
      content: trimmedMessage,
      recipientId: recipient?._id,
      chatId: chatId
    });
    
    if (success) {
      setMessageInput('');
      // Force scroll to bottom when sending a message
      setIsAtBottom(true);
      setTimeout(scrollToBottom, 100);
    }
  };
  
  // Clear handled message IDs when chat changes
  useEffect(() => {
    handledMessageIds.current.clear();
  }, [chatId]);
  
  return (
    <div className="chat-main-container border rounded-lg shadow-sm max-w-full flex flex-col h-full">
      {/* Active Rental Information */}
      {user && recipient && (
        <div className="flex-shrink-0">
          <ChatRentalInfo 
            userId={user._id} 
            recipientId={recipient._id} 
            isProvider={isProvider}
          />
        </div>
      )}
      
      <div 
        ref={chatContainerRef}
        className="chat-message-container flex-grow overflow-y-auto overflow-x-hidden"
        style={{ 
          minHeight: '300px', 
          maxHeight: 'calc(100vh - 250px)',
          width: '100%',
          position: 'relative'
        }}
      >
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : localMessages.length === 0 ? (
          <div className="flex justify-center items-center h-full text-gray-500">
            No messages yet. Start a conversation!
          </div>
        ) : (
          <div className="messages-list space-y-2 px-2 w-full">
            {localMessages.map((message, index) => (
              <div key={`${message.senderId}_${message.timestamp}_${index}`} className="message-wrapper-container">
                <ChatMessage 
                  message={message}
                />
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="chat-input-container flex-shrink-0 flex gap-2 p-3 border-t">
        <input
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          placeholder="Type a message..."
          className="chat-input flex-grow p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={!connected || isLoading}
        />
        <button
          type="submit"
          disabled={!connected || !messageInput.trim() || isLoading}
          className="chat-send-button p-2 rounded-full flex items-center justify-center"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path 
              fillRule="evenodd" 
              d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" 
              clipRule="evenodd" 
            />
          </svg>
        </button>
      </form>
    </div>
  );
};

export default ChatWindow; 