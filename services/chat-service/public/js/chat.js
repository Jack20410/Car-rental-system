document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const messagesContainer = document.getElementById('messages');
    const usersList = document.getElementById('users-list');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const userIdElement = document.getElementById('user-id');
    
    // User data
    let userId = null;
    let userColor = null;
    let connectedUsers = [];
    let currentChatId = null; // Track current chat ID
    
    // WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
    const wsUrl = `${protocol}${window.location.host}`;
    const socket = new WebSocket(wsUrl);
    
    // Connection opened
    socket.addEventListener('open', (event) => {
        console.log('Connected to WebSocket server');
        addSystemMessage('Connected to chat server');
    });
    
    // Listen for messages
    socket.addEventListener('message', (event) => {
        const data = JSON.parse(event.data);
        handleMessage(data);
    });
    
    // Connection closed
    socket.addEventListener('close', (event) => {
        addSystemMessage('Disconnected from chat server');
        console.log('Disconnected from WebSocket server');
    });
    
    // Connection error
    socket.addEventListener('error', (event) => {
        addSystemMessage('Connection error occurred');
        console.error('WebSocket error:', event);
    });
    
    // Send message on button click
    sendButton.addEventListener('click', sendMessage);
    
    // Send message on Enter key
    messageInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Send message function
    function sendMessage() {
        const message = messageInput.value.trim();
        if (message && socket.readyState === WebSocket.OPEN) {
            const messageData = {
                text: message,
                timestamp: new Date().toISOString()
            };
            
            // If we have a currentChatId, include it
            if (currentChatId) {
                messageData.chatId = currentChatId;
            }
            
            socket.send(JSON.stringify(messageData));
            messageInput.value = '';
        }
    }
    
    // Handle incoming messages
    function handleMessage(data) {
        switch (data.type) {
            case 'connection':
                // Save user info
                userId = data.data.id;
                userColor = data.data.color;
                userIdElement.textContent = userId;
                
                // Update connected users
                connectedUsers = data.data.users;
                updateUsersList();
                
                addSystemMessage(data.data.message);
                
                // Load conversation history after connecting
                loadConversations();
                break;
                
            case 'user-connected':
                // Add new user to the list
                const newUser = {
                    id: data.data.id,
                    color: data.data.color
                };
                
                if (!connectedUsers.some(user => user.id === newUser.id)) {
                    connectedUsers.push(newUser);
                    updateUsersList();
                }
                
                addSystemMessage(data.data.message);
                break;
                
            case 'user-disconnected':
                // Remove user from the list
                connectedUsers = connectedUsers.filter(user => user.id !== data.data.id);
                updateUsersList();
                
                addSystemMessage(data.data.message);
                break;
                
            case 'chat-message':
                // Update currentChatId if not set yet
                if (!currentChatId) {
                    currentChatId = data.data.chatId;
                }
                
                // Only add the message if it's for our current chat
                if (data.data.chatId === currentChatId) {
                    addChatMessage(data.data);
                } else {
                    // If it's not for our current chat, show a notification
                    showMessageNotification(data.data);
                }
                break;
        }
    }
    
    // Add chat message to the UI
    function addChatMessage(messageData) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${messageData.senderId === userId ? 'my-message' : 'other-message'}`;
        
        const timestamp = new Date(messageData.timestamp).toLocaleTimeString();
        
        // Create message content
        messageElement.innerHTML = `
            <div class="sender" style="color: ${messageData.color || '#000'}">
                ${messageData.senderName || messageData.senderId}
                <span class="time">${timestamp}</span>
            </div>
            <div class="text">${escapeHtml(messageData.text)}</div>
        `;
        
        messagesContainer.appendChild(messageElement);
        scrollToBottom();
    }
    
    // Show notification for messages from other chats
    function showMessageNotification(messageData) {
        // Create a notification element
        const notification = document.createElement('div');
        notification.className = 'message-notification';
        notification.textContent = `New message from ${messageData.senderName || messageData.senderId}`;
        
        // Add to body
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    // Add system message
    function addSystemMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message system-message';
        messageElement.textContent = message;
        
        messagesContainer.appendChild(messageElement);
        scrollToBottom();
    }
    
    // Update the users list in the UI
    function updateUsersList() {
        usersList.innerHTML = '';
        
        connectedUsers.forEach(user => {
            const userElement = document.createElement('li');
            
            const userColorSpan = document.createElement('span');
            userColorSpan.className = 'user-color';
            userColorSpan.style.backgroundColor = user.color;
            
            const userIdSpan = document.createElement('span');
            userIdSpan.textContent = user.id === userId ? `${user.id} (You)` : user.id;
            
            userElement.appendChild(userColorSpan);
            userElement.appendChild(userIdSpan);
            
            if (user.id === userId) {
                userElement.style.fontWeight = 'bold';
            }
            
            usersList.appendChild(userElement);
        });
    }
    
    // Scroll messages container to the bottom
    function scrollToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Load user's conversations
    async function loadConversations() {
        try {
            if (!userId) return;
            
            const response = await fetch(`/api/conversations/${userId}`);
            if (!response.ok) throw new Error('Failed to fetch conversations');
            
            const conversations = await response.json();
            
            if (conversations.length > 0) {
                // Use the first conversation by default
                currentChatId = conversations[0].chatId;
                
                // Load messages for this conversation
                loadMessages(currentChatId);
            }
        } catch (error) {
            console.error('Error loading conversations:', error);
            addSystemMessage('Failed to load conversations');
        }
    }
    
    // Load messages for a chat
    async function loadMessages(chatId) {
        try {
            // Clear current messages
            messagesContainer.innerHTML = '';
            
            // Show loading message
            addSystemMessage('Loading messages...');
            
            const response = await fetch(`/api/messages/${chatId}`);
            if (!response.ok) throw new Error('Failed to fetch messages');
            
            const messages = await response.json();
            
            // Remove loading message
            messagesContainer.innerHTML = '';
            
            if (messages.length === 0) {
                addSystemMessage('No messages yet. Start a conversation!');
            } else {
                // Display all messages
                messages.forEach(message => {
                    addChatMessage({
                        senderId: message.senderId,
                        senderName: message.senderName,
                        text: message.text,
                        timestamp: message.timestamp,
                        color: connectedUsers.find(u => u.id === message.senderId)?.color || '#000'
                    });
                });
            }
        } catch (error) {
            console.error('Error loading messages:', error);
            messagesContainer.innerHTML = '';
            addSystemMessage('Failed to load messages');
        }
    }
}); 