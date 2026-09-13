(function() {
  const CHAT = {};
  let socket = null;
  let currentUserId = null;
  let messageCallbacks = [];
  let requestCallbacks = [];
  let typingCallbacks = [];
  
  CHAT.init = async function(userId) {
    currentUserId = userId;
    if (typeof io !== 'function') {
      console.warn('Socket.IO library not loaded, real-time messaging offline');
      return;
    }
    const token = await KS_AUTH.getToken();
    socket = io({ transports: ['websocket', 'polling'] });
    
    socket.emit('authenticate', { token });
    
    socket.on('authenticated', (data) => {
      console.log('Chat authenticated for user:', data.userId);
    });
    
    socket.on('receive_message', (msg) => {
      messageCallbacks.forEach(cb => cb(msg));
    });
    
    socket.on('new_chat_request', (req) => {
      requestCallbacks.forEach(cb => cb(req));
    });
    
    socket.on('chat_request_updated', (req) => {
      requestCallbacks.forEach(cb => cb(req));
    });
    
    socket.on('user_typing', (data) => {
      typingCallbacks.forEach(cb => cb(data));
    });
  };
  
  CHAT.joinConversation = function(conversationId) {
    if (socket) socket.emit('join_conversation', { conversationId });
  };
  
  CHAT.sendMessage = function(conversationId, content) {
    if (socket) socket.emit('send_message', { conversationId, content });
  };
  
  CHAT.sendTyping = function(conversationId) {
    if (socket) socket.emit('typing', { conversationId });
  };
  
  CHAT.onMessage = function(callback) {
    messageCallbacks.push(callback);
  };
  
  CHAT.onRequest = function(callback) {
    requestCallbacks.push(callback);
  };
  
  CHAT.onTyping = function(callback) {
    typingCallbacks.push(callback);
  };
  
  CHAT.disconnect = function() {
    if (socket) socket.disconnect();
  };
  
  window.KS_CHAT = CHAT;
})();
