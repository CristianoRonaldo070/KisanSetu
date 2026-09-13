// KisanSetu - Realtime & Persistent Chat Module
(function() {
  const CHAT = {};
  let socket = null;
  let currentUserId = null;
  let messageCallbacks = [];
  let requestCallbacks = [];
  let typingCallbacks = [];
  let activeRealtimeChannel = null;
  let activeSubscribedConvId = null;
  
  CHAT.init = async function(userId) {
    currentUserId = userId;
    
    // 1. Try to connect Socket.IO if available (for localhost / Node environments)
    if (typeof io === 'function') {
      try {
        const token = await KS_AUTH.getToken();
        socket = io({ transports: ['websocket', 'polling'] });
        
        socket.emit('authenticate', { token });
        
        socket.on('authenticated', (data) => {
          console.log('Socket.IO authenticated for user:', data.userId);
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

        socket.on('procurement_updated', (data) => {
          window.dispatchEvent(new CustomEvent('ks_procurement_updated', { detail: data }));
        });
      } catch (e) {
        console.warn('Socket.IO init non-critical notice:', e);
      }
    } else {
      console.log('Socket.IO not loaded; using Supabase Realtime & REST API.');
    }
  };
  
  // Subscribe to Supabase Realtime for instant cross-tab / cross-device updates
  CHAT.subscribeConversation = function(conversationId, onMessageCallback) {
    if (!conversationId) return;
    activeSubscribedConvId = conversationId;
    
    // Join socket room if socket is alive
    if (socket && socket.connected) {
      socket.emit('join_conversation', { conversationId });
    }
    
    // Supabase Realtime Postgres Changes
    const client = window.supabaseClient;
    if (client && typeof client.channel === 'function') {
      try {
        if (activeRealtimeChannel) {
          try { client.removeChannel(activeRealtimeChannel); } catch (e) {}
          activeRealtimeChannel = null;
        }
        
        const channelName = `realtime_conv_${conversationId}_${Date.now()}`;
        activeRealtimeChannel = client.channel(channelName)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
              filter: `conversation_id=eq.${conversationId}`
            },
            (payload) => {
              if (payload && payload.new) {
                if (typeof onMessageCallback === 'function') {
                  onMessageCallback(payload.new);
                }
                messageCallbacks.forEach(cb => cb(payload.new));
              }
            }
          )
          .subscribe((status, err) => {
            if (status === 'SUBSCRIBED') {
              console.log(`Supabase Realtime active for conversation ${conversationId}`);
            } else if (err) {
              console.warn(`Supabase Realtime subscription status: ${status}`, err);
            }
          });
      } catch (err) {
        console.warn('Error setting up Supabase Realtime channel:', err);
      }
    }
  };
  
  CHAT.unsubscribeConversation = function() {
    activeSubscribedConvId = null;
    const client = window.supabaseClient;
    if (client && activeRealtimeChannel) {
      try {
        client.removeChannel(activeRealtimeChannel);
      } catch (e) {}
      activeRealtimeChannel = null;
    }
  };
  
  CHAT.joinConversation = function(conversationId) {
    if (socket && socket.connected) {
      socket.emit('join_conversation', { conversationId });
    }
  };
  
  // Persist message to DB and broadcast immediately
  CHAT.sendMessageDirect = async function(conversationId, content) {
    if (!conversationId || !content || !content.trim()) return null;
    const cleanContent = content.trim();
    let savedMsg = null;
    
    // 1. Send via REST endpoint (persists to Supabase on server & emits socket event)
    try {
      const res = await KS_AUTH.apiFetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: cleanContent })
      });
      if (res && res.ok) {
        savedMsg = await res.json();
      }
    } catch (apiErr) {
      console.warn('API message save warning:', apiErr);
    }
    
    // 2. Direct client-side Supabase insert fallback if API failed or offline
    if (!savedMsg && window.supabaseClient) {
      try {
        const user = await KS_AUTH.getUser();
        if (user) {
          const { data, error } = await window.supabaseClient.from('messages')
            .insert({
              conversation_id: conversationId,
              sender_id: user.id,
              content: cleanContent
            })
            .select()
            .single();
          if (!error && data) {
            savedMsg = data;
          }
        }
      } catch (dbErr) {
        console.warn('Supabase direct insert fallback warning:', dbErr);
      }
    }
    
    // 3. Emit via Socket.IO if connected
    if (socket && socket.connected) {
      try {
        socket.emit('send_message', { conversationId, content: cleanContent });
      } catch (sockErr) {
        console.warn('Socket emit warning:', sockErr);
      }
    }
    
    return savedMsg;
  };
  
  // Backwards compatibility
  CHAT.sendMessage = function(conversationId, content) {
    return CHAT.sendMessageDirect(conversationId, content);
  };
  
  CHAT.sendTyping = function(conversationId) {
    if (socket && socket.connected) {
      socket.emit('typing', { conversationId });
    }
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
    CHAT.unsubscribeConversation();
    if (socket) socket.disconnect();
  };
  
  window.KS_CHAT = CHAT;
})();
