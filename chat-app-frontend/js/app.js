const messages = document.getElementById('messages'); 
const inputField = document.getElementById('input-field'); 
const sendButton = document.getElementById('send-button'); 

// Connect to the WebSocket server
const socket = io('http://localhost:7070'); 

// Listen for the 'chatResponse' event from the server
socket.on('chatResponse', (message) => {
    addMessage(message, 'bot-message');
    messages.scrollTop = messages.scrollHeight;
});

// Listen for the 'error' event from the server
socket.on('error', (error) => {
    console.error('Server error:', error);
    addMessage('An error occurred: ' + error.error, 'bot-message');
});

// Send a message when the send button is clicked or Enter is pressed
sendButton.addEventListener('click', sendMessage);
inputField.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
    // Getting the message at the time of sending to not update the variable every change
    const messageText = inputField.value.trim();
    if (!messageText) return;

    addMessage(messageText, 'user-message');
    inputField.value = '';

    // Send the message to the server
    socket.emit('chatMessage', {
        messages: [{ role: 'user', content: messageText }]
    });
}

function addMessage(text, className) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${className}`;
    messageElement.innerText = text;
    messages.appendChild(messageElement);
}