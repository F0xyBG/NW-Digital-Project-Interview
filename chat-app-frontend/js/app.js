const messages = document.getElementById('messages'); 
const inputField = document.getElementById('input-field'); 
const sendButton = document.getElementById('send-button'); 

sendButton.addEventListener('click', sendMessage);
inputField.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
    const messageText = inputField.value.trim();
    if (!messageText) return;

    addMessage(messageText, 'user-message');
    inputField.value = '';

    setTimeout(() => {
        const botResponse = `This is a simulated response to "${messageText}"`;
        addMessage(botResponse, 'bot-message');
        messages.scrollTop = messages.scrollHeight;
    }, 1000);
}

function addMessage(text, className) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${className}`;
    messageElement.innerText = text;
    messages.appendChild(messageElement);
}