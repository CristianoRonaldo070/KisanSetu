const EMOJI = {'Alphonso Mangoes':'🥭','Tomatoes':'🍅','Basmati Rice':'🌾','Turmeric':'🟠','Coconuts':'🥥','Wheat':'🌿','Mustard Greens':'🥬','Onions':'🧅','Spinach':'🥬','Sugarcane':'🎋','Green Chillies':'🌶️','Potatoes':'🥔','Bananas':'🍌','Groundnuts':'🥜'};
function emojiFor(name) { return EMOJI[name] || '🌱'; }

function renderCropVisual(emoji, name, size = 36) {
    if (emoji && (emoji.startsWith('data:image') || emoji.startsWith('http'))) {
        return `<img src="${emoji}" alt="${name || 'Crop'}" style="width:${size}px; height:${size}px; object-fit:cover; border-radius:8px; display:block;">`;
    }
    return `<span style="font-size:${size > 30 ? '1.6rem' : '1.1rem'}; line-height:1;">${emoji || emojiFor(name) || '🌱'}</span>`;
}

let cart = [];
let consumerProductsMap = {};

function toast(msg, icon) {
  const stack = document.getElementById('toast-stack');
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<span>${icon||'✓'}</span><span>${msg}</span>`;
  stack.appendChild(el);
  setTimeout(() => { el.classList.add('leave'); setTimeout(() => el.remove(), 320); }, 2400);
}

document.addEventListener('DOMContentLoaded', async () => {
    setupNav();
    const authed = await KS_AUTH.requireAuth();
    if (!authed) return;
    
    const user = await KS_AUTH.getUser();
    const profile = await KS_AUTH.getProfile();
    
    document.getElementById('consumer-name').textContent = profile?.full_name || 'Consumer';
    
    try {
      if (user && window.KS_CHAT) {
        await KS_CHAT.init(user.id);
      }
    } catch (err) {
      console.warn('Chat init non-critical warning:', err);
    }
    
    renderBrowseTab();
});

function setupNav() {
    const btns = document.querySelectorAll('.ctab');
    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            btns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const tab = btn.dataset.ctab;
            
            if(tab === 'browse') renderBrowseTab();
            if(tab === 'nearby') renderNearbyTab();
            if(tab === 'chat') renderChatTab();
            if(tab === 'profile') renderProfileTab();
        });
    });
}

function handleSearch() {
    const activeTab = document.querySelector('.ctab.active').dataset.ctab;
    if(activeTab === 'browse') {
        renderBrowseTab();
    }
}

const contentEl = document.getElementById('consumer-content');

async function renderBrowseTab() {
    const query = document.getElementById('consumer-search').value;
    contentEl.innerHTML = '<div style="padding:20px;">Loading products...</div>';
    try {
        let url = '/api/products';
        if(query) url += `?search=${encodeURIComponent(query)}`;
        const res = await KS_AUTH.apiFetch(url);
        const products = await res.json();
        
        if(!products || products.length === 0) {
            contentEl.innerHTML = '<div style="padding:20px;">No products found.</div>';
            return;
        }
        
        consumerProductsMap = {};
        let html = '<div style="padding:20px; display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:20px;">';
        products.forEach(p => {
            const stockBadge = p.stock > 0 ? `<span class="stock-badge in">In Stock</span>` : `<span class="stock-badge out">Out of Stock</span>`;
            const farmerName = p.farmer?.full_name || 'Verified Farmer';
            const statusDot = `<span class="status-dot ${p.farmer?.delivery_status || 'available'}"></span>`;
            consumerProductsMap[p.id] = { ...p, farmerName };
            const visual = (p.emoji && (p.emoji.startsWith('data:image') || p.emoji.startsWith('http')))
                ? `<img src="${p.emoji}" alt="${p.name}" style="width:56px; height:56px; object-fit:cover; border-radius:10px; border:1px solid #3a4a32;">`
                : `<div style="font-size:2.8rem;">${p.emoji || emojiFor(p.name)}</div>`;
            
            html += `
                <div class="panel cprod-card">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
                        ${visual}
                        ${stockBadge}
                    </div>
                    <h4>${p.name}</h4>
                    <p class="lr-sub">₹${p.price}/${p.unit}</p>
                    <div style="margin:10px 0; font-size:0.9rem; display:flex; align-items:center; gap:6px;">
                        ${statusDot} <span>${farmerName}</span>
                    </div>
                    <div style="display:flex; gap:10px;">
                        <button class="btn btn-primary" style="flex:1;" onclick="addToCart('${p.id}')" ${p.stock>0?'':'disabled'}>Add to Cart</button>
                        <button class="btn btn-ghost" onclick="requestChatWithFarmer('${p.farmer_id}')">💬 Chat</button>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        contentEl.innerHTML = html;
    } catch(e) {
        contentEl.innerHTML = '<div style="padding:20px; color:var(--danger)">Error loading products.</div>';
    }
}

async function requestChatWithFarmer(farmerId) {
    try {
        const res = await KS_AUTH.apiFetch('/api/chat-requests', { method: 'POST', body: JSON.stringify({ to_user_id: farmerId }) });
        if(res.ok) {
            toast('Chat request sent to farmer!');
        } else {
            toast('Could not send chat request', '❌');
        }
    } catch(e) {
        toast('Error', '❌');
    }
}

function addToCart(id, name, emoji, price, unit, farmerName) {
    const p = consumerProductsMap[id];
    if (p) {
        name = p.name;
        emoji = p.emoji || emojiFor(p.name);
        price = p.price;
        unit = p.unit;
        farmerName = p.farmerName;
    }
    const existing = cart.find(c => c.product_id === id);
    if(existing) {
        existing.qty++;
    } else {
        cart.push({ product_id: id, name, emoji, price, unit, farmer_name: farmerName, qty: 1 });
    }
    updateCartCount();
    toast(`${name} added to cart!`, '🛒');
}

function updateCartCount() {
    const el = document.getElementById('cart-count');
    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    if(totalQty > 0) {
        el.textContent = totalQty;
        el.classList.remove('hidden');
    } else {
        el.classList.add('hidden');
    }
}

function openCart() {
    document.getElementById('cart-drawer').classList.add('open');
    renderCart();
}

function closeCart() {
    document.getElementById('cart-drawer').classList.remove('open');
}

function renderCart() {
    const body = document.getElementById('cart-body');
    const foot = document.getElementById('cart-foot');
    
    if(cart.length === 0) {
        body.innerHTML = '<p class="lr-sub" style="padding:20px;">Your cart is empty.</p>';
        foot.innerHTML = '';
        return;
    }
    
    let html = '';
    let total = 0;
    cart.forEach((item, index) => {
        const itemTotal = item.price * item.qty;
        total += itemTotal;
        html += `
            <div class="list-row" style="margin-bottom:10px; border-bottom:1px solid var(--soil-panel-2); padding-bottom:10px;">
                <div class="lr-left">
                    <span class="lr-icon">${renderCropVisual(item.emoji, item.name, 44)}</span>
                    <div>
                        <div class="lr-name">${item.name}</div>
                        <div class="lr-sub">${item.farmer_name} • ₹${item.price}/${item.unit}</div>
                    </div>
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                    <button class="btn btn-sm btn-ghost" onclick="updateCartItem(${index}, -1)">-</button>
                    <span>${item.qty}</span>
                    <button class="btn btn-sm btn-ghost" onclick="updateCartItem(${index}, 1)">+</button>
                </div>
            </div>
        `;
    });
    
    body.innerHTML = html;
    foot.innerHTML = `
        <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:1.1rem; margin-bottom:15px;">
            <span>Total:</span>
            <span>₹${total}</span>
        </div>
        <button class="btn btn-primary" style="width:100%;" onclick="checkout()">Checkout</button>
    `;
}

function updateCartItem(index, delta) {
    cart[index].qty += delta;
    if(cart[index].qty <= 0) {
        cart.splice(index, 1);
    }
    updateCartCount();
    renderCart();
}

async function checkout() {
    if(cart.length === 0) return;
    try {
        const items = cart.map(c => ({ product_id: c.product_id, quantity: c.qty }));
        const res = await KS_AUTH.apiFetch('/api/orders', { method: 'POST', body: JSON.stringify({ items }) });
        if(res.ok) {
            cart = [];
            updateCartCount();
            closeCart();
            toast('Order placed successfully!', '✅');
        } else {
            toast('Failed to place order', '❌');
        }
    } catch(e) {
        toast('Error placing order', '❌');
    }
}


async function renderNearbyTab() {
    contentEl.innerHTML = `
        <div style="padding:20px; max-width:600px; margin:0 auto;">
            <h3>Find Nearby Farmers</h3>
            <div class="panel" style="margin-bottom:20px; display:flex; gap:10px;">
                <button class="btn btn-primary" onclick="findNearby()">📍 Use My Location</button>
            </div>
            <div id="nearby-results"></div>
        </div>
    `;
}

function findNearby() {
    if(!navigator.geolocation) {
        toast('Geolocation not supported', '❌');
        return;
    }
    const resEl = document.getElementById('nearby-results');
    resEl.innerHTML = '<p>Getting your location...</p>';
    
    navigator.geolocation.getCurrentPosition(async pos => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        resEl.innerHTML = '<p>Searching farmers nearby...</p>';
        try {
            const res = await KS_AUTH.apiFetch(`/api/farmers/nearby?lat=${lat}&lng=${lng}&radius=10`);
            const farmers = await res.json();
            
            if(!farmers || farmers.length === 0) {
                resEl.innerHTML = '<p>No farmers found nearby.</p>';
                return;
            }
            
            let html = '<div style="display:grid; gap:15px;">';
            farmers.forEach(f => {
                const statusDot = `<span class="status-dot ${f.delivery_status || 'off'}"></span>`;
                html += `
                    <div class="panel nearby-card" style="display:flex; justify-content:space-between; align-items:center;">
                        <div class="nc-top" style="display:flex; gap:15px; align-items:center;">
                            <div class="nc-avatar" style="font-size:2rem;">🧑🌾</div>
                            <div>
                                <div style="font-weight:bold;">${statusDot} ${f.full_name}</div>
                                <div class="lr-sub nc-distance">${f.city || 'Unknown City'}</div>
                            </div>
                        </div>
                        <button class="btn btn-water" onclick="requestChatWithFarmer('${f.id}')">Send Chat Request</button>
                    </div>
                `;
            });
            html += '</div>';
            resEl.innerHTML = html;
        } catch(e) {
            resEl.innerHTML = '<p style="color:var(--danger)">Error finding farmers.</p>';
        }
    }, err => {
        resEl.innerHTML = '<p style="color:var(--danger)">Failed to get location.</p>';
    });
}

// Chat functionality mirroring farmer app
async function renderChatTab() {
    contentEl.innerHTML = `
        <div style="padding:20px;">
            <div class="user-search-wrap" style="margin-bottom:20px; max-width:600px;">
                <div style="display:flex; gap:10px;">
                    <input type="text" class="plain" id="user-search-input" placeholder="Search for farmers..." onkeydown="if(event.key==='Enter')searchUsers()">
                    <button class="btn btn-primary" onclick="searchUsers()">Search</button>
                </div>
                <div id="user-search-results" class="search-results" style="margin-top:10px; display:grid; gap:10px;"></div>
            </div>
            
            <div style="display:flex; gap:20px; flex-wrap:wrap;">
                <div style="flex:1; min-width:300px;">
                    <h3>Pending Requests</h3>
                    <div id="pending-requests" class="requests-grid" style="display:grid; gap:10px; margin-top:10px;">Loading...</div>
                </div>
                <div style="flex:1; min-width:300px;">
                    <h3>Active Conversations</h3>
                    <div id="active-conversations" style="display:grid; gap:10px; margin-top:10px;">Loading...</div>
                </div>
            </div>
        </div>
    `;
    loadChatData();
}

async function searchUsers() {
    const q = document.getElementById('user-search-input').value;
    if(!q) return;
    const resEl = document.getElementById('user-search-results');
    resEl.innerHTML = '<p>Searching...</p>';
    try {
        const res = await KS_AUTH.apiFetch(`/api/users/search?q=${encodeURIComponent(q)}&role=farmer`);
        const users = await res.json();
        
        if(!users || users.length === 0) {
            resEl.innerHTML = '<p class="lr-sub">No farmers found.</p>';
            return;
        }
        
        let html = '';
        users.forEach(u => {
            html += `
                <div class="panel user-result" style="display:flex; justify-content:space-between; align-items:center; padding:10px;">
                    <div class="ur-left" style="display:flex; align-items:center; gap:10px;">
                        <div class="ur-avatar" style="font-size:1.5rem;">🧑🌾</div>
                        <div>
                            <div style="font-weight:bold;">${u.full_name || 'Unknown'}</div>
                            <div class="lr-sub" style="font-size:0.8rem; text-transform:capitalize;">${u.role}</div>
                        </div>
                    </div>
                    <button class="btn btn-sm btn-water" onclick="requestChatWithFarmer('${u.id}')">Send Request</button>
                </div>
            `;
        });
        resEl.innerHTML = html;
    } catch(e) {
        resEl.innerHTML = '<p style="color:var(--danger)">Error searching.</p>';
    }
}

async function loadChatData() {
    try {
        const [reqRes, convRes] = await Promise.all([
            KS_AUTH.apiFetch('/api/chat-requests'),
            KS_AUTH.apiFetch('/api/conversations')
        ]);
        
        const requests = await reqRes.json();
        const conversations = await convRes.json();
        
        const pendingEl = document.getElementById('pending-requests');
        const activeEl = document.getElementById('active-conversations');
        
        if(pendingEl) {
            let reqHtml = '';
            requests.forEach(r => {
                if(r.status === 'pending') {
                    if(r.is_incoming) {
                        reqHtml += `
                            <div class="panel request-card" style="padding:10px;">
                                <div style="display:flex; justify-content:space-between; align-items:center;">
                                    <div><strong>${r.other_user.full_name}</strong> sent a request</div>
                                    <div style="display:flex; gap:5px;">
                                        <button class="btn btn-sm btn-primary" onclick="respondReq('${r.id}', 'accepted')">Accept</button>
                                        <button class="btn btn-sm btn-ghost" onclick="respondReq('${r.id}', 'declined')">Decline</button>
                                    </div>
                                </div>
                            </div>
                        `;
                    } else {
                        reqHtml += `
                            <div class="panel request-card" style="padding:10px;">
                                <div style="display:flex; justify-content:space-between; align-items:center;">
                                    <div>You requested to chat with <strong>${r.other_user.full_name}</strong></div>
                                    <div class="lr-sub">Pending</div>
                                </div>
                            </div>
                        `;
                    }
                }
            });
            pendingEl.innerHTML = reqHtml || '<p class="lr-sub">No pending requests.</p>';
        }
        
        if(activeEl) {
            let convHtml = '';
            conversations.forEach(c => {
                const other = c.other_user;
                convHtml += `
                    <div class="panel" style="padding:10px; cursor:pointer; display:flex; align-items:center; gap:10px;" onclick="openChat('${c.id}', '${other.id}', '${other.full_name}')">
                        <div style="font-size:1.5rem;">🧑🌾</div>
                        <div style="font-weight:bold;">${other.full_name}</div>
                    </div>
                `;
            });
            activeEl.innerHTML = convHtml || '<p class="lr-sub">No active conversations.</p>';
        }
        
    } catch(e) {
        console.error(e);
    }
}

async function respondReq(id, status) {
    try {
        const res = await KS_AUTH.apiFetch(`/api/chat-requests/${id}`, { method: 'PUT', body: JSON.stringify({ status }) });
        if(res.ok) {
            toast(`Request ${status}`);
            loadChatData();
        } else {
            toast('Error updating request', '❌');
        }
    } catch(e) {
        toast('Error', '❌');
    }
}

// Profile Tab Logic
async function renderProfileTab() {
    contentEl.innerHTML = '<div style="padding:20px;">Loading profile...</div>';
    try {
        let profile = await KS_AUTH.getProfile();
        const user = await KS_AUTH.getUser();
        
        if (!profile) {
            profile = {
                full_name: user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Consumer',
                phone: '',
                address: '',
                city: '',
                state_province: '',
                avatar_url: '',
                latitude: null,
                longitude: null
            };
        }
        
        const avatarDisplay = profile.avatar_url 
            ? `<img src="${profile.avatar_url}" style="width:70px; height:70px; border-radius:50%; object-fit:cover; border:2px solid #3a4a32;">`
            : `<div style="width:70px; height:70px; border-radius:50%; background:#283523; border:2px solid #3a4a32; display:flex; align-items:center; justify-content:center; font-size:2.4rem;">🛒</div>`;
        
        contentEl.innerHTML = `
            <div style="padding:20px; max-width:620px; margin:0 auto;">
                <div class="panel">
                    <div style="display:flex; gap:20px; align-items:center; margin-bottom:24px;">
                        <div style="cursor:pointer; position:relative;" title="Click to upload profile photo" onclick="document.getElementById('photo-upload').click()">
                            ${avatarDisplay}
                            <div style="position:absolute; bottom:0; right:0; background:var(--water); color:#fff; border-radius:50%; width:24px; height:24px; display:flex; align-items:center; justify-content:center; font-size:.8rem; font-weight:bold; border:2px solid #161f14;">📷</div>
                        </div>
                        <input type="file" id="photo-upload" style="display:none;" onchange="uploadPhoto(this)" accept="image/*">
                        <div>
                            <h3 id="consumer-heading-name">${profile.full_name || 'Consumer'}</h3>
                            <div class="lr-sub">Set your name and location to find nearby farmers and chat directly.</div>
                        </div>
                    </div>
                    
                    <div class="form-grid">
                        <div class="form-field"><label>Full Name *</label><input type="text" class="plain" id="p-name" value="${profile.full_name||''}" placeholder="e.g. Priya Sharma"></div>
                        <div class="form-field"><label>Phone Number</label><input type="text" class="plain" id="p-phone" value="${profile.phone||''}" placeholder="e.g. 9876543210"></div>
                        <div class="form-field" style="grid-column:1/-1;"><label>Delivery Address</label><input type="text" class="plain" id="p-addr" value="${profile.address||''}" placeholder="e.g. Flat 301, Sunshine Apts"></div>
                        <div class="form-field"><label>City</label><input type="text" class="plain" id="p-city" value="${profile.city||''}" placeholder="e.g. Mumbai"></div>
                        <div class="form-field"><label>State</label><input type="text" class="plain" id="p-state" value="${profile.state_province||''}" placeholder="e.g. Maharashtra"></div>
                    </div>
                    
                    <div style="margin-top:24px; display:flex; gap:12px; flex-wrap:wrap;">
                        <button class="btn btn-ghost" onclick="useLocation()">📍 Use Current GPS Location</button>
                        <button class="btn btn-primary" onclick="saveProfile()">Save Profile</button>
                    </div>
                    <input type="hidden" id="p-lat" value="${profile.latitude||''}">
                    <input type="hidden" id="p-lng" value="${profile.longitude||''}">
                </div>
            </div>
        `;
    } catch(e) {
        console.error('Profile load error:', e);
        contentEl.innerHTML = '<div style="padding:20px; color:var(--danger)">Error loading profile: ' + (e.message || e) + '</div>';
    }
}

async function uploadPhoto(input) {
    if(!input.files || !input.files[0]) return;
    const file = input.files[0];
    if (file.size > 2 * 1024 * 1024) {
        toast('Photo should be under 2MB', '⚠️');
        return;
    }
    const reader = new FileReader();
    reader.onload = async function(e) {
        const base64 = e.target.result;
        try {
            const user = await KS_AUTH.getUser();
            const client = window.supabaseClient;
            if (client && user) {
                await client.from('profiles').upsert({ id: user.id, avatar_url: base64, role: 'consumer' });
                toast('Profile photo updated! 📸');
                renderProfileTab();
            }
        } catch(err) {
            toast('Failed to update photo', '❌');
        }
    };
    reader.readAsDataURL(file);
}

function useLocation() {
    if(!navigator.geolocation) {
        toast('Geolocation not supported', '❌');
        return;
    }
    toast('Getting GPS location...', '⏳');
    navigator.geolocation.getCurrentPosition(pos => {
        document.getElementById('p-lat').value = pos.coords.latitude;
        document.getElementById('p-lng').value = pos.coords.longitude;
        toast('Location grabbed! Click Save Profile to apply.');
    }, err => {
        toast('Location access denied or unavailable', '❌');
    });
}

async function saveProfile() {
    const name = document.getElementById('p-name').value.trim();
    if (!name) {
        toast('Please enter your full name', '⚠️');
        return;
    }
    const data = {
        full_name: name,
        phone: document.getElementById('p-phone').value,
        address: document.getElementById('p-addr').value,
        city: document.getElementById('p-city').value,
        state_province: document.getElementById('p-state').value,
        latitude: parseFloat(document.getElementById('p-lat').value) || null,
        longitude: parseFloat(document.getElementById('p-lng').value) || null,
        role: 'consumer'
    };
    
    try {
        const user = await KS_AUTH.getUser();
        const client = window.supabaseClient;
        if (client && user) {
            const { error } = await client.from('profiles').upsert({ id: user.id, ...data });
            if (error) console.warn('Direct upsert note:', error);
        }
        await KS_AUTH.apiFetch('/api/profile', { method: 'PUT', body: JSON.stringify(data) });
        
        document.getElementById('consumer-name').textContent = name;
        toast('Profile saved successfully! 🎉');
        renderProfileTab();
    } catch(e) {
        console.error('Save profile error:', e);
        toast('Error saving profile', '❌');
    }
}

// Chat Drawer Logic
let activeConversationId = null;

async function openChat(convId, otherId, otherName) {
    activeConversationId = convId;
    document.getElementById('chat-drawer').classList.add('open');
    document.getElementById('chat-name').textContent = otherName;
    
    KS_CHAT.joinConversation(convId);
    
    const msgsEl = document.getElementById('chat-msgs');
    msgsEl.innerHTML = '<p>Loading...</p>';
    
    try {
        const res = await KS_AUTH.apiFetch(`/api/conversations/${convId}/messages`);
        const msgs = await res.json();
        
        const user = await KS_AUTH.getUser();
        let html = '';
        msgs.forEach(m => {
            const isMe = m.sender_id === user.id;
            html += `<div style="margin-bottom:10px; text-align:${isMe?'right':'left'}">
                <div style="display:inline-block; padding:8px 12px; border-radius:12px; background:${isMe?'var(--water-bright)':'var(--soil-panel-2)'}; color:${isMe?'#000':'#fff'}">
                    ${m.content}
                </div>
            </div>`;
        });
        msgsEl.innerHTML = html;
        msgsEl.scrollTop = msgsEl.scrollHeight;
    } catch(e) {
        msgsEl.innerHTML = '<p>Error loading messages.</p>';
    }
}

function closeChat() {
    document.getElementById('chat-drawer').classList.remove('open');
    activeConversationId = null;
}

async function sendChatMessage() {
    if(!activeConversationId) return;
    const input = document.getElementById('chat-input');
    const txt = input.value.trim();
    if(!txt) return;
    
    KS_CHAT.sendMessage(activeConversationId, txt);
    
    const msgsEl = document.getElementById('chat-msgs');
    msgsEl.innerHTML += `<div style="margin-bottom:10px; text-align:right">
        <div style="display:inline-block; padding:8px 12px; border-radius:12px; background:var(--water-bright); color:#000">
            ${txt}
        </div>
    </div>`;
    msgsEl.scrollTop = msgsEl.scrollHeight;
    
    input.value = '';
}

KS_CHAT.onMessage(msg => {
    if(msg.conversation_id === activeConversationId) {
        const msgsEl = document.getElementById('chat-msgs');
        msgsEl.innerHTML += `<div style="margin-bottom:10px; text-align:left">
            <div style="display:inline-block; padding:8px 12px; border-radius:12px; background:var(--soil-panel-2); color:#fff">
                ${msg.content}
            </div>
        </div>`;
        msgsEl.scrollTop = msgsEl.scrollHeight;
    } else {
        toast('New message received!', '💬');
    }
});
