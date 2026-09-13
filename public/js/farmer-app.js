const EMOJI = {'Alphonso Mangoes':'🥭','Tomatoes':'🍅','Basmati Rice':'🌾','Turmeric':'🟠','Coconuts':'🥥','Wheat':'🌿','Mustard Greens':'🥬','Onions':'🧅','Spinach':'🥬','Sugarcane':'🎋','Green Chillies':'🌶️','Potatoes':'🥔','Bananas':'🍌','Groundnuts':'🥜'};
function emojiFor(name) { return EMOJI[name] || '🌱'; }

function renderCropVisual(emoji, name, size = 36) {
    if (emoji && (emoji.startsWith('data:image') || emoji.startsWith('http'))) {
        return `<img src="${emoji}" alt="${name || 'Crop'}" style="width:${size}px; height:${size}px; object-fit:cover; border-radius:8px; display:block;">`;
    }
    return `<span style="font-size:${size > 30 ? '1.6rem' : '1.1rem'}; line-height:1;">${emoji || emojiFor(name) || '🌱'}</span>`;
}

let currentFarmerProducts = {};

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
    const langSlot = document.getElementById('farmer-lang-slot');
    if (langSlot && window.KS_I18N) langSlot.innerHTML = KS_I18N.getSelectorHTML();

    window.addEventListener('ks_language_changed', () => {
        const activeBtn = document.querySelector('#farmer-nav button.active');
        const tab = activeBtn ? activeBtn.dataset.tab : 'products';
        updateFarmerTabTitles(tab);
        switch(tab) {
            case 'products': renderProductsTab(); break;
            case 'revenue': renderRevenueTab(); break;
            case 'stock': renderStockTab(); break;
            case 'delivery': renderDeliveryTab(); break;
            case 'chat-requests': renderChatTab(); break;
            case 'profile': renderProfileTab(); break;
        }
    });

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

function updateFarmerTabTitles(tab) {
    const titleEl = document.getElementById('farmer-tab-title');
    const subEl = document.getElementById('farmer-tab-sub');
    if (!titleEl || !subEl) return;
    switch(tab) {
        case 'products':
            titleEl.textContent = tr('head_products_title', 'Your Products');
            subEl.textContent = tr('head_products_sub', 'Add crops, tweak prices, retire what\'s sold out.');
            break;
        case 'revenue':
            titleEl.textContent = tr('head_revenue_title', 'Revenue & Costs');
            subEl.textContent = tr('head_revenue_sub', 'Track your earnings and profit margins.');
            break;
        case 'stock':
            titleEl.textContent = tr('head_stock_title', 'Stock Management');
            subEl.textContent = tr('head_stock_sub', 'Keep your inventory up to date.');
            break;
        case 'delivery':
            titleEl.textContent = tr('head_delivery_title', 'Delivery Settings');
            subEl.textContent = tr('head_delivery_sub', 'Manage your availability and delivery notes.');
            break;
        case 'chat-requests':
            titleEl.textContent = tr('head_chat_title', 'Chat & Requests');
            subEl.textContent = tr('head_chat_sub', 'Connect with consumers and fellow farmers.');
            break;
        case 'profile':
            titleEl.textContent = tr('head_profile_title', 'Your Profile');
            subEl.textContent = tr('head_profile_sub', 'Update your personal info and location.');
            break;
    }
}

function setupNav() {
    const btns = document.querySelectorAll('#farmer-nav button');
    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            btns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const tab = btn.dataset.tab;
            
            const addBtn = document.getElementById('add-product-btn');
            addBtn.style.display = (tab === 'products') ? 'inline-flex' : 'none';
            
            updateFarmerTabTitles(tab);
            switch(tab) {
                case 'products': renderProductsTab(); break;
                case 'revenue': renderRevenueTab(); break;
                case 'stock': renderStockTab(); break;
                case 'delivery': renderDeliveryTab(); break;
                case 'chat-requests': renderChatTab(); break;
                case 'profile': renderProfileTab(); break;
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
        
        currentFarmerProducts = {};
        let html = '<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:20px;">';
        products.forEach(p => {
            currentFarmerProducts[p.id] = p;
            const stockText = p.stock > 0 ? tr('stat_in_stock', 'In Stock') : tr('stat_out_stock', 'Out of Stock');
            const stockStatus = `<span class="stock-badge ${p.stock > 0 ? 'in' : 'out'}">${stockText}</span>`;
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
                        <button class="btn btn-sm btn-ghost" onclick="editProduct('${p.id}')">${tr('btn_edit', 'Edit')}</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteProduct('${p.id}')">${tr('btn_delete', 'Delete')}</button>
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
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            // Compress and downscale image to max 450px for fast uploading
            const canvas = document.createElement('canvas');
            const maxDim = 450;
            let width = img.width;
            let height = img.height;
            if (width > height) {
                if (width > maxDim) {
                    height = Math.round((height * maxDim) / width);
                    width = maxDim;
                }
            } else {
                if (height > maxDim) {
                    width = Math.round((width * maxDim) / height);
                    height = maxDim;
                }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            currentCropImage = canvas.toDataURL('image/jpeg', 0.8);
            const preview = document.getElementById('crop-img-preview');
            if (preview) {
                preview.innerHTML = `<img src="${currentCropImage}" style="width:100%; height:100%; object-fit:cover; border-radius:8px;">`;
            }
            toast('Image ready');
        };
        img.src = e.target.result;
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
    const p = currentFarmerProducts[id];
    if (p) {
        name = p.name;
        category = p.category;
        unit = p.unit;
        price = p.price;
        cost_price = p.cost_price;
        stock = p.stock;
        existingImage = p.emoji;
    }
    const modal = document.getElementById('product-modal');
    modal.classList.add('show');
    modal.style.display = 'flex';
    document.getElementById('modal-title').textContent = 'Edit crop';
    document.getElementById('edit-product-id').value = id;
    document.getElementById('f-name').value = name || '';
    document.getElementById('f-category').value = category || 'Vegetable';
    document.getElementById('f-unit').value = unit || 'kg';
    document.getElementById('f-price').value = price || 0;
    document.getElementById('f-cost').value = cost_price || 0;
    document.getElementById('f-stock').value = stock || 0;
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
        toast('Saving crop...', '⏳');
        const user = await KS_AUTH.getUser();
        const client = window.supabaseClient;
        
        if (!user) {
            toast('Please sign in first', '⚠️');
            return;
        }

        // 1. Ensure farmer profile exists in Supabase
        if (client) {
            await client.from('profiles').upsert({
                id: user.id,
                role: 'farmer',
                full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Farmer'
            }, { onConflict: 'id' });

            // 2. Direct client insert/update (runs with user's JWT session, RLS passes 100%)
            let directResult;
            if (id) {
                directResult = await client.from('products').update(data).eq('id', id).eq('farmer_id', user.id);
            } else {
                directResult = await client.from('products').insert({ ...data, farmer_id: user.id });
            }

            if (!directResult.error) {
                closeProductModal();
                toast('Crop saved successfully! 🌾');
                renderProductsTab();
                return;
            }
            console.warn('Direct client save returned error, falling back to API:', directResult.error);
        }

        // 3. Fallback to API route
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
            let errMsg = 'Failed to save crop';
            try {
                const errData = await res.json();
                if (errData && errData.error) errMsg = errData.error;
            } catch(ignore) {}
            toast(errMsg, '❌');
        }
    } catch(e) {
        toast('Error saving crop: ' + (e.message || e), '❌');
    }
}

async function deleteProduct(id) {
    if(!confirm('Are you sure you want to delete this product?')) return;
    try {
        const user = await KS_AUTH.getUser();
        const client = window.supabaseClient;
        if (client && user) {
            const { error } = await client.from('products').delete().eq('id', id).eq('farmer_id', user.id);
            if (!error) {
                toast('Product deleted');
                renderProductsTab();
                return;
            }
        }
        const res = await KS_AUTH.apiFetch(`/api/products/${id}`, { method: 'DELETE' });
        if(res && (res.ok || res.status === 204)) {
            toast('Product deleted');
            renderProductsTab();
        } else {
            toast('Failed to delete', '❌');
        }
    } catch(e) {
        toast('Error deleting: ' + (e.message || e), '❌');
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
                    <div class="lr-sub">${tr('stat_rev_potential', 'Revenue Potential')}</div>
                    <div style="font-size:2rem; font-weight:700;">₹${potentialRevenue}</div>
                </div>
                <div class="panel stat-card">
                    <div class="lr-sub">${tr('stat_total_cost', 'Total Cost Basis')}</div>
                    <div style="font-size:2rem; font-weight:700;">₹${totalCost}</div>
                </div>
                <div class="panel stat-card" style="border-left:4px solid var(--leaf);">
                    <div class="lr-sub">${tr('stat_est_margin', 'Estimated Margin')}</div>
                    <div style="font-size:2rem; font-weight:700; color:var(--leaf);">₹${profit}</div>
                </div>
            </div>
            <h3>${tr('per_crop_margin', 'Per-Crop Margin')}</h3>
            <div class="panel" style="margin-top:10px;">
        `;
        
        products.forEach(p => {
            const margin = p.price - (p.cost_price || 0);
            html += `
                <div class="list-row" style="border-bottom:1px solid var(--soil-panel-2); padding:10px 0;">
                    <div class="lr-left">
                        <span class="lr-icon">${renderCropVisual(p.emoji, p.name, 44)}</span>
                        <div>
                            <div class="lr-name">${p.name}</div>
                            <div class="lr-sub">${p.stock} ${p.unit} in stock</div>
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <div>${tr('profit', 'Profit')}: ₹${margin}/${p.unit}</div>
                        <div class="lr-sub" style="font-size:0.8rem;">${tr('price', 'Price')}: ₹${p.price} | ${tr('cost', 'Cost')}: ₹${p.cost_price||0}</div>
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
                <div class="panel stat-card"><div>${tr('stat_total_crops', 'Total Crops')}</div><div style="font-size:1.5rem; font-weight:bold;">${total}</div></div>
                <div class="panel stat-card" style="border-left:3px solid var(--leaf);"><div>${tr('stat_in_stock', 'In Stock')}</div><div style="font-size:1.5rem; font-weight:bold;">${inStock}</div></div>
                <div class="panel stat-card" style="border-left:3px solid var(--marigold);"><div>${tr('stat_low_stock', 'Low Stock')}</div><div style="font-size:1.5rem; font-weight:bold;">${lowStock}</div></div>
                <div class="panel stat-card" style="border-left:3px solid var(--danger);"><div>${tr('stat_out_stock', 'Out of Stock')}</div><div style="font-size:1.5rem; font-weight:bold;">${outOfStock}</div></div>
            </div>
            <div class="panel">
        `;
        
        products.forEach(p => {
            html += `
                <div class="list-row" style="border-bottom:1px solid var(--soil-panel-2); padding:10px 0;">
                    <div class="lr-left">
                        <span class="lr-icon">${renderCropVisual(p.emoji, p.name, 44)}</span>
                        <div>
                            <div class="lr-name">${p.name}</div>
                        </div>
                    </div>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <input type="number" class="plain" style="width:80px; padding:5px;" id="stock-edit-${p.id}" value="${p.stock}" min="0">
                        <button class="btn btn-sm btn-ghost" onclick="updateStock('${p.id}')">${tr('btn_save', 'Save')}</button>
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
    contentEl.innerHTML = `<p>${tr('loading', 'Loading...')}</p>`;
    try {
        let profile = await KS_AUTH.getProfile();
        const user = await KS_AUTH.getUser();
        
        if (!profile) {
            profile = {
                delivery_status: 'available',
                delivery_note: '',
                role: 'farmer'
            };
        }
        
        const currentStatus = profile.delivery_status || 'available';
        const currentNote = profile.delivery_note || '';
        
        contentEl.innerHTML = `
            <div class="panel" style="max-width:550px;">
                <div class="form-grid">
                    <div class="form-field" style="grid-column:1/-1;">
                        <label>${tr('delivery_status', 'Delivery Status')}</label>
                        <select class="plain" id="d-status">
                            <option value="available" ${currentStatus==='available'?'selected':''}>🟢 ${tr('status_available', 'Available for delivery')}</option>
                            <option value="out" ${currentStatus==='out'?'selected':''}>🚚 ${tr('status_out', 'Out on delivery right now')}</option>
                            <option value="off" ${currentStatus==='off'?'selected':''}>🔴 ${tr('status_off', 'Not delivering today')}</option>
                        </select>
                    </div>
                    <div class="form-field" style="grid-column:1/-1;">
                        <label>${tr('delivery_note', 'Delivery Note')}</label>
                        <input type="text" class="plain" id="d-note" value="${currentNote.replace(/"/g, '&quot;')}" placeholder="${tr('delivery_note_placeholder', 'e.g. Free delivery within 5km, orders after 6 PM next day')}">
                    </div>
                </div>
                <button class="btn btn-primary" style="margin-top:18px;" onclick="saveDelivery()">${tr('save_delivery_btn', 'Save Delivery Settings')}</button>
            </div>
        `;
    } catch(e) {
        console.error('Delivery tab load error:', e);
        contentEl.innerHTML = '<p style="color:var(--danger)">Error loading delivery settings: ' + (e.message || e) + '</p>';
    }
}

async function saveDelivery() {
    const status = document.getElementById('d-status').value;
    const note = document.getElementById('d-note').value;
    try {
        const user = await KS_AUTH.getUser();
        const client = window.supabaseClient;
        if (client && user) {
            await client.from('profiles').upsert({
                id: user.id,
                delivery_status: status,
                delivery_note: note,
                role: 'farmer'
            });
        }
        await KS_AUTH.apiFetch('/api/profile', { method: 'PUT', body: JSON.stringify({ delivery_status: status, delivery_note: note }) });
        toast('Delivery status saved! 🚚');
    } catch(e) {
        console.error('Save delivery error:', e);
        toast('Error saving delivery status', '❌');
    }
}

async function renderChatTab() {
    contentEl.innerHTML = `
        <div class="user-search-wrap" style="margin-bottom:20px;">
            <div style="display:flex; gap:10px;">
                <input type="text" class="plain" id="user-search-input" placeholder="${tr('search_placeholder_farmer', 'Search buyers or farmers by name...')}" onkeydown="if(event.key==='Enter')searchUsers()">
                <button class="btn btn-primary" onclick="searchUsers()">${tr('btn_search', 'Search')}</button>
            </div>
            <div id="user-search-results" class="search-results" style="margin-top:10px; display:grid; gap:10px;"></div>
        </div>
        
        <div style="display:flex; gap:20px;">
            <div style="flex:1;">
                <h3>${tr('pending_requests', 'Pending Requests')}</h3>
                <div id="pending-requests" class="requests-grid" style="display:grid; gap:10px; margin-top:10px;">${tr('loading', 'Loading...')}</div>
            </div>
            <div style="flex:1;">
                <h3>${tr('active_convs', 'Active Conversations')}</h3>
                <div id="active-conversations" style="display:grid; gap:10px; margin-top:10px;">${tr('loading', 'Loading...')}</div>
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
        const res = await KS_AUTH.apiFetch(`/api/users/search?q=${encodeURIComponent(q)}`);
        const users = await res.json();
        
        if(!users || users.length === 0) {
            resEl.innerHTML = `<p class="lr-sub">${tr('no_users_found', 'No users found.')}</p>`;
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
                            <div class="lr-sub" style="font-size:0.8rem; text-transform:capitalize;">${u.role === 'farmer' ? tr('role_farmer', 'Farmer') : tr('role_consumer', 'Consumer')}</div>
                        </div>
                    </div>
                    <button class="btn btn-sm btn-water" onclick="sendChatReq('${u.id}', this)">${tr('btn_send_request', 'Send Request')}</button>
                </div>
            `;
        });
        resEl.innerHTML = html;
    } catch(e) {
        resEl.innerHTML = '<p style="color:var(--danger)">Error searching users.</p>';
    }
}

async function sendChatReq(toUserId, btnEl) {
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
                to_user_id: toUserId,
                status: 'pending'
            });
            if (!directErr) sent = true;
        }
        
        if (!sent) {
            const res = await KS_AUTH.apiFetch('/api/chat-requests', { method: 'POST', body: JSON.stringify({ to_user_id: toUserId }) });
            if (res && res.ok) sent = true;
        }

        if (sent) {
            toast(tr('chat_req_sent_user', 'Chat request sent! 📩'));
            if (btnEl) {
                btnEl.textContent = '✓ ' + tr('req_sent', 'Request Sent');
                btnEl.disabled = true;
                btnEl.style.borderColor = 'var(--leaf-bright)';
                btnEl.style.color = 'var(--leaf-bright)';
                btnEl.style.background = 'rgba(127,166,83,0.18)';
            }
            loadChatData();
        } else {
            if (btnEl) {
                btnEl.disabled = false;
                btnEl.textContent = tr('btn_send_request', 'Send Request');
            }
            toast('Failed to send request', '❌');
        }
    } catch(e) {
        if (btnEl) {
            btnEl.disabled = false;
            btnEl.textContent = tr('btn_send_request', 'Send Request');
        }
        toast('Error sending request: ' + e.message, '❌');
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
                        <div style="font-size:1.5rem;">👤</div>
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

async function renderProfileTab() {
    contentEl.innerHTML = `<p>${tr('loading', 'Loading profile...')}</p>`;
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
                    <div style="cursor:pointer; position:relative;" title="${tr('change_photo', 'Change')}" onclick="document.getElementById('photo-upload').click()">
                        ${avatarDisplay}
                        <div style="position:absolute; bottom:0; right:0; background:var(--leaf); color:#12180f; border-radius:50%; width:24px; height:24px; display:flex; align-items:center; justify-content:center; font-size:.8rem; font-weight:bold; border:2px solid #161f14;">📷</div>
                    </div>
                    <input type="file" id="photo-upload" style="display:none;" onchange="uploadPhoto(this)" accept="image/*">
                    <div>
                        <h3 id="profile-heading-name">${profile.full_name || 'Farmer'}</h3>
                        <div class="lr-sub">${tr('profile_sub_farmer', 'Set your full name and farm details so consumers can search and contact you.')}</div>
                    </div>
                </div>
                
                <div class="form-grid">
                    <div class="form-field"><label>${tr('label_name', 'Full Name')} *</label><input type="text" class="plain" id="p-name" value="${profile.full_name||''}" placeholder="${tr('placeholder_name', 'e.g. Ramesh Kumar')}"></div>
                    <div class="form-field"><label>${tr('profile_phone', 'Phone Number')}</label><input type="text" class="plain" id="p-phone" value="${profile.phone||''}" placeholder="e.g. 9876543210"></div>
                    <div class="form-field" style="grid-column:1/-1;"><label>${tr('profile_address', 'Farm / Home Address')}</label><input type="text" class="plain" id="p-addr" value="${profile.address||''}" placeholder="e.g. Green Valley Farm, Road 3"></div>
                    <div class="form-field"><label>${tr('profile_city', 'City / Town')}</label><input type="text" class="plain" id="p-city" value="${profile.city||''}" placeholder="e.g. Pune"></div>
                    <div class="form-field"><label>${tr('profile_state', 'State / Province')}</label><input type="text" class="plain" id="p-state" value="${profile.state_province||''}" placeholder="e.g. Maharashtra"></div>
                </div>
                
                <div style="margin-top:24px; display:flex; gap:12px; flex-wrap:wrap;">
                    <button class="btn btn-ghost" onclick="useLocation()">${tr('btn_location', '📍 Use Current GPS Location')}</button>
                    <button class="btn btn-primary" onclick="saveProfile()">${tr('btn_save_profile', 'Save Profile')}</button>
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
        toast(tr('save_profile_success', 'Profile saved successfully! 🎉'));
        renderProfileTab();
    } catch(e) {
        console.error('Save profile error:', e);
        toast('Error saving profile', '❌');
    }
}

// Chat Drawer Logic
let activeConversationId = null;
let activeChatOtherUser = { id: null, name: 'User' };
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
    
    const senderName = isMe ? tr('you', 'You') : escapeChatHtml(otherName || 'User');
    const timeStr = formatChatTime(msg.created_at || new Date().toISOString());
    const rowId = msg.id ? `msg-row-${msg.id}` : `msg-row-temp-${Math.random().toString(36).substring(2)}`;
    
    return `${separatorHtml}
    <div class="chat-msg-row ${isMe ? 'me' : 'them'}" id="${rowId}">
        <div class="chat-msg-bubble ${isMe ? 'me' : 'them'}">
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
    activeChatOtherUser = { id: otherId, name: otherName || 'User' };
    
    const user = await KS_AUTH.getUser();
    activeChatCurrentUserId = user ? user.id : null;
    
    document.getElementById('chat-drawer').classList.add('open');
    document.getElementById('chat-name').textContent = otherName || 'User';
    
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
