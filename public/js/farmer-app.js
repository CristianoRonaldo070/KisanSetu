const EMOJI = {'Alphonso Mangoes':'🥭','Tomatoes':'🍅','Basmati Rice':'🌾','Turmeric':'🟠','Coconuts':'🥥','Wheat':'🌿','Mustard Greens':'🥬','Onions':'🧅','Spinach':'🥬','Sugarcane':'🎋','Green Chillies':'🌶️','Potatoes':'🥔','Bananas':'🍌','Groundnuts':'🥜'};
function emojiFor(name) { return EMOJI[name] || '🌱'; }

function renderCropVisual(emoji, name, size = 36) {
    if (emoji && (emoji.startsWith('data:image') || emoji.startsWith('http'))) {
        return `<img src="${emoji}" alt="${name || 'Crop'}" style="width:${size}px; height:${size}px; object-fit:cover; border-radius:8px; display:block;">`;
    }
    return `<span style="font-size:${size > 30 ? '1.6rem' : '1.1rem'}; line-height:1;">${emoji || emojiFor(name) || '🌱'}</span>`;
}

function renderUserAvatar(avatarUrl, role = 'user', size = 40) {
    if (avatarUrl && (avatarUrl.startsWith('data:image') || avatarUrl.startsWith('http'))) {
        return `<div class="ur-avatar" style="width:${size}px; height:${size}px; border-radius:50%; overflow:hidden; border:2px solid #3a4a32; flex-shrink:0; display:inline-flex; align-items:center; justify-content:center;"><img src="${avatarUrl}" alt="Avatar" style="width:100%; height:100%; object-fit:cover; display:block;"></div>`;
    }
    const defaultEmoji = role === 'farmer' ? '🧑‍🌾' : (role === 'consumer' ? '🛒' : '👤');
    const fontSize = Math.round(size * 0.52);
    return `<div class="ur-avatar" style="width:${size}px; height:${size}px; border-radius:50%; background:#283523; border:2px solid #3a4a32; display:inline-flex; align-items:center; justify-content:center; font-size:${fontSize}px; flex-shrink:0; line-height:1;">${defaultEmoji}</div>`;
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
            case 'procurement': renderProcurementTab(); break;
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
        case 'procurement':
            titleEl.textContent = tr('head_procurement_title', 'Mandi Procurement & Queue');
            subEl.textContent = tr('head_procurement_sub', 'Book slots at APMC mandis, track your queue position & MSP payments.');
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
                case 'procurement': renderProcurementTab(); break;
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
    const q = document.getElementById('user-search-input').value.trim();
    if(!q) return;
    const resEl = document.getElementById('user-search-results');
    resEl.innerHTML = `<p>${tr('searching', 'Searching...')}</p>`;
    try {
        let users = [];
        try {
            const res = await KS_AUTH.apiFetch(`/api/users/search?q=${encodeURIComponent(q)}`);
            if (res && res.ok) {
                users = await res.json();
            }
        } catch (e) {
            console.warn('apiFetch users search note:', e);
        }
        
        if ((!users || users.length === 0) && window.supabaseClient) {
            try {
                const user = await KS_AUTH.getUser();
                let qb = window.supabaseClient.from('profiles').select('*').ilike('full_name', `%${q}%`);
                if (user) qb = qb.neq('id', user.id);
                const { data } = await qb;
                if (data) users = data;
            } catch (sbErr) {
                console.warn('Direct supabase users search note:', sbErr);
            }
        }
        
        if(!users || users.length === 0) {
            resEl.innerHTML = `<p class="lr-sub">${tr('no_users_found', 'No users found.')}</p>`;
            return;
        }
        
        let html = '';
        users.forEach(u => {
            html += `
                <div class="panel user-result" style="display:flex; justify-content:space-between; align-items:center; padding:12px;">
                    <div class="ur-left" style="display:flex; align-items:center; gap:12px;">
                        ${renderUserAvatar(u.avatar_url, u.role, 42)}
                        <div>
                            <div style="font-weight:bold; font-size:.95rem;">${escapeChatHtml(u.full_name || 'Unknown')}</div>
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
                                    <div style="display:flex; align-items:center; gap:10px;">
                                        ${renderUserAvatar(otherUser.avatar_url, otherUser.role, 36)}
                                        <div><strong>${otherName}</strong> ${tr('sent_req_text', 'sent a request')}</div>
                                    </div>
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
                                    <div style="display:flex; align-items:center; gap:10px;">
                                        ${renderUserAvatar(otherUser.avatar_url, otherUser.role, 36)}
                                        <div>${tr('you_requested_chat', 'You requested to chat with')} <strong>${otherName}</strong></div>
                                    </div>
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
                const otherAvatar = (otherUser.avatar_url || '').replace(/'/g, "\\'");
                convHtml += `
                    <div class="panel" style="padding:10px; cursor:pointer; display:flex; align-items:center; gap:12px;" onclick="openChat('${c.id}', '${otherId}', '${otherName.replace(/'/g, "\\'")}', '${otherAvatar}')">
                        ${renderUserAvatar(otherUser.avatar_url, otherUser.role, 40)}
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
                await client.from('profiles').update({ avatar_url: base64 }).eq('id', user.id);
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

// ─── Procurement Center: Slot Booking, Queue & Payment Tracking ───
const PROCUREMENT_CENTERS = [
  { id:'apmc-pune', name:'APMC Pune Market Yard Kendra', address:'Gultekdi, Market Yard Rd, Pune 411037, MH', hours:'7:00 AM – 5:00 PM', bays:4, crops:['Wheat','Onions','Soybeans','Turmeric'], lat:18.497, lng:73.874 },
  { id:'kums-lasalgaon', name:'Krishi Upaj Mandi Samiti', address:'Lasalgaon, Nashik District 422306, MH', hours:'6:30 AM – 4:30 PM', bays:6, crops:['Onions','Wheat','Soybeans','Cotton'], lat:20.144, lng:74.233 },
  { id:'apmc-vashi', name:'APMC Vashi Grain Terminal', address:'Turbhe, Navi Mumbai 400703, MH', hours:'8:00 AM – 6:00 PM', bays:3, crops:['Wheat','Basmati Rice','Soybeans','Turmeric'], lat:19.075, lng:73.001 },
  { id:'baramati-mandi', name:'Baramati Agro Mandi Kendra', address:'Baramati, Pune District 413102, MH', hours:'7:30 AM – 5:30 PM', bays:3, crops:['Wheat','Onions','Cotton','Turmeric'], lat:18.152, lng:74.577 }
];

const PROCUREMENT_CROPS = [
  { name:'Wheat', msp:2275, emoji:'🌾' },
  { name:'Basmati Rice', msp:2183, emoji:'🍚' },
  { name:'Onions', msp:1350, emoji:'🧅' },
  { name:'Soybeans', msp:4600, emoji:'🫘' },
  { name:'Turmeric', msp:9200, emoji:'🟠' },
  { name:'Cotton', msp:7020, emoji:'🧶' }
];

const PROCUREMENT_SLOTS = [
  '09:00 AM – 10:30 AM',
  '10:30 AM – 12:00 PM',
  '01:00 PM – 02:30 PM',
  '02:30 PM – 04:00 PM'
];

const PROC_STAGES = ['confirmed','gate','weighbridge','complete','payment'];

let procQueueTimer = null;

function getProcBookings() {
  try { return JSON.parse(localStorage.getItem('ks_proc_bookings') || '[]'); } catch { return []; }
}
function saveProcBookings(arr) {
  localStorage.setItem('ks_proc_bookings', JSON.stringify(arr));
}

function renderProcurementTab() {
  if (procQueueTimer) { clearInterval(procQueueTimer); procQueueTimer = null; }
  const bookings = getProcBookings();
  const active = bookings.filter(b => b.stage !== 'payment');
  const completed = bookings.filter(b => b.stage === 'payment');

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  let html = '';

  // ── Centers section ──
  html += `<div class="panel" style="margin-bottom:18px;">
    <h3 style="color:var(--marigold); margin-bottom:14px;">${tr('proc_section_centers','📍 Procurement Centers')}</h3>
    <div style="display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:14px;">`;
  PROCUREMENT_CENTERS.forEach(c => {
    html += `<div class="procurement-card">
      <div style="font-weight:700; font-size:.95rem; color:var(--leaf-bright); margin-bottom:6px;">🏛️ ${c.name}</div>
      <div style="font-size:.78rem; color:var(--cream-dim); margin-bottom:4px;">📍 ${c.address}</div>
      <div style="font-size:.78rem; color:var(--cream-dim);">🕐 ${tr('proc_open_hours','Operating Hours')}: ${c.hours}</div>
      <div style="font-size:.78rem; color:var(--cream-dim);">⚖️ ${tr('proc_bays_active','Active Bays')}: ${c.bays}</div>
      <div style="font-size:.78rem; color:var(--cream-dim); margin-top:4px;">🌾 ${tr('proc_crops_accepted','Crops Accepted')}: ${c.crops.join(', ')}</div>
    </div>`;
  });
  html += `</div></div>`;

  // ── Booking form ──
  html += `<div class="panel" style="margin-bottom:18px;">
    <h3 style="color:var(--marigold); margin-bottom:14px;">${tr('proc_section_book','📝 Book a Slot')}</h3>
    <div class="form-grid" style="gap:14px;">
      <div class="form-field">
        <label>${tr('proc_center','Select Center')}</label>
        <select class="plain" id="proc-center">
          ${PROCUREMENT_CENTERS.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-field">
        <label>${tr('proc_date','Date')}</label>
        <select class="plain" id="proc-date">
          <option value="${todayStr}">${tr('proc_today','Today')} (${todayStr})</option>
          <option value="${tomorrowStr}">${tr('proc_tomorrow','Tomorrow')} (${tomorrowStr})</option>
        </select>
      </div>
      <div class="form-field">
        <label>${tr('proc_slot','Time Slot')}</label>
        <select class="plain" id="proc-slot">
          ${PROCUREMENT_SLOTS.map(s => `<option value="${s}">${s}</option>`).join('')}
        </select>
      </div>
      <div class="form-field">
        <label>${tr('proc_crop','Crop')}</label>
        <select class="plain" id="proc-crop" onchange="updateProcMSP()">
          ${PROCUREMENT_CROPS.map(c => `<option value="${c.name}" data-msp="${c.msp}">${c.emoji} ${c.name} — ₹${c.msp.toLocaleString('en-IN')}${tr('proc_per_quintal','/quintal')}</option>`).join('')}
        </select>
      </div>
      <div class="form-field">
        <label>${tr('proc_qty','Quantity (Quintals)')}</label>
        <input type="number" class="plain" id="proc-qty" min="1" max="500" value="10" oninput="updateProcMSP()" placeholder="e.g. 10">
      </div>
      <div class="form-field">
        <label>${tr('proc_vehicle','Vehicle Number (Optional)')}</label>
        <input type="text" class="plain" id="proc-vehicle" placeholder="e.g. MH-12-AB-4521">
      </div>
      <div class="form-field" style="grid-column:1/-1;">
        <div style="display:flex; align-items:center; gap:16px; flex-wrap:wrap;">
          <div style="font-size:.85rem; color:var(--cream-dim);">${tr('proc_msp_rate','MSP Rate')}: <strong id="proc-msp-display" style="color:var(--leaf-bright);">₹2,275/quintal</strong></div>
          <div style="font-size:.85rem; color:var(--cream-dim);">${tr('proc_estimated_payout','Est. Payout')}: <strong id="proc-payout-display" style="color:var(--marigold);">₹22,750</strong></div>
        </div>
      </div>
      <div class="form-field" style="grid-column:1/-1;">
        <button class="btn btn-primary" onclick="bookProcurementSlot()" style="width:100%;">${tr('proc_book_btn','🏛️ Book Slot')}</button>
      </div>
    </div>
  </div>`;

  // ── Active bookings ──
  html += `<div class="panel" style="margin-bottom:18px;">
    <h3 style="color:var(--marigold); margin-bottom:14px;">${tr('proc_section_active','🎫 Your Active Booking')}</h3>
    <div id="proc-active-list">`;
  if (active.length === 0) {
    html += `<p style="color:var(--cream-dim); font-size:.85rem;">${tr('proc_no_active','No active bookings. Book a slot above to get started!')}</p>`;
  } else {
    active.forEach(b => { html += renderProcActiveCard(b); });
  }
  html += `</div></div>`;

  // ── Completed procurements ──
  html += `<div class="panel" style="margin-bottom:18px;">
    <h3 style="color:var(--marigold); margin-bottom:14px;">${tr('proc_section_completed','✅ Completed Procurements')}</h3>
    <div id="proc-completed-list">`;
  if (completed.length === 0) {
    html += `<p style="color:var(--cream-dim); font-size:.85rem;">${tr('proc_no_completed','No completed procurements yet.')}</p>`;
  } else {
    completed.forEach(b => { html += renderProcCompletedCard(b); });
  }
  html += `</div></div>`;

  contentEl.innerHTML = html;
  updateProcMSP();

  // Start auto-advance timer
  if (active.length > 0) {
    procQueueTimer = setInterval(() => {
      simulateQueueAdvance(false);
    }, 50000); // ~50 seconds
  }
}

function updateProcMSP() {
  const sel = document.getElementById('proc-crop');
  const qtyEl = document.getElementById('proc-qty');
  const mspDisp = document.getElementById('proc-msp-display');
  const payDisp = document.getElementById('proc-payout-display');
  if (!sel || !qtyEl || !mspDisp || !payDisp) return;
  const opt = sel.options[sel.selectedIndex];
  const msp = parseInt(opt.dataset.msp) || 2275;
  const qty = parseFloat(qtyEl.value) || 0;
  mspDisp.textContent = `₹${msp.toLocaleString('en-IN')}${tr('proc_per_quintal','/quintal')}`;
  payDisp.textContent = `₹${(msp * qty).toLocaleString('en-IN')}`;
}

function renderProcActiveCard(b) {
  const center = PROCUREMENT_CENTERS.find(c => c.id === b.centerId) || PROCUREMENT_CENTERS[0];
  const crop = PROCUREMENT_CROPS.find(c => c.name === b.cropName) || PROCUREMENT_CROPS[0];
  const stageIdx = PROC_STAGES.indexOf(b.stage);
  const farmersAhead = Math.max(0, b.currentToken ? (b.token - b.currentToken - 1) : b.farmersAhead);
  const waitMin = farmersAhead * 8;

  let stageLabels = [
    tr('proc_status_confirmed','Slot Confirmed'),
    tr('proc_status_gate','Gate Entry'),
    tr('proc_status_weighbridge','Weighbridge & Inspection'),
    tr('proc_status_complete','Procurement Complete'),
    tr('proc_status_payment','DBT Payment Released')
  ];

  let stepperHtml = '<div class="proc-stepper">';
  stageLabels.forEach((label, i) => {
    const cls = i < stageIdx ? 'done' : (i === stageIdx ? 'active' : '');
    stepperHtml += `<div class="proc-step ${cls}"><div class="proc-step-dot">${i < stageIdx ? '✓' : (i + 1)}</div><div class="proc-step-label">${label}</div></div>`;
    if (i < stageLabels.length - 1) stepperHtml += `<div class="proc-step-line ${i < stageIdx ? 'done' : ''}"></div>`;
  });
  stepperHtml += '</div>';

  return `<div class="procurement-card proc-active-card" data-booking-id="${b.id}">
    <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
      <div>
        <div style="font-weight:700; font-size:1rem; color:var(--leaf-bright);">${center.name}</div>
        <div style="font-size:.78rem; color:var(--cream-dim);">📍 ${center.address}</div>
        <div style="font-size:.78rem; color:var(--cream-dim); margin-top:4px;">📅 ${b.date} &nbsp;|&nbsp; 🕐 ${b.slot}</div>
      </div>
      <div class="token-pill">TK-${String(b.token).padStart(3,'0')}</div>
    </div>
    <div style="display:grid; grid-template-columns:repeat(auto-fill,minmax(140px,1fr)); gap:10px; margin-bottom:14px;">
      <div class="proc-stat-box">
        <div class="proc-stat-label">${tr('proc_crop','Crop')}</div>
        <div class="proc-stat-val">${crop.emoji} ${b.cropName}</div>
      </div>
      <div class="proc-stat-box">
        <div class="proc-stat-label">${tr('proc_qty','Quantity')}</div>
        <div class="proc-stat-val">${b.qty} ${tr('proc_quintal','quintals')}</div>
      </div>
      <div class="proc-stat-box">
        <div class="proc-stat-label">${tr('proc_estimated_payout','Est. Payout')}</div>
        <div class="proc-stat-val" style="color:var(--marigold);">₹${(crop.msp * b.qty).toLocaleString('en-IN')}</div>
      </div>
      <div class="proc-stat-box">
        <div class="proc-stat-label">${tr('proc_vehicle','Vehicle')}</div>
        <div class="proc-stat-val">${b.vehicle || '—'}</div>
      </div>
    </div>
    <div class="live-counter-board">
      <div class="queue-counter">
        <div class="queue-counter-label">${tr('proc_token','Your Token')}</div>
        <div class="queue-counter-val token-big">TK-${String(b.token).padStart(3,'0')}</div>
      </div>
      <div class="queue-counter">
        <div class="queue-counter-label">${tr('proc_serving','Currently Serving')}</div>
        <div class="queue-counter-val serving-big">TK-${String(b.currentToken).padStart(3,'0')}</div>
      </div>
      <div class="queue-counter">
        <div class="queue-counter-label">${tr('proc_ahead','Farmers Ahead')}</div>
        <div class="queue-counter-val ahead-big">${farmersAhead}</div>
      </div>
      <div class="queue-counter">
        <div class="queue-counter-label">${tr('proc_wait','Est. Wait Time')}</div>
        <div class="queue-counter-val wait-big">${waitMin > 0 ? waitMin + ' ' + tr('proc_minutes','min') : '—'}</div>
      </div>
    </div>
    ${stepperHtml}
    <div style="display:flex; gap:10px; margin-top:14px; flex-wrap:wrap;">
      <button class="btn btn-water btn-sm" onclick="simulateQueueAdvance(true)">${tr('proc_fast_forward','⏩ Fast Forward (Demo)')}</button>
      <button class="btn btn-ghost btn-sm" onclick="cancelProcurementSlot('${b.id}')" style="color:var(--danger);">${tr('proc_cancel_btn','Cancel Booking')}</button>
    </div>
  </div>`;
}

function renderProcCompletedCard(b) {
  const center = PROCUREMENT_CENTERS.find(c => c.id === b.centerId) || PROCUREMENT_CENTERS[0];
  const crop = PROCUREMENT_CROPS.find(c => c.name === b.cropName) || PROCUREMENT_CROPS[0];
  const netWeight = (b.qty * 0.97).toFixed(1);
  const totalPayout = Math.round(crop.msp * parseFloat(netWeight));

  return `<div class="procurement-card proc-completed-card">
    <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
      <div>
        <div style="font-weight:700; font-size:.95rem; color:var(--leaf-bright);">${center.name}</div>
        <div style="font-size:.78rem; color:var(--cream-dim);">📅 ${b.date} &nbsp;|&nbsp; 🕐 ${b.slot}</div>
      </div>
      <div class="token-pill" style="background:var(--leaf); color:#fff;">TK-${String(b.token).padStart(3,'0')}</div>
    </div>
    <div style="display:grid; grid-template-columns:repeat(auto-fill,minmax(140px,1fr)); gap:10px; margin-bottom:14px;">
      <div class="proc-stat-box">
        <div class="proc-stat-label">${tr('proc_crop','Crop')}</div>
        <div class="proc-stat-val">${crop.emoji} ${b.cropName}</div>
      </div>
      <div class="proc-stat-box">
        <div class="proc-stat-label">${tr('proc_quality','Quality Grade')}</div>
        <div class="proc-stat-val" style="color:var(--leaf-bright);">Grade A (FAQ)</div>
      </div>
      <div class="proc-stat-box">
        <div class="proc-stat-label">${tr('proc_net_weight','Net Weighed')}</div>
        <div class="proc-stat-val">${netWeight} ${tr('proc_quintal','quintals')}</div>
      </div>
      <div class="proc-stat-box">
        <div class="proc-stat-label">${tr('proc_total_payout','Total Payout')}</div>
        <div class="proc-stat-val" style="color:var(--marigold); font-weight:700;">₹${totalPayout.toLocaleString('en-IN')}</div>
      </div>
      <div class="proc-stat-box">
        <div class="proc-stat-label">${tr('proc_bay','Weighbridge Bay')}</div>
        <div class="proc-stat-val">Bay ${b.bay || 2}</div>
      </div>
      <div class="proc-stat-box">
        <div class="proc-stat-label">${tr('proc_dbt_status','DBT Status')}</div>
        <div class="proc-stat-val" style="color:var(--leaf-bright); font-size:.78rem;">${tr('proc_dbt_credited','✅ Credited via PFMS to Bank A/C ****4129')}</div>
      </div>
      <div class="proc-stat-box" style="grid-column:1/-1;">
        <div class="proc-stat-label">${tr('proc_txn_ref','Txn Ref')}</div>
        <div class="proc-stat-val" style="font-family:monospace; font-size:.78rem; color:var(--water-bright);">PFMS/${b.date?.replace(/-/g,'')}/${String(b.token).padStart(3,'0')}/${Math.random().toString(36).substring(2,8).toUpperCase()}</div>
      </div>
    </div>
  </div>`;
}

function bookProcurementSlot() {
  const centerId = document.getElementById('proc-center').value;
  const date = document.getElementById('proc-date').value;
  const slot = document.getElementById('proc-slot').value;
  const cropName = document.getElementById('proc-crop').value;
  const qty = parseFloat(document.getElementById('proc-qty').value) || 0;
  const vehicle = document.getElementById('proc-vehicle').value.trim();

  if (qty <= 0) { toast('Please enter a valid quantity', '⚠️'); return; }

  const bookings = getProcBookings();
  const activeExists = bookings.some(b => b.stage !== 'payment');
  if (activeExists) { toast('You already have an active booking. Complete or cancel it first.', '⚠️'); return; }

  const token = 38 + Math.floor(Math.random() * 12) + 1; // token 39-50
  const currentToken = token - (2 + Math.floor(Math.random() * 4)); // 2-5 ahead
  const center = PROCUREMENT_CENTERS.find(c => c.id === centerId);
  const bay = Math.floor(Math.random() * (center?.bays || 3)) + 1;

  const booking = {
    id: 'proc_' + Date.now(),
    centerId,
    date,
    slot,
    cropName,
    qty,
    vehicle,
    token,
    currentToken,
    farmersAhead: token - currentToken - 1,
    stage: 'confirmed',
    bay,
    createdAt: new Date().toISOString()
  };

  bookings.push(booking);
  saveProcBookings(bookings);
  toast(tr('proc_booked_success','Slot booked successfully! 🎉 Your token: ') + `TK-${String(token).padStart(3,'0')}`, '🏛️');
  renderProcurementTab();
}

function cancelProcurementSlot(bookingId) {
  let bookings = getProcBookings();
  bookings = bookings.filter(b => b.id !== bookingId);
  saveProcBookings(bookings);
  toast(tr('proc_cancelled','Booking cancelled.'), '🗑️');
  renderProcurementTab();
}

function simulateQueueAdvance(instant) {
  let bookings = getProcBookings();
  let changed = false;
  bookings.forEach(b => {
    if (b.stage === 'payment') return;
    const stageIdx = PROC_STAGES.indexOf(b.stage);

    if (instant) {
      // Fast forward: advance stage
      if (stageIdx < PROC_STAGES.length - 1) {
        b.stage = PROC_STAGES[stageIdx + 1];
        // Also advance queue counters
        if (b.currentToken < b.token) {
          b.currentToken = Math.min(b.token, b.currentToken + 1);
          b.farmersAhead = Math.max(0, b.token - b.currentToken - 1);
        }
        changed = true;
        if (b.stage === 'weighbridge' && b.currentToken >= b.token - 1) {
          toast(tr('proc_alert_called','🔔 Your token is being called! Proceed to Weighbridge Bay.'), '🔔');
        }
      }
    } else {
      // Automatic: advance queue by 1 token
      if (b.currentToken < b.token) {
        b.currentToken += 1;
        b.farmersAhead = Math.max(0, b.token - b.currentToken - 1);
        changed = true;
        // Auto-advance stage when it's your turn
        if (b.currentToken >= b.token - 1 && stageIdx < 2) {
          b.stage = PROC_STAGES[stageIdx + 1];
          if (b.stage === 'weighbridge') {
            toast(tr('proc_alert_called','🔔 Your token is being called! Proceed to Weighbridge Bay.'), '🔔');
          }
        }
      } else if (stageIdx < PROC_STAGES.length - 1) {
        b.stage = PROC_STAGES[stageIdx + 1];
        changed = true;
      }
    }
  });
  if (changed) {
    saveProcBookings(bookings);
    renderProcurementTab();
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

async function openChat(convId, otherId, otherName, otherAvatarUrl) {
    activeConversationId = convId;
    activeChatOtherUser = { id: otherId, name: otherName || 'User', avatar_url: otherAvatarUrl || '' };
    
    const user = await KS_AUTH.getUser();
    activeChatCurrentUserId = user ? user.id : null;
    
    document.getElementById('chat-drawer').classList.add('open');
    document.getElementById('chat-name').textContent = otherName || 'User';
    
    const avatarEl = document.getElementById('chat-avatar');
    if (avatarEl) {
        avatarEl.innerHTML = renderUserAvatar(otherAvatarUrl, 'user', 34);
    }
    
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
