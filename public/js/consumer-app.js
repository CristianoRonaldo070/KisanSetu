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
let sentChatRequests = new Set();

async function syncSentRequests() {
    try {
        const user = await KS_AUTH.getUser();
        if (!user) return;
        let requests = [];
        try {
            const res = await KS_AUTH.apiFetch('/api/chat-requests');
            if (res && res.ok) requests = await res.json();
        } catch (e) {}
        if ((!requests || requests.length === 0) && window.supabaseClient) {
            try {
                const { data } = await window.supabaseClient.from('chat_requests')
                    .select('to_user_id')
                    .eq('from_user_id', user.id);
                if (data) requests = data;
            } catch(e) {}
        }
        if (Array.isArray(requests)) {
            requests.forEach(r => {
                if (r.to_user_id) sentChatRequests.add(r.to_user_id);
            });
        }
    } catch(err) {
        console.warn('syncSentRequests note:', err);
    }
}

function toast(msg, icon) {
  const stack = document.getElementById('toast-stack');
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<span>${icon||'✓'}</span><span>${msg}</span>`;
  stack.appendChild(el);
  setTimeout(() => { el.classList.add('leave'); setTimeout(() => el.remove(), 320); }, 2400);
}

const tr = (k, d) => window.KS_I18N ? KS_I18N.t(k, d) : (d || k);

document.addEventListener('DOMContentLoaded', async () => {
    const langSlot = document.getElementById('consumer-lang-slot');
    if (langSlot && window.KS_I18N) langSlot.innerHTML = KS_I18N.getSelectorHTML();

    window.addEventListener('ks_language_changed', () => {
        const activeBtn = document.querySelector('.ctab.active');
        const tab = activeBtn ? activeBtn.dataset.ctab : 'browse';
        switch(tab) {
            case 'browse': renderBrowseTab(); break;
            case 'nearby': renderNearbyTab(); break;
            case 'chat': renderChatTab(); break;
            case 'profile': renderProfileTab(); break;
        }
        const cartDrawer = document.getElementById('cart-drawer');
        if (cartDrawer && cartDrawer.classList.contains('open')) {
            renderCart();
        }
    });

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
    
    await syncSentRequests();
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
    contentEl.innerHTML = `<div style="padding:20px;">${tr('loading_products', 'Loading products...')}</div>`;
    try {
        let url = '/api/products';
        if(query) url += `?search=${encodeURIComponent(query)}`;
        const res = await KS_AUTH.apiFetch(url);
        const products = await res.json();
        
        if(!products || products.length === 0) {
            contentEl.innerHTML = `<div style="padding:20px;">${tr('no_products_found', 'No products found.')}</div>`;
            return;
        }
        
        consumerProductsMap = {};
        let html = '<div style="padding:20px; display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:20px;">';
        products.forEach(p => {
            const stockBadge = p.stock > 0 
                ? `<span class="stock-badge in">${tr('stat_in_stock', 'In Stock')}</span>` 
                : `<span class="stock-badge out">${tr('stat_out_stock', 'Out of Stock')}</span>`;
            const farmerName = p.farmer?.full_name || tr('verified_farmer', 'Verified Farmer');
            const statusDot = `<span class="status-dot ${p.farmer?.delivery_status || 'available'}"></span>`;
            consumerProductsMap[p.id] = { ...p, farmerName };
            const visual = (p.emoji && (p.emoji.startsWith('data:image') || p.emoji.startsWith('http')))
                ? `<img src="${p.emoji}" alt="${p.name}" style="width:56px; height:56px; object-fit:cover; border-radius:10px; border:1px solid #3a4a32;">`
                : `<div style="font-size:2.8rem;">${p.emoji || emojiFor(p.name)}</div>`;
            
            const hasSent = sentChatRequests.has(p.farmer_id);
            const chatBtnText = hasSent ? ('✓ ' + tr('req_sent', 'Request Sent')) : tr('btn_chat_farmer', '💬 Chat');
            const chatBtnStyle = hasSent ? 'border-color:var(--leaf-bright); color:var(--leaf-bright); background:rgba(127,166,83,0.18); cursor:default;' : '';

            html += `
                <div class="panel cprod-card">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
                        ${visual}
                        ${stockBadge}
                    </div>
                    <h4>${p.name}</h4>
                    <p class="lr-sub">₹${p.price}/${tr('unit_' + p.unit, p.unit)}</p>
                    <div style="margin:10px 0; font-size:0.9rem; display:flex; align-items:center; gap:6px;">
                        ${statusDot} <span>${farmerName}</span>
                    </div>
                    <div style="display:flex; gap:10px;">
                        <button class="btn btn-primary" style="flex:1;" onclick="addToCart('${p.id}')" ${p.stock>0?'':'disabled'}>${tr('btn_add_to_cart', 'Add to Cart')}</button>
                        <button class="btn btn-ghost" data-farmer-chat="${p.farmer_id}" onclick="requestChatWithFarmer('${p.farmer_id}', this)" ${hasSent ? 'disabled style="' + chatBtnStyle + '"' : ''}>${chatBtnText}</button>
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

async function requestChatWithFarmer(farmerId, btnEl) {
    if (btnEl) {
        btnEl.disabled = true;
        btnEl.textContent = '⏳ ' + tr('loading', 'Sending...');
    }
    try {
        const client = window.supabaseClient;
        const user = await KS_AUTH.getUser();
        let sent = false;
        
        if (client && user) {
            const { error: directErr } = await client.from('chat_requests').insert({
                from_user_id: user.id,
                to_user_id: farmerId,
                status: 'pending'
            });
            if (!directErr) sent = true;
        }
        
        if (!sent) {
            const res = await KS_AUTH.apiFetch('/api/chat-requests', { method: 'POST', body: JSON.stringify({ to_user_id: farmerId }) });
            if (res && res.ok) sent = true;
        }

        if (sent) {
            sentChatRequests.add(farmerId);
            document.querySelectorAll(`[data-farmer-chat="${farmerId}"]`).forEach(btn => {
                btn.textContent = '✓ ' + tr('req_sent', 'Request Sent');
                btn.disabled = true;
                btn.style.borderColor = 'var(--leaf-bright)';
                btn.style.color = 'var(--leaf-bright)';
                btn.style.background = 'rgba(127,166,83,0.18)';
                btn.style.cursor = 'default';
            });
            toast(tr('chat_req_sent', 'Chat request sent to farmer! 📩'));
            if (typeof loadChatData === 'function') loadChatData();
        } else {
            if (btnEl) {
                btnEl.disabled = false;
                btnEl.textContent = tr('btn_chat_farmer', '💬 Chat');
            }
            toast('Could not send chat request', '❌');
        }
    } catch(e) {
        if (btnEl) {
            btnEl.disabled = false;
            btnEl.textContent = tr('btn_chat_farmer', '💬 Chat');
        }
        toast('Error: ' + e.message, '❌');
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
    toast(`${name} ${tr('added_to_cart', 'added to cart!')}`, '🛒');
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
        body.innerHTML = `<p class="lr-sub" style="padding:20px;">${tr('cart_empty', 'Your cart is empty.')}</p>`;
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
                        <div class="lr-sub">${item.farmer_name} • ₹${item.price}/${tr('unit_' + item.unit, item.unit)}</div>
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
            <span>${tr('cart_total', 'Total:')}</span>
            <span>₹${total}</span>
        </div>
        <button class="btn btn-primary" style="width:100%;" onclick="checkout()">${tr('btn_checkout', 'Place Order')}</button>
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
            toast(tr('order_success', 'Order placed successfully! 🎉'), '✅');
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
            <h3>${tr('nearby_title', 'Nearby Farmers')}</h3>
            <div class="panel" style="margin-bottom:20px; display:flex; gap:10px;">
                <button class="btn btn-primary" onclick="findNearby()">${tr('btn_find_nearby', '📍 Find Farmers Near Me')}</button>
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
    resEl.innerHTML = `<p>${tr('getting_location', 'Getting your location...')}</p>`;
    
    navigator.geolocation.getCurrentPosition(async pos => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        resEl.innerHTML = `<p>${tr('searching_nearby', 'Searching farmers nearby...')}</p>`;
        try {
            const res = await KS_AUTH.apiFetch(`/api/farmers/nearby?lat=${lat}&lng=${lng}&radius=10`);
            const farmers = await res.json();
            
            if(!farmers || farmers.length === 0) {
                resEl.innerHTML = `<p>${tr('no_farmers_found', 'No farmers found nearby.')}</p>`;
                return;
            }
            
            let html = '<div style="display:grid; gap:15px;">';
            farmers.forEach(f => {
                const statusDot = `<span class="status-dot ${f.delivery_status || 'off'}"></span>`;
                const hasSent = sentChatRequests.has(f.id);
                const btnText = hasSent ? ('✓ ' + tr('req_sent', 'Request Sent')) : tr('btn_send_request', 'Send Request');
                const btnStyle = hasSent ? 'border-color:var(--leaf-bright); color:var(--leaf-bright); background:rgba(127,166,83,0.18); cursor:default;' : '';

                html += `
                    <div class="panel nearby-card" style="display:flex; justify-content:space-between; align-items:center;">
                        <div class="nc-top" style="display:flex; gap:15px; align-items:center;">
                            <div class="nc-avatar" style="font-size:2rem;">🧑‍🌾</div>
                            <div>
                                <div style="font-weight:bold;">${statusDot} ${f.full_name}</div>
                                <div class="lr-sub nc-distance">${f.city || 'Unknown City'}</div>
                            </div>
                        </div>
                        <button class="btn ${hasSent?'btn-ghost':'btn-water'}" data-farmer-chat="${f.id}" onclick="requestChatWithFarmer('${f.id}', this)" ${hasSent ? 'disabled style="' + btnStyle + '"' : ''}>${btnText}</button>
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
                    <input type="text" class="plain" id="user-search-input" placeholder="${tr('search_placeholder_farmer', 'Search for farmers...')}" onkeydown="if(event.key==='Enter')searchUsers()">
                    <button class="btn btn-primary" onclick="searchUsers()">${tr('btn_search', 'Search')}</button>
                </div>
                <div id="user-search-results" class="search-results" style="margin-top:10px; display:grid; gap:10px;"></div>
            </div>
            
            <div style="display:flex; gap:20px; flex-wrap:wrap;">
                <div style="flex:1; min-width:300px;">
                    <h3>${tr('pending_requests', 'Pending Requests')}</h3>
                    <div id="pending-requests" class="requests-grid" style="display:grid; gap:10px; margin-top:10px;">${tr('loading', 'Loading...')}</div>
                </div>
                <div style="flex:1; min-width:300px;">
                    <h3>${tr('active_convs', 'Active Conversations')}</h3>
                    <div id="active-conversations" style="display:grid; gap:10px; margin-top:10px;">${tr('loading', 'Loading...')}</div>
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
    resEl.innerHTML = `<p>${tr('searching', 'Searching...')}</p>`;
    try {
        const res = await KS_AUTH.apiFetch(`/api/users/search?q=${encodeURIComponent(q)}&role=farmer`);
        const users = await res.json();
        
        if(!users || users.length === 0) {
            resEl.innerHTML = `<p class="lr-sub">${tr('no_farmers_found', 'No farmers found.')}</p>`;
            return;
        }
        
        let html = '';
        users.forEach(u => {
            const hasSent = sentChatRequests.has(u.id);
            const btnText = hasSent ? ('✓ ' + tr('req_sent', 'Request Sent')) : tr('btn_send_request', 'Send Request');
            const btnStyle = hasSent ? 'border-color:var(--leaf-bright); color:var(--leaf-bright); background:rgba(127,166,83,0.18); cursor:default;' : '';

            html += `
                <div class="panel user-result" style="display:flex; justify-content:space-between; align-items:center; padding:10px;">
                    <div class="ur-left" style="display:flex; align-items:center; gap:10px;">
                        <div class="ur-avatar" style="font-size:1.5rem;">🧑‍🌾</div>
                        <div>
                            <div style="font-weight:bold;">${u.full_name || 'Unknown'}</div>
                            <div class="lr-sub" style="font-size:0.8rem; text-transform:capitalize;">${tr('role_farmer', 'Farmer')}</div>
                        </div>
                    </div>
                    <button class="btn btn-sm ${hasSent?'btn-ghost':'btn-water'}" data-farmer-chat="${u.id}" onclick="requestChatWithFarmer('${u.id}', this)" ${hasSent ? 'disabled style="' + btnStyle + '"' : ''}>${btnText}</button>
                </div>
            `;
        });
        resEl.innerHTML = html;
    } catch(e) {
        resEl.innerHTML = '<p style="color:var(--danger)">Error searching.</p>';
    }
}

async function loadChatData() {
    const pendingEl = document.getElementById('pending-requests');
    const activeEl = document.getElementById('active-conversations');
    try {
        const user = await KS_AUTH.getUser();
        if (!user) return;
        
        let requests = [];
        let conversations = [];
        
        try {
            const reqRes = await KS_AUTH.apiFetch('/api/chat-requests');
            if (reqRes && reqRes.ok) {
                requests = await reqRes.json();
            }
        } catch(e) {
            console.warn('apiFetch /api/chat-requests note:', e);
        }
        
        if ((!requests || !Array.isArray(requests) || requests.length === 0) && window.supabaseClient) {
            try {
                const { data } = await window.supabaseClient.from('chat_requests')
                    .select('*, from_user:profiles!chat_requests_from_user_id_fkey(id, full_name, avatar_url), to_user:profiles!chat_requests_to_user_id_fkey(id, full_name, avatar_url)')
                    .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`);
                if (data && data.length > 0) requests = data;
            } catch (err) {
                console.warn('Direct chat_requests note:', err);
            }
        }

        try {
            const convRes = await KS_AUTH.apiFetch('/api/conversations');
            if (convRes && convRes.ok) {
                conversations = await convRes.json();
            }
        } catch(e) {
            console.warn('apiFetch /api/conversations note:', e);
        }

        if ((!conversations || !Array.isArray(conversations) || conversations.length === 0) && window.supabaseClient) {
            try {
                const { data } = await window.supabaseClient.from('conversations')
                    .select('*, user_one_profile:profiles!conversations_user_one_fkey(id, full_name, avatar_url), user_two_profile:profiles!conversations_user_two_fkey(id, full_name, avatar_url)')
                    .or(`user_one.eq.${user.id},user_two.eq.${user.id}`);
                if (data && data.length > 0) conversations = data;
            } catch (err) {
                console.warn('Direct conversations note:', err);
            }
        }

        if (!Array.isArray(requests)) requests = [];
        if (!Array.isArray(conversations)) conversations = [];
        
        // Track sent requests
        requests.forEach(r => {
            if (r.to_user_id) sentChatRequests.add(r.to_user_id);
        });

        if (pendingEl) {
            let reqHtml = '';
            requests.forEach(r => {
                if (r.status === 'pending') {
                    const isIncoming = (r.is_incoming !== undefined) ? r.is_incoming : (r.to_user_id === user.id);
                    const otherUser = r.other_user || (isIncoming ? r.from_user : r.to_user) || {};
                    const otherName = otherUser.full_name || 'User';
                    
                    if (isIncoming) {
                        reqHtml += `
                            <div class="panel request-card" style="padding:10px;">
                                <div style="display:flex; justify-content:space-between; align-items:center;">
                                    <div><strong>${otherName}</strong> ${tr('sent_req_text', 'sent a request')}</div>
                                    <div style="display:flex; gap:5px;">
                                        <button class="btn btn-sm btn-primary" onclick="respondReq('${r.id}', 'accepted')">${tr('btn_accept', 'Accept')}</button>
                                        <button class="btn btn-sm btn-ghost" onclick="respondReq('${r.id}', 'declined')">${tr('btn_decline', 'Decline')}</button>
                                    </div>
                                </div>
                            </div>
                        `;
                    } else {
                        reqHtml += `
                            <div class="panel request-card" style="padding:10px;">
                                <div style="display:flex; justify-content:space-between; align-items:center;">
                                    <div>${tr('you_requested_chat', 'You requested to chat with')} <strong>${otherName}</strong></div>
                                    <div class="lr-sub">${tr('stat_pending', 'Pending')}</div>
                                </div>
                            </div>
                        `;
                    }
                }
            });
            pendingEl.innerHTML = reqHtml || `<p class="lr-sub">${tr('no_pending_req', 'No pending requests.')}</p>`;
        }
        
        if (activeEl) {
            let convHtml = '';
            conversations.forEach(c => {
                const isUserOne = c.user_one === user.id;
                const otherUser = c.other_user || (isUserOne ? c.user_two_profile : c.user_one_profile) || {};
                const otherName = otherUser.full_name || 'User';
                const otherId = otherUser.id || (isUserOne ? c.user_two : c.user_one);
                convHtml += `
                    <div class="panel" style="padding:10px; cursor:pointer; display:flex; align-items:center; gap:10px;" onclick="openChat('${c.id}', '${otherId}', '${otherName.replace(/'/g, "\\'")}')">
                        <div style="font-size:1.5rem;">🧑‍🌾</div>
                        <div style="font-weight:bold;">${otherName}</div>
                    </div>
                `;
            });
            activeEl.innerHTML = convHtml || `<p class="lr-sub">${tr('no_active_conv', 'No active conversations.')}</p>`;
        }
        
    } catch(e) {
        console.error('loadChatData error:', e);
        if (pendingEl) pendingEl.innerHTML = `<p class="lr-sub">${tr('no_pending_req', 'No pending requests.')}</p>`;
        if (activeEl) activeEl.innerHTML = `<p class="lr-sub">${tr('no_active_conv', 'No active conversations.')}</p>`;
    }
}

async function respondReq(id, status) {
    try {
        const res = await KS_AUTH.apiFetch(`/api/chat-requests/${id}`, { method: 'PUT', body: JSON.stringify({ status }) });
        if(res && res.ok) {
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
    contentEl.innerHTML = `<div style="padding:20px;">${tr('loading', 'Loading profile...')}</div>`;
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
                        <div style="cursor:pointer; position:relative;" title="${tr('change_photo', 'Change')}" onclick="document.getElementById('photo-upload').click()">
                            ${avatarDisplay}
                            <div style="position:absolute; bottom:0; right:0; background:var(--water); color:#fff; border-radius:50%; width:24px; height:24px; display:flex; align-items:center; justify-content:center; font-size:.8rem; font-weight:bold; border:2px solid #161f14;">📷</div>
                        </div>
                        <input type="file" id="photo-upload" style="display:none;" onchange="uploadPhoto(this)" accept="image/*">
                        <div>
                            <h3 id="consumer-heading-name">${profile.full_name || 'Consumer'}</h3>
                            <div class="lr-sub">${tr('profile_sub_consumer', 'Set your name and location to find nearby farmers and chat directly.')}</div>
                        </div>
                    </div>
                    
                    <div class="form-grid">
                        <div class="form-field"><label>${tr('label_name', 'Full Name')} *</label><input type="text" class="plain" id="p-name" value="${profile.full_name||''}" placeholder="${tr('placeholder_name', 'e.g. Priya Sharma')}"></div>
                        <div class="form-field"><label>${tr('profile_phone', 'Phone Number')}</label><input type="text" class="plain" id="p-phone" value="${profile.phone||''}" placeholder="e.g. 9876543210"></div>
                        <div class="form-field" style="grid-column:1/-1;"><label>${tr('delivery_address_label', 'Delivery Address')}</label><input type="text" class="plain" id="p-addr" value="${profile.address||''}" placeholder="e.g. Flat 301, Sunshine Apts"></div>
                        <div class="form-field"><label>${tr('profile_city', 'City / Town')}</label><input type="text" class="plain" id="p-city" value="${profile.city||''}" placeholder="e.g. Mumbai"></div>
                        <div class="form-field"><label>${tr('profile_state', 'State / Province')}</label><input type="text" class="plain" id="p-state" value="${profile.state_province||''}" placeholder="e.g. Maharashtra"></div>
                    </div>
                    
                    <div style="margin-top:24px; display:flex; gap:12px; flex-wrap:wrap;">
                        <button class="btn btn-ghost" onclick="useLocation()">${tr('btn_location', '📍 Use Current GPS Location')}</button>
                        <button class="btn btn-primary" onclick="saveProfile()">${tr('btn_save_profile', 'Save Profile')}</button>
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
        toast(tr('save_profile_success', 'Profile saved successfully! 🎉'));
        renderProfileTab();
    } catch(e) {
        console.error('Save profile error:', e);
        toast('Error saving profile', '❌');
    }
}

// Chat Drawer Logic
let activeConversationId = null;
let activeChatOtherUser = { id: null, name: 'Farmer' };
let activeChatCurrentUserId = null;
let renderedMessageIds = new Set();
let lastRenderedDateKey = null;
let chatPollingTimer = null;

function escapeChatHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[m]);
}

function formatChatTime(isoStr) {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

function getChatDateKey(isoStr) {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '';
    return d.toDateString();
}

function formatChatDateHeader(isoStr) {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '';
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) {
        return tr('today', 'Today');
    } else if (d.toDateString() === yesterday.toDateString()) {
        return tr('yesterday', 'Yesterday');
    } else {
        return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
    }
}

function renderMessageHtml(msg, isMe, otherName) {
    const msgDateKey = getChatDateKey(msg.created_at);
    let separatorHtml = '';
    if (msgDateKey && msgDateKey !== lastRenderedDateKey) {
        separatorHtml = `<div class="chat-date-separator"><span>${formatChatDateHeader(msg.created_at)}</span></div>`;
        lastRenderedDateKey = msgDateKey;
    }
    
    const senderName = isMe ? tr('you', 'You') : escapeChatHtml(otherName || 'Farmer');
    const timeStr = formatChatTime(msg.created_at || new Date().toISOString());
    const rowId = msg.id ? `msg-row-${msg.id}` : `msg-row-temp-${Math.random().toString(36).substring(2)}`;
    
    return `${separatorHtml}
    <div class="chat-msg-row ${isMe ? 'me' : 'them'}" id="${rowId}">
        <div class="chat-msg-bubble ${isMe ? 'me consumer-bubble' : 'them'}">
            <div class="chat-msg-header">
                <span class="chat-msg-author">${senderName}</span>
                <span class="chat-msg-time">${timeStr}</span>
            </div>
            <div class="chat-msg-text">${escapeChatHtml(msg.content)}</div>
        </div>
    </div>`;
}

function appendSingleMessage(msg, isMe, otherName) {
    if (msg.id && renderedMessageIds.has(msg.id)) return;
    if (msg.id) renderedMessageIds.add(msg.id);
    
    const msgsEl = document.getElementById('chat-msgs');
    if (!msgsEl) return;
    
    const emptyNotice = msgsEl.querySelector('.chat-empty-notice');
    if (emptyNotice) emptyNotice.remove();
    
    msgsEl.insertAdjacentHTML('beforeend', renderMessageHtml(msg, isMe, otherName));
    msgsEl.scrollTop = msgsEl.scrollHeight;
}

async function fetchAndRenderChatMessages(convId, isBackground = false) {
    if (!convId || convId !== activeConversationId) return;
    const msgsEl = document.getElementById('chat-msgs');
    if (!msgsEl) return;
    
    try {
        let msgs = [];
        try {
            const res = await KS_AUTH.apiFetch(`/api/conversations/${convId}/messages`);
            if (res && res.ok) {
                msgs = await res.json();
            }
        } catch (e) {
            console.warn('apiFetch messages note:', e);
        }
        
        if ((!msgs || msgs.length === 0) && window.supabaseClient) {
            try {
                const { data } = await window.supabaseClient.from('messages')
                    .select('*')
                    .eq('conversation_id', convId)
                    .order('created_at', { ascending: true });
                if (data) msgs = data;
            } catch (dbErr) {
                console.warn('Direct supabase messages query note:', dbErr);
            }
        }
        
        if (!Array.isArray(msgs)) msgs = [];
        
        if (!isBackground) {
            msgsEl.innerHTML = '';
            renderedMessageIds = new Set();
            lastRenderedDateKey = null;
            
            if (msgs.length === 0) {
                msgsEl.innerHTML = `<div class="chat-empty-notice" style="text-align:center; padding:35px 20px; color:var(--cream-dim);"><span style="font-size:2.2rem; display:block; margin-bottom:8px;">💬</span>${tr('no_messages_yet', 'No messages yet. Say hello!')}</div>`;
                return;
            }
        }
        
        msgs.forEach(m => {
            const isMe = m.sender_id === activeChatCurrentUserId;
            appendSingleMessage(m, isMe, activeChatOtherUser.name);
        });
    } catch(err) {
        console.error('fetchAndRenderChatMessages error:', err);
        if (!isBackground) {
            msgsEl.innerHTML = `<p style="color:var(--danger); text-align:center; padding:20px;">Error loading messages.</p>`;
        }
    }
}

async function openChat(convId, otherId, otherName) {
    activeConversationId = convId;
    activeChatOtherUser = { id: otherId, name: otherName || 'Farmer' };
    
    const user = await KS_AUTH.getUser();
    activeChatCurrentUserId = user ? user.id : null;
    
    document.getElementById('chat-drawer').classList.add('open');
    document.getElementById('chat-name').textContent = otherName || 'Farmer';
    
    const msgsEl = document.getElementById('chat-msgs');
    msgsEl.innerHTML = `<div style="text-align:center; padding:25px; color:var(--cream-dim);">${tr('loading', 'Loading messages...')}</div>`;
    
    if (chatPollingTimer) clearInterval(chatPollingTimer);
    
    // Subscribe to Supabase Realtime changes for this conversation
    if (window.KS_CHAT) {
        KS_CHAT.subscribeConversation(convId, (newMsg) => {
            if (newMsg.conversation_id === activeConversationId) {
                const isMe = newMsg.sender_id === activeChatCurrentUserId;
                appendSingleMessage(newMsg, isMe, activeChatOtherUser.name);
            }
        });
    }
    
    await fetchAndRenderChatMessages(convId, false);
    
    // 2-second polling guarantees delivery even if WebSockets are unmaintained on serverless
    chatPollingTimer = setInterval(() => {
        if (activeConversationId === convId) {
            fetchAndRenderChatMessages(convId, true);
        }
    }, 2000);
}

function closeChat() {
    document.getElementById('chat-drawer').classList.remove('open');
    if (chatPollingTimer) {
        clearInterval(chatPollingTimer);
        chatPollingTimer = null;
    }
    if (window.KS_CHAT) {
        KS_CHAT.unsubscribeConversation();
    }
    activeConversationId = null;
    renderedMessageIds.clear();
    lastRenderedDateKey = null;
}

async function sendChatMessage() {
    if (!activeConversationId) return;
    const input = document.getElementById('chat-input');
    const txt = input.value.trim();
    if (!txt) return;
    
    input.value = '';
    
    // Immediate optimistic display on right side
    const tempId = 'optimistic_' + Date.now();
    const optimisticMsg = {
        id: tempId,
        conversation_id: activeConversationId,
        sender_id: activeChatCurrentUserId,
        content: txt,
        created_at: new Date().toISOString()
    };
    
    appendSingleMessage(optimisticMsg, true, activeChatOtherUser.name);
    
    // Persist to Supabase / REST API
    try {
        const saved = await KS_CHAT.sendMessageDirect(activeConversationId, txt);
        if (saved && saved.id) {
            renderedMessageIds.delete(tempId);
            renderedMessageIds.add(saved.id);
            const tempRow = document.getElementById(`msg-row-${tempId}`);
            if (tempRow) tempRow.id = `msg-row-${saved.id}`;
        }
    } catch (e) {
        console.warn('sendChatMessage persistence note:', e);
    }
}

if (window.KS_CHAT) {
    KS_CHAT.onMessage(msg => {
        if (msg.conversation_id === activeConversationId) {
            const isMe = msg.sender_id === activeChatCurrentUserId;
            appendSingleMessage(msg, isMe, activeChatOtherUser.name);
        } else {
            toast(tr('new_message_notification', 'New message received! 💬'), '💬');
        }
    });
}
