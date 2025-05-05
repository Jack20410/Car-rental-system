import React, { createContext, useContext, useEffect, useState } from 'react';

const RentalWebSocketContext = createContext();

export const useRentalWebSocket = () => {
  const context = useContext(RentalWebSocketContext);
  if (!context) {
    throw new Error('useRentalWebSocket must be used within a RentalWebSocketProvider');
  }
  return context;
};

export const RentalWebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);

  useEffect(() => {
    // Initialize WebSocket connection
    const ws = new WebSocket('ws://localhost:3003');

    ws.onopen = () => {
      console.log('WebSocket Connected');
      setIsConnected(true);
    };

    ws.onclose = () => {
      console.log('WebSocket Disconnected');
      setIsConnected(false);
      // Try to reconnect after 3 seconds
      setTimeout(() => {
        setSocket(new WebSocket('ws://localhost:3003'));
      }, 3000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket Error:', error);
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('Received WebSocket message:', message);
      setLastMessage(message);
      
      // Dispatch custom event for components to listen
      const customEvent = new CustomEvent('rentalStatusUpdate', { 
        detail: message 
      });
      window.dispatchEvent(customEvent);
    };

    setSocket(ws);

    // Cleanup on component unmount
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  // Function to send updates via WebSocket
  const sendRentalUpdate = (updateData) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(updateData));
    } else {
      console.error('WebSocket is not connected');
    }
  };

  const value = {
    isConnected,
    lastMessage,
    sendRentalUpdate
  };

  return (
    <RentalWebSocketContext.Provider value={value}>
      {children}
    </RentalWebSocketContext.Provider>
  );
}; 