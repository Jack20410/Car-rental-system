import React from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/chat.css';

const ChatMessage = ({ message }) => {
  const { user } = useAuth();
  const isMyMessage = message.senderId === user?._id;
  
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`message-wrapper my-2 flex ${isMyMessage ? 'justify-end' : 'justify-start'} w-full overflow-hidden`}>
      {/* Avatar for received messages */}
      {!isMyMessage && (
        <div 
          className="avatar-circle flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center mr-2" 
          style={{ backgroundColor: message.color || '#4a69bd' }}
        >
          <span className="text-white text-xs font-medium">
            {(message.name || 'User').charAt(0).toUpperCase()}
          </span>
        </div>
      )}
      
      <div className={`message-bubble max-w-[50%] rounded-lg px-3 py-2 ${
        isMyMessage 
          ? 'sender-bubble' 
          : 'receiver-bubble'
      }`}>
        {/* Sender name (only show on received messages) */}
        {!isMyMessage && (
          <div className="font-medium text-xs mb-1 truncate">
            {message.name || 'User'}
          </div>
        )}
        
        {/* Message content */}
        <div className="message-content break-words overflow-hidden">
          <p className="text-sm overflow-hidden text-ellipsis">{message.text}</p>
        </div>
        
        {/* Timestamp and status */}
        <div className={`message-timestamp text-right mt-1 flex justify-end items-center ${
          isMyMessage ? 'text-blue-100' : 'text-gray-500'
        }`}>
          <span className="text-xs">
            {formatTime(message.timestamp)}
          </span>
          
          {/* Message status indicator */}
          {isMyMessage && message.pending && (
            <div className="typing-indicator ml-1">
              <span></span>
              <span></span>
              <span></span>
            </div>
          )}
          
          {/* Delivery status indicator */}
          {isMyMessage && !message.pending && (
            <span className="message-status-icon ml-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </span>
          )}
        </div>
      </div>
      
      {/* Avatar for sent messages */}
      {isMyMessage && (
        <div className="avatar-circle flex-shrink-0 h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center ml-2">
          <span className="text-white text-xs font-medium">
            {(user?.name || 'You').charAt(0).toUpperCase()}
          </span>
        </div>
      )}
    </div>
  );
};

export default React.memo(ChatMessage); 