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
            socket.send(JSON.stringify({
                text: message
            }));
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
                addChatMessage(data.data);
                break;
        }
    }
    
    // Add chat message to the UI
    function addChatMessage(messageData) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${messageData.id === userId ? 'my-message' : 'other-message'}`;
        
        const timestamp = new Date(messageData.timestamp).toLocaleTimeString();
        
        // Create message content
        messageElement.innerHTML = `
            <div class="sender" style="color: ${messageData.color}">
                ${messageData.id}
                <span class="time">${timestamp}</span>
            </div>
            <div class="text">${escapeHtml(messageData.text)}</div>
        `;
        
        messagesContainer.appendChild(messageElement);
        scrollToBottom();
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
}); 