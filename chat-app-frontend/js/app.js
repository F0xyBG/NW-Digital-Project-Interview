/* global io */ //ESLint directive to avoid "io is not defined" error

const messages = document.getElementById('messages');
const inputField = document.getElementById('input-field');
const sendButton = document.getElementById('send-button');
const jsonInput = document.getElementById('json-input');
const sendJsonButton = document.getElementById('send-json-button');

// Load the current flow from the server when the page loads
fetch('http://localhost:7070/api/getFlow')
  .then((response) => {
    if (!response.ok) {
      throw new Error('Failed to fetch the current flow');
    }
    return response.json();
  })
  .then((data) => {
    if (data && data.length > 0) {
      jsonInput.value = data[0].Json_flow;
    } else {
      jsonInput.value = '';
    }
  })
  .catch((error) => {
    console.error('Error loading current flow:', error);
    alert('Failed to load the current flow.');
  });

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

sendJsonButton.addEventListener('click', sendJsonFlow);

function sendMessage() {
  const messageText = inputField.value.trim();
  if (!messageText) return;

  addMessage(messageText, 'user-message');
  inputField.value = '';

  socket.emit('chatMessage', {
    messages: [{ role: 'user', content: messageText }],
  });
}

function sendJsonFlow() {
  const jsonFlow = jsonInput.value.trim();
  if (!jsonFlow) {
    alert('Please enter a JSON flow.');
    return;
  }

  fetch('http://localhost:7070/api/createFlow', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ jsonFlow }),
  })
    .then((response) => response.json())
    .then((data) => {
      alert('Flow sent successfully! Flow ID: ' + data.flowId);
    })
    .catch((error) => {
      console.error('Error sending JSON flow:', error);
      alert('Failed to send JSON flow.');
    });
}

function addMessage(text, className) {
  const messageElement = document.createElement('div');
  messageElement.className = `message ${className}`;
  messageElement.innerText = text;
  messages.appendChild(messageElement);
}
