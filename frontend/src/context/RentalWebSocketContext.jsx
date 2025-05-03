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
    // Khởi tạo WebSocket connection
    const ws = new WebSocket('ws://localhost:3003'); // Port của rental service

    ws.onopen = () => {
      console.log('WebSocket Connected');
      setIsConnected(true);
    };

    ws.onclose = () => {
      console.log('WebSocket Disconnected');
      setIsConnected(false);
      // Thử kết nối lại sau 3 giây
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
      
      // Dispatch custom event để các component có thể lắng nghe
      const customEvent = new CustomEvent('rentalStatusUpdate', { 
        detail: message 
      });
      window.dispatchEvent(customEvent);
    };

    setSocket(ws);

    // Cleanup khi component unmount
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  // Hàm gửi update qua WebSocket
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