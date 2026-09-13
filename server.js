require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] }
});

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const upload = multer({ storage: multer.memoryStorage() });

const publicDir = path.join(__dirname, 'public');

app.use(cors());
app.use(express.json());
app.use(express.static(publicDir));

// Explicit page routes for reliable serverless rendering
app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});
app.get('/auth', (req, res) => {
  res.sendFile(path.join(publicDir, 'auth.html'));
});
app.get('/farmer', (req, res) => {
  res.sendFile(path.join(publicDir, 'farmer.html'));
});
app.get('/consumer', (req, res) => {
  res.sendFile(path.join(publicDir, 'consumer.html'));
});

// Auth Middleware
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }
    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
    
    req.user = user;
    next();
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// --- Profile Routes ---
app.get('/api/profile', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', req.user.id).single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/profile', authMiddleware, async (req, res) => {
  try {
    const updates = { ...req.body, updated_at: new Date() };
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', req.user.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/profile/photo', authMiddleware, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    
    const ext = req.file.originalname.split('.').pop();
    const fileName = `${req.user.id}.${ext}`;
    
    const { data, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true
      });
      
    if (uploadError) throw uploadError;
    
    const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
    const avatar_url = publicUrlData.publicUrl;
    
    const { data: profile, error: updateError } = await supabase.from('profiles')
      .update({ avatar_url })
      .eq('id', req.user.id)
      .select().single();
      
    if (updateError) throw updateError;
    res.json(profile);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- Products Routes ---
app.get('/api/products', authMiddleware, async (req, res) => {
  try {
    const { farmer_id, search, category } = req.query;
    let query = supabase.from('products').select('*, profiles!products_farmer_id_fkey(id, full_name, avatar_url, city, state_province)');
    
    if (farmer_id) query = query.eq('farmer_id', farmer_id);
    if (category) query = query.eq('category', category);
    if (search) query = query.ilike('name', `%${search}%`);
    
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/products/mine', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase.from('products').select('*').eq('farmer_id', req.user.id);
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/products', authMiddleware, async (req, res) => {
  try {
    const product = { ...req.body, farmer_id: req.user.id };
    const { data, error } = await supabase.from('products').insert(product).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/products/:id', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase.from('products')
      .update(req.body)
      .eq('id', req.params.id)
      .eq('farmer_id', req.user.id)
      .select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/products/:id', authMiddleware, async (req, res) => {
  try {
    const { error } = await supabase.from('products')
      .delete()
      .eq('id', req.params.id)
      .eq('farmer_id', req.user.id);
    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- Farmers Routes (Unprotected) ---
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

app.get('/api/farmers/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 50 } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });
    
    const { data, error } = await supabase.from('profiles')
      .select('*')
      .eq('role', 'farmer')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);
      
    if (error) throw error;
    
    const nearby = data.map(farmer => {
      const distance = haversineDistance(parseFloat(lat), parseFloat(lng), farmer.latitude, farmer.longitude);
      return { ...farmer, distance };
    }).filter(f => f.distance <= radius)
      .sort((a, b) => a.distance - b.distance);
      
    res.json(nearby);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- Users Routes ---
app.get('/api/users/search', authMiddleware, async (req, res) => {
  try {
    const { q, role } = req.query;
    let query = supabase.from('profiles').select('*').neq('id', req.user.id);
    if (q) query = query.ilike('full_name', `%${q}%`);
    if (role) query = query.eq('role', role);
    
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- Chat Requests Routes ---
app.get('/api/chat-requests', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase.from('chat_requests')
      .select('*, from_user:profiles!chat_requests_from_user_id_fkey(id, full_name, avatar_url), to_user:profiles!chat_requests_to_user_id_fkey(id, full_name, avatar_url)')
      .or(`from_user_id.eq.${req.user.id},to_user_id.eq.${req.user.id}`);
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/chat-requests', authMiddleware, async (req, res) => {
  try {
    const { to_user_id } = req.body;
    const { data, error } = await supabase.from('chat_requests')
      .insert({ from_user_id: req.user.id, to_user_id, status: 'pending' })
      .select().single();
    if (error) throw error;
    
    io.to(`user_${to_user_id}`).emit('new_chat_request', data);
    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/chat-requests/:id', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const { data, error } = await supabase.from('chat_requests')
      .update({ status })
      .eq('id', req.params.id)
      .eq('to_user_id', req.user.id)
      .select().single();
    if (error) throw error;
    
    // Status update logic/conversation creation is handled by DB trigger on accept
    io.to(`user_${data.from_user_id}`).emit('chat_request_updated', data);
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- Conversations Routes ---
app.get('/api/conversations', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase.from('conversations')
      .select('*, user_one_profile:profiles!conversations_user_one_fkey(id, full_name, avatar_url), user_two_profile:profiles!conversations_user_two_fkey(id, full_name, avatar_url)')
      .or(`user_one.eq.${req.user.id},user_two.eq.${req.user.id}`);
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/conversations/:id/messages', authMiddleware, async (req, res) => {
  try {
    // Verify participant
    const { data: conv, error: convError } = await supabase.from('conversations')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (convError || (conv.user_one !== req.user.id && conv.user_two !== req.user.id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const { data, error } = await supabase.from('messages')
      .select('*')
      .eq('conversation_id', req.params.id)
      .order('created_at', { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- Orders Routes ---
app.post('/api/orders', authMiddleware, async (req, res) => {
  try {
    const { items } = req.body; // [{ product_id, quantity }]
    if (!items || !items.length) return res.status(400).json({ error: 'Items required' });
    
    let total = 0;
    const orderItemsData = [];
    
    for (const item of items) {
      const { data: product } = await supabase.from('products').select('price').eq('id', item.product_id).single();
      if (product) {
        total += product.price * item.quantity;
        orderItemsData.push({ product_id: item.product_id, quantity: item.quantity, unit_price: product.price });
      }
    }
    
    const { data: order, error: orderError } = await supabase.from('orders')
      .insert({ consumer_id: req.user.id, total_amount: total })
      .select().single();
    if (orderError) throw orderError;
    
    const itemsToInsert = orderItemsData.map(i => ({ ...i, order_id: order.id }));
    const { error: itemsError } = await supabase.from('order_items').insert(itemsToInsert);
    if (itemsError) throw itemsError;
    
    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- Socket.IO ---
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);
  
  socket.on('authenticate', async ({ token }) => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (user && !error) {
        socket.data.userId = user.id;
        socket.join(`user_${user.id}`);
        console.log(`User ${user.id} authenticated and joined personal room`);
      }
    } catch (err) {
      console.error('Socket auth error:', err);
    }
  });
  
  socket.on('join_conversation', async ({ conversationId }) => {
    if (!socket.data.userId) return;
    try {
      const { data: conv } = await supabase.from('conversations').select('*').eq('id', conversationId).single();
      if (conv && (conv.user_one === socket.data.userId || conv.user_two === socket.data.userId)) {
        socket.join(`conv_${conversationId}`);
        console.log(`User ${socket.data.userId} joined conv_${conversationId}`);
      }
    } catch (err) {
      console.error(err);
    }
  });
  
  socket.on('send_message', async ({ conversationId, content }) => {
    if (!socket.data.userId) return;
    try {
      const { data, error } = await supabase.from('messages')
        .insert({ conversation_id: conversationId, sender_id: socket.data.userId, content })
        .select().single();
      if (!error) {
        io.to(`conv_${conversationId}`).emit('receive_message', data);
      }
    } catch (err) {
      console.error(err);
    }
  });
  
  socket.on('typing', ({ conversationId }) => {
    if (!socket.data.userId) return;
    socket.to(`conv_${conversationId}`).emit('user_typing', { userId: socket.data.userId });
  });
});

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`KisanSetu server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
module.exports.server = server;
