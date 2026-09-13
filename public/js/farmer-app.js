const EMOJI = {'Alphonso Mangoes':'🥭','Tomatoes':'🍅','Basmati Rice':'🌾','Turmeric':'🟠','Coconuts':'🥥','Wheat':'🌿','Mustard Greens':'🥬','Onions':'🧅','Spinach':'🥬','Sugarcane':'🎋','Green Chillies':'🌶️','Potatoes':'🥔','Bananas':'🍌','Groundnuts':'🥜'};
function emojiFor(name) { return EMOJI[name] || '🌱'; }

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
    
    document.getElementById('farmer-name-pill').textContent = profile?.full_name || 'Farmer';
    
    try {
      if (user && window.KS_CHAT) {
        await KS_CHAT.init(user.id);
      }
    } catch (err) {
      console.warn('Chat init non-critical warning:', err);
    }
    
    renderProductsTab();
});

function setupNav() {
    const btns = document.querySelectorAll('#farmer-nav button');
    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            btns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const tab = btn.dataset.tab;
            
            const titleEl = document.getElementById('farmer-tab-title');
            const subEl = document.getElementById('farmer-tab-sub');
            const addBtn = document.getElementById('add-product-btn');
            
            addBtn.style.display = 'none';
            
            switch(tab) {
                case 'products':
                    titleEl.textContent = 'Your Products';
                    subEl.textContent = 'Add crops, tweak prices, retire what\'s sold out.';
                    addBtn.style.display = 'inline-flex';
                    renderProductsTab();
                    break;
                case 'revenue':
                    titleEl.textContent = 'Revenue & Costs';
                    subEl.textContent = 'Track your earnings and profit margins.';
                    renderRevenueTab();
                    break;
                case 'stock':
                    titleEl.textContent = 'Stock Management';
                    subEl.textContent = 'Keep your inventory up to date.';
                    renderStockTab();
                    break;
                case 'delivery':
                    titleEl.textContent = 'Delivery Settings';
                    subEl.textContent = 'Manage your availability and delivery notes.';
                    renderDeliveryTab();
                    break;
                case 'chat-requests':
                    titleEl.textContent = 'Chat & Requests';
                    subEl.textContent = 'Connect with consumers and fellow farmers.';
                    renderChatTab();
                    break;
                case 'profile':
                    titleEl.textContent = 'Your Profile';
                    subEl.textContent = 'Update your personal info and location.';
                    renderProfileTab();
                    break;
            }
        });
    });
}

const contentEl = document.getElementById('farmer-content');

async function renderProductsTab() {
    contentEl.innerHTML = '<p>Loading products...</p>';
    try {
        const res = await KS_AUTH.apiFetch('/api/products/mine');
        const products = await res.json();
        
        if (!products || products.length === 0) {
            contentEl.innerHTML = '<div class="panel"><p>No crops added yet. Click "+ Add a crop" to get started.</p></div>';
            return;
        }
        
        let html = '<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:20px;">';
        products.forEach(p => {
            const stockStatus = p.stock > 0 ? `<span class="stock-badge in">In Stock</span>` : `<span class="stock-badge out">Out of Stock</span>`;
            const visual = (p.emoji && (p.emoji.startsWith('data:image') || p.emoji.startsWith('http')))
                ? `<img src="${p.emoji}" alt="${p.name}" style="width:64px; height:64px; object-fit:cover; border-radius:12px; border:1px solid #3a4a32; display:block; margin:0 auto 10px;">`
                : `<div style="font-size:3rem; margin-bottom:10px; text-align:center;">${p.emoji || emojiFor(p.name)}</div>`;
                
            html += `
                <div class="panel p-card">
                    ${visual}
                    <h4>${p.name}</h4>
                    <p class="lr-sub">${p.category} • ₹${p.price}/${p.unit}</p>
                    <div style="margin-top:10px; margin-bottom:10px;">${stockStatus} (${p.stock} ${p.unit})</div>
                    <div style="display:flex; gap:10px;">
                        <button class="btn btn-sm btn-ghost" onclick="editProduct('${p.id}', '${p.name.replace(/'/g, "\\'")}', '${p.category}', '${p.unit}', ${p.price}, ${p.cost_price||0}, ${p.stock}, '${(p.emoji||'').replace(/'/g, "\\'")}')">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteProduct('${p.id}')">Delete</button>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        contentEl.innerHTML = html;
    } catch (e) {
        console.error('Products load error:', e);
        contentEl.innerHTML = '<p style="color:var(--danger)">Error loading products.</p>';
    }
}

let currentCropImage = '';

function previewCropImage(input) {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    if (file.size > 2 * 1024 * 1024) {
        toast('Image should be under 2MB', '⚠️');
        return;
    }
    const reader = new FileReader();
    reader.onload = function(e) {
        currentCropImage = e.target.result;
        const preview = document.getElementById('crop-img-preview');
        if (preview) {
            preview.innerHTML = `<img src="${currentCropImage}" style="width:100%; height:100%; object-fit:cover; border-radius:8px;">`;
        }
    };
    reader.readAsDataURL(file);
}

function openProductModal() {
    const modal = document.getElementById('product-modal');
    modal.classList.add('show');
    modal.style.display = 'flex';
    document.getElementById('modal-title').textContent = 'Add a crop';
    document.getElementById('edit-product-id').value = '';
    document.getElementById('f-name').value = '';
    document.getElementById('f-category').value = 'Vegetable';
    document.getElementById('f-unit').value = 'kg';
    document.getElementById('f-price').value = '';
    document.getElementById('f-cost').value = '';
    document.getElementById('f-stock').value = '';
    currentCropImage = '';
    const preview = document.getElementById('crop-img-preview');
    if (preview) preview.innerHTML = '🌱';
    const fileInput = document.getElementById('f-image-file');
    if (fileInput) fileInput.value = '';
}

function editProduct(id, name, category, unit, price, cost_price, stock, existingImage) {
    const modal = document.getElementById('product-modal');
    modal.classList.add('show');
    modal.style.display = 'flex';
    document.getElementById('modal-title').textContent = 'Edit crop';
    document.getElementById('edit-product-id').value = id;
    document.getElementById('f-name').value = name;
    document.getElementById('f-category').value = category;
    document.getElementById('f-unit').value = unit;
    document.getElementById('f-price').value = price;
    document.getElementById('f-cost').value = cost_price;
    document.getElementById('f-stock').value = stock;
    currentCropImage = existingImage || '';
    const preview = document.getElementById('crop-img-preview');
    if (preview) {
        if (currentCropImage && (currentCropImage.startsWith('data:image') || currentCropImage.startsWith('http'))) {
            preview.innerHTML = `<img src="${currentCropImage}" style="width:100%; height:100%; object-fit:cover; border-radius:8px;">`;
        } else {
            preview.innerHTML = currentCropImage || emojiFor(name) || '🌱';
        }
    }
}

function closeProductModal() {
    const modal = document.getElementById('product-modal');
    modal.classList.remove('show');
    setTimeout(() => { modal.style.display = 'none'; }, 250);
}

async function saveProduct() {
    const id = document.getElementById('edit-product-id').value;
    const name = document.getElementById('f-name').value.trim();
    const price = parseFloat(document.getElementById('f-price').value);
    const stock = parseInt(document.getElementById('f-stock').value);
    
    if(!name || isNaN(price) || isNaN(stock)) {
        toast('Please fill crop name, price, and stock', '⚠️');
        return;
    }
    
    const cropVisual = currentCropImage || emojiFor(name);
    const data = {
        name: name,
        category: document.getElementById('f-category').value,
        unit: document.getElementById('f-unit').value,
        price: price,
        cost_price: parseFloat(document.getElementById('f-cost').value) || 0,
        stock: stock,
        emoji: cropVisual
    };
    
    try {
        let res;
        if(id) {
            res = await KS_AUTH.apiFetch(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(data) });
        } else {
            res = await KS_AUTH.apiFetch('/api/products', { method: 'POST', body: JSON.stringify(data) });
        }
        
        if(res && (res.ok || res.status === 200 || res.status === 201)) {
            closeProductModal();
            toast('Crop saved successfully! 🌾');
            renderProductsTab();
        } else {
            toast('Failed to save crop', '❌');
        }
    } catch(e) {
        toast('Error saving crop: ' + (e.message || e), '❌');
    }
}

async function deleteProduct(id) {
    if(!confirm('Are you sure you want to delete this product?')) return;
    try {
        const res = await KS_AUTH.apiFetch(`/api/products/${id}`, { method: 'DELETE' });
        if(res.ok) {
            toast('Product deleted');
            renderProductsTab();
        } else {
            toast('Failed to delete', '❌');
        }
    } catch(e) {
        toast('Error deleting', '❌');
    }
}

async function renderRevenueTab() {
    contentEl.innerHTML = '<p>Loading revenue data...</p>';
    try {
        const res = await KS_AUTH.apiFetch('/api/products/mine');
        const products = await res.json();
        
        let potentialRevenue = 0;
        let totalCost = 0;
        
        products.forEach(p => {
            potentialRevenue += p.price * p.stock;
            totalCost += (p.cost_price || 0) * p.stock;
        });
        
        const profit = potentialRevenue - totalCost;
        
        let html = `
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:20px; margin-bottom:20px;">
                <div class="panel stat-card">
                    <div class="lr-sub">Revenue Potential</div>
                    <div style="font-size:2rem; font-weight:700;">₹${potentialRevenue}</div>
                </div>
                <div class="panel stat-card">
                    <div class="lr-sub">Total Cost Basis</div>
                    <div style="font-size:2rem; font-weight:700;">₹${totalCost}</div>
                </div>
                <div class="panel stat-card" style="border-left:4px solid var(--leaf);">
                    <div class="lr-sub">Estimated Margin</div>
                    <div style="font-size:2rem; font-weight:700; color:var(--leaf);">₹${profit}</div>
                </div>
            </div>
            <h3>Per-Crop Margin</h3>
            <div class="panel" style="margin-top:10px;">
        `;
        
        products.forEach(p => {
            const margin = p.price - (p.cost_price || 0);
            html += `
                <div class="list-row" style="border-bottom:1px solid var(--soil-panel-2); padding:10px 0;">
                    <div class="lr-left">
                        <span class="lr-icon">${p.emoji || emojiFor(p.name)}</span>
                        <div>
                            <div class="lr-name">${p.name}</div>
                            <div class="lr-sub">${p.stock} ${p.unit} in stock</div>
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <div>Profit: ₹${margin}/${p.unit}</div>
                        <div class="lr-sub" style="font-size:0.8rem;">Price: ₹${p.price} | Cost: ₹${p.cost_price||0}</div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        contentEl.innerHTML = html;
    } catch(e) {
        contentEl.innerHTML = '<p style="color:var(--danger)">Error loading revenue data.</p>';
    }
}

async function renderStockTab() {
    contentEl.innerHTML = '<p>Loading stock data...</p>';
    try {
        const res = await KS_AUTH.apiFetch('/api/products/mine');
        const products = await res.json();
        
        const total = products.length;
        const inStock = products.filter(p => p.stock > 10).length;
        const outOfStock = products.filter(p => p.stock === 0).length;
        const lowStock = products.filter(p => p.stock > 0 && p.stock <= 10).length;
        
        let html = `
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(150px, 1fr)); gap:20px; margin-bottom:20px;">
                <div class="panel stat-card"><div>Total Crops</div><div style="font-size:1.5rem; font-weight:bold;">${total}</div></div>
                <div class="panel stat-card" style="border-left:3px solid var(--leaf);"><div>In Stock</div><div style="font-size:1.5rem; font-weight:bold;">${inStock}</div></div>
                <div class="panel stat-card" style="border-left:3px solid var(--marigold);"><div>Low Stock</div><div style="font-size:1.5rem; font-weight:bold;">${lowStock}</div></div>
                <div class="panel stat-card" style="border-left:3px solid var(--danger);"><div>Out of Stock</div><div style="font-size:1.5rem; font-weight:bold;">${outOfStock}</div></div>
            </div>
            <div class="panel">
        `;
        
        products.forEach(p => {
            html += `
                <div class="list-row" style="border-bottom:1px solid var(--soil-panel-2); padding:10px 0;">
                    <div class="lr-left">
                        <span class="lr-icon">${p.emoji || emojiFor(p.name)}</span>
                        <div>
                            <div class="lr-name">${p.name}</div>
                        </div>
                    </div>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <input type="number" class="plain" style="width:80px; padding:5px;" id="stock-edit-${p.id}" value="${p.stock}" min="0">
                        <button class="btn btn-sm btn-ghost" onclick="updateStock('${p.id}')">Save</button>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        contentEl.innerHTML = html;
    } catch(e) {
        contentEl.innerHTML = '<p style="color:var(--danger)">Error loading stock data.</p>';
    }
}

async function updateStock(id) {
    const val = document.getElementById(`stock-edit-${id}`).value;
    try {
        const res = await KS_AUTH.apiFetch(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify({ stock: parseInt(val) }) });
        if(res.ok) {
            toast('Stock updated');
        } else {
            toast('Failed to update stock', '❌');
        }
    } catch(e) {
        toast('Error updating stock', '❌');
    }
}

async function renderDeliveryTab() {
    contentEl.innerHTML = '<p>Loading profile...</p>';
    try {
        const profile = await KS_AUTH.getProfile();
        
        contentEl.innerHTML = `
            <div class="panel" style="max-width:500px;">
                <div class="form-grid">
                    <div class="form-field" style="grid-column:1/-1;">
                        <label>Current Status</label>
                        <select class="plain" id="d-status">
                            <option value="available" ${profile.delivery_status==='available'?'selected':''}>🟢 Available</option>
                            <option value="out" ${profile.delivery_status==='out'?'selected':''}>🚚 Out for delivery</option>
                            <option value="off" ${profile.delivery_status==='off'?'selected':''}>🔴 Off duty</option>
                        </select>
                    </div>
                    <div class="form-field" style="grid-column:1/-1;">
                        <label>Delivery Note (shows to consumers)</label>
                        <input type="text" class="plain" id="d-note" value="${profile.delivery_note || ''}" placeholder="e.g. Delivering to market until 5 PM">
                    </div>
                </div>
                <button class="btn btn-primary" style="margin-top:15px;" onclick="saveDelivery()">Save Status</button>
            </div>
        `;
    } catch(e) {
        contentEl.innerHTML = '<p style="color:var(--danger)">Error loading profile.</p>';
    }
}

async function saveDelivery() {
    const status = document.getElementById('d-status').value;
    const note = document.getElementById('d-note').value;
    try {
        const res = await KS_AUTH.apiFetch('/api/profile', { method: 'PUT', body: JSON.stringify({ delivery_status: status, delivery_note: note }) });
        if(res.ok) {
            toast('Delivery status updated');
        } else {
            toast('Failed to update', '❌');
        }
    } catch(e) {
        toast('Error updating status', '❌');
    }
}

async function renderChatTab() {
    contentEl.innerHTML = `
        <div class="user-search-wrap" style="margin-bottom:20px;">
            <div style="display:flex; gap:10px;">
                <input type="text" class="plain" id="user-search-input" placeholder="Search for users..." onkeydown="if(event.key==='Enter')searchUsers()">
                <button class="btn btn-primary" onclick="searchUsers()">Search</button>
            </div>
            <div id="user-search-results" class="search-results" style="margin-top:10px; display:grid; gap:10px;"></div>
        </div>
        
        <div style="display:flex; gap:20px;">
            <div style="flex:1;">
                <h3>Pending Requests</h3>
                <div id="pending-requests" class="requests-grid" style="display:grid; gap:10px; margin-top:10px;">Loading...</div>
            </div>
            <div style="flex:1;">
                <h3>Active Conversations</h3>
                <div id="active-conversations" style="display:grid; gap:10px; margin-top:10px;">Loading...</div>
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
        const res = await KS_AUTH.apiFetch(`/api/users/search?q=${encodeURIComponent(q)}`);
        const users = await res.json();
        
        if(!users || users.length === 0) {
            resEl.innerHTML = '<p class="lr-sub">No users found.</p>';
            return;
        }
        
        let html = '';
        users.forEach(u => {
            html += `
                <div class="panel user-result" style="display:flex; justify-content:space-between; align-items:center; padding:10px;">
                    <div class="ur-left" style="display:flex; align-items:center; gap:10px;">
                        <div class="ur-avatar" style="font-size:1.5rem;">👤</div>
                        <div>
                            <div style="font-weight:bold;">${u.full_name || 'Unknown'}</div>
                            <div class="lr-sub" style="font-size:0.8rem; text-transform:capitalize;">${u.role}</div>
                        </div>
                    </div>
                    <button class="btn btn-sm btn-water" onclick="sendChatReq('${u.id}')">Send Request</button>
                </div>
            `;
        });
        resEl.innerHTML = html;
    } catch(e) {
        resEl.innerHTML = '<p style="color:var(--danger)">Error searching users.</p>';
    }
}

async function sendChatReq(toUserId) {
    try {
        const res = await KS_AUTH.apiFetch('/api/chat-requests', { method: 'POST', body: JSON.stringify({ to_user_id: toUserId }) });
        if(res.ok) {
            toast('Chat request sent!');
            loadChatData();
        } else {
            toast('Failed to send request', '❌');
        }
    } catch(e) {
        toast('Error sending request', '❌');
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
                        <div style="font-size:1.5rem;">👤</div>
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

async function renderProfileTab() {
    contentEl.innerHTML = '<p>Loading profile...</p>';
    try {
        let profile = await KS_AUTH.getProfile();
        const user = await KS_AUTH.getUser();
        
        if (!profile) {
            profile = {
                full_name: user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Farmer',
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
            : `<div style="width:70px; height:70px; border-radius:50%; background:#283523; border:2px solid #3a4a32; display:flex; align-items:center; justify-content:center; font-size:2.4rem;">🧑‍🌾</div>`;
            
        contentEl.innerHTML = `
            <div class="panel" style="max-width:620px;">
                <div style="display:flex; gap:20px; align-items:center; margin-bottom:24px;">
                    <div style="cursor:pointer; position:relative;" title="Click to upload profile photo" onclick="document.getElementById('photo-upload').click()">
                        ${avatarDisplay}
                        <div style="position:absolute; bottom:0; right:0; background:var(--leaf); color:#12180f; border-radius:50%; width:24px; height:24px; display:flex; align-items:center; justify-content:center; font-size:.8rem; font-weight:bold; border:2px solid #161f14;">📷</div>
                    </div>
                    <input type="file" id="photo-upload" style="display:none;" onchange="uploadPhoto(this)" accept="image/*">
                    <div>
                        <h3 id="profile-heading-name">${profile.full_name || 'Farmer'}</h3>
                        <div class="lr-sub">Set your full name and farm details so consumers can search and contact you.</div>
                    </div>
                </div>
                
                <div class="form-grid">
                    <div class="form-field"><label>Full Name *</label><input type="text" class="plain" id="p-name" value="${profile.full_name||''}" placeholder="e.g. Ramesh Kumar"></div>
                    <div class="form-field"><label>Phone Number</label><input type="text" class="plain" id="p-phone" value="${profile.phone||''}" placeholder="e.g. 9876543210"></div>
                    <div class="form-field" style="grid-column:1/-1;"><label>Farm / Home Address</label><input type="text" class="plain" id="p-addr" value="${profile.address||''}" placeholder="e.g. Green Valley Farm, Road 3"></div>
                    <div class="form-field"><label>City</label><input type="text" class="plain" id="p-city" value="${profile.city||''}" placeholder="e.g. Pune"></div>
                    <div class="form-field"><label>State</label><input type="text" class="plain" id="p-state" value="${profile.state_province||''}" placeholder="e.g. Maharashtra"></div>
                </div>
                
                <div style="margin-top:24px; display:flex; gap:12px; flex-wrap:wrap;">
                    <button class="btn btn-ghost" onclick="useLocation()">📍 Use Current GPS Location</button>
                    <button class="btn btn-primary" onclick="saveProfile()">Save Profile</button>
                </div>
                <input type="hidden" id="p-lat" value="${profile.latitude||''}">
                <input type="hidden" id="p-lng" value="${profile.longitude||''}">
            </div>
        `;
    } catch(e) {
        console.error('Profile render error:', e);
        contentEl.innerHTML = '<p style="color:var(--danger)">Error loading profile: ' + (e.message || e) + '</p>';
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
                await client.from('profiles').upsert({ id: user.id, avatar_url: base64, role: 'farmer' });
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
        role: 'farmer'
    };
    
    try {
        const user = await KS_AUTH.getUser();
        const client = window.supabaseClient;
        if (client && user) {
            const { error } = await client.from('profiles').upsert({ id: user.id, ...data });
            if (error) console.warn('Direct upsert note:', error);
        }
        await KS_AUTH.apiFetch('/api/profile', { method: 'PUT', body: JSON.stringify(data) });
        
        document.getElementById('farmer-name-pill').textContent = name;
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
                <div style="display:inline-block; padding:8px 12px; border-radius:12px; background:${isMe?'var(--leaf-bright)':'var(--soil-panel-2)'}; color:${isMe?'#000':'#fff'}">
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
        <div style="display:inline-block; padding:8px 12px; border-radius:12px; background:var(--leaf-bright); color:#000">
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
