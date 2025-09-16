// Admin Panel JavaScript
let orders = [];
let filteredOrders = [];

// Initialize admin panel
document.addEventListener('DOMContentLoaded', function() {
    loadOrders();
    setupEventListeners();
    
    // Auto-refresh every 30 seconds
    setInterval(loadOrders, 30000);
});

// Setup event listeners
function setupEventListeners() {
    document.getElementById('refreshBtn').addEventListener('click', loadOrders);
    document.getElementById('statusFilter').addEventListener('change', filterOrders);
    document.getElementById('typeFilter').addEventListener('change', filterOrders);
    document.getElementById('queueFilter').addEventListener('change', filterOrders);
}

// Load orders from API
async function loadOrders() {
    try {
        const response = await fetch('/api/orders');
        const result = await response.json();
        
        if (result.success) {
            orders = result.data || [];
            filterOrders();
            updateStats();
        } else {
            console.error('Error loading orders:', result.error);
            showError('Error al cargar los pedidos');
        }
    } catch (error) {
        console.error('Network error:', error);
        showError('Error de conexión');
    }
}

// Filter orders based on current filter values
function filterOrders() {
    const statusFilter = document.getElementById('statusFilter').value;
    const typeFilter = document.getElementById('typeFilter').value;
    const queueFilter = document.getElementById('queueFilter').value;
    
    filteredOrders = orders.filter(order => {
        if (statusFilter !== 'all' && order.status !== statusFilter) return false;
        if (typeFilter !== 'all' && order.orderType !== typeFilter) return false;
        if (queueFilter !== 'all' && order.queueType !== queueFilter) return false;
        return true;
    });
    
    renderOrders();
}

// Update statistics
function updateStats() {
    const pending = orders.filter(o => o.status === 'pending').length;
    const preparing = orders.filter(o => o.status === 'preparing').length;
    const ready = orders.filter(o => o.status === 'ready').length;
    const totalRevenue = orders.filter(o => o.status === 'delivered')
        .reduce((sum, o) => sum + o.total, 0);
    
    document.getElementById('pendingCount').textContent = pending;
    document.getElementById('preparingCount').textContent = preparing;
    document.getElementById('readyCount').textContent = ready;
    document.getElementById('totalRevenue').textContent = formatPrice(totalRevenue);
}

// Render orders list
function renderOrders() {
    const ordersList = document.getElementById('ordersList');
    
    if (filteredOrders.length === 0) {
        ordersList.innerHTML = `
            <div class="empty-state">
                <div class="icon">📋</div>
                <h3>No hay pedidos</h3>
                <p>Los nuevos pedidos aparecerán aquí automáticamente</p>
            </div>
        `;
        return;
    }
    
    ordersList.innerHTML = filteredOrders.map(order => createOrderCard(order)).join('');
}

// Create order card HTML
function createOrderCard(order) {
    const statusClass = `status-${order.status}`;
    const statusLabel = getStatusLabel(order.status);
    const orderDate = new Date(order.orderDate).toLocaleString('es-CO');
    
    return `
        <div class="order-card">
            <div class="order-header">
                <div class="order-info">
                    <h3>#${order.orderCode}</h3>
                    <p>${order.customerName}</p>
                </div>
                <div class="order-status">
                    <span class="status-badge ${statusClass}">${statusLabel}</span>
                    <span style="font-size: 0.75rem; color: #64748b;">${order.turnNumber} - ${order.queueType}</span>
                </div>
            </div>
            
            <div class="order-meta">
                <span class="meta-item">
                    ${order.orderType === 'delivery' ? '🚚 Domicilio' : '🏪 Físico'}
                </span>
                <span class="meta-item">${orderDate}</span>
                <span class="meta-item" style="color: #d97706; font-weight: 600;">
                    ${formatPrice(order.total)}
                </span>
            </div>
            
            <div class="order-items">
                ${order.items.map(item => `${item.quantity}x ${item.name}`).join(', ')}
            </div>
            
            ${order.deliveryData ? `
                <div class="delivery-info">
                    <p><strong>Teléfono:</strong> ${order.deliveryData.phone || 'N/A'}</p>
                    <p><strong>Dirección:</strong> ${order.deliveryData.address || 'N/A'}</p>
                    <p><strong>Barrio:</strong> ${order.deliveryData.neighborhood || 'N/A'}</p>
                    <p><strong>Pago:</strong> ${order.deliveryData.paymentMethod || 'N/A'}</p>
                </div>
            ` : ''}
            
            <div class="order-actions">
                ${getOrderActions(order)}
            </div>
        </div>
    `;
}

// Get status label in Spanish
function getStatusLabel(status) {
    switch (status) {
        case 'pending': return 'Pendiente';
        case 'preparing': return 'Preparando';
        case 'ready': return 'Listo';
        case 'delivered': return 'Entregado';
        default: return 'Desconocido';
    }
}

// Get available actions for order based on status
function getOrderActions(order) {
    let actions = [];
    
    if (order.status === 'pending') {
        actions.push(`
            <button class="btn-primary btn-small" onclick="updateOrderStatus('${order.id}', 'preparing')">
                Comenzar Preparación
            </button>
        `);
    }
    
    if (order.status === 'preparing') {
        actions.push(`
            <button class="btn-primary btn-small" onclick="updateOrderStatus('${order.id}', 'ready')">
                Marcar Listo
            </button>
        `);
    }
    
    if (order.status === 'ready') {
        actions.push(`
            <button class="btn-primary btn-small" onclick="updateOrderStatus('${order.id}', 'delivered')">
                Marcar Entregado
            </button>
        `);
    }
    
    // Always show print action
    actions.push(`
        <button class="btn-secondary btn-small" onclick="printOrder('${order.id}')">
            🖨️ Imprimir
        </button>
    `);
    
    // Show WhatsApp action for delivery orders
    if (order.orderType === 'delivery') {
        actions.push(`
            <button class="btn-secondary btn-small" onclick="sendWhatsApp('${order.id}')">
                📱 WhatsApp
            </button>
        `);
    }
    
    return actions.join('');
}

// Update order status
async function updateOrderStatus(orderId, newStatus) {
    try {
        const response = await fetch('/api/orders', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: orderId,
                status: newStatus
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Update local order
            const order = orders.find(o => o.id === orderId);
            if (order) {
                order.status = newStatus;
                filterOrders();
                updateStats();
            }
            
            showSuccess(`Estado del pedido actualizado a: ${getStatusLabel(newStatus)}`);
        } else {
            showError('Error al actualizar el estado del pedido');
        }
    } catch (error) {
        console.error('Error updating order status:', error);
        showError('Error de conexión al actualizar el pedido');
    }
}

// Print order
function printOrder(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    // Create printable content
    const printContent = `
        <div style="font-family: monospace; padding: 20px; max-width: 300px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h2>🧄 El Rey de los Buñuelos</h2>
                <p>Ticket de Pedido</p>
            </div>
            
            <div style="margin-bottom: 15px;">
                <p><strong>Pedido:</strong> #${order.orderCode}</p>
                <p><strong>Turno:</strong> ${order.turnNumber}</p>
                <p><strong>Cliente:</strong> ${order.customerName}</p>
                <p><strong>Tipo:</strong> ${order.orderType === 'delivery' ? 'Domicilio' : 'Físico'}</p>
                <p><strong>Cola:</strong> ${order.queueType}</p>
                <p><strong>Fecha:</strong> ${new Date(order.orderDate).toLocaleString('es-CO')}</p>
            </div>
            
            <div style="margin-bottom: 15px; border-top: 1px solid #ccc; padding-top: 10px;">
                <h3>Productos:</h3>
                ${order.items.map(item => `
                    <p>${item.quantity}x ${item.name} - ${formatPrice(item.price * item.quantity)}</p>
                `).join('')}
            </div>
            
            <div style="border-top: 1px solid #ccc; padding-top: 10px; text-align: center;">
                <p style="font-size: 18px;"><strong>TOTAL: ${formatPrice(order.total)}</strong></p>
            </div>
            
            ${order.deliveryData ? `
                <div style="margin-top: 15px; border-top: 1px solid #ccc; padding-top: 10px;">
                    <h3>Datos de Entrega:</h3>
                    <p><strong>Teléfono:</strong> ${order.deliveryData.phone || 'N/A'}</p>
                    <p><strong>Dirección:</strong> ${order.deliveryData.address || 'N/A'}</p>
                    <p><strong>Barrio:</strong> ${order.deliveryData.neighborhood || 'N/A'}</p>
                </div>
            ` : ''}
        </div>
    `;
    
    // Open print window
    const printWindow = window.open('', '', 'width=400,height=600');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
}

// Send WhatsApp message
function sendWhatsApp(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order || !order.deliveryData) return;
    
    const phone = order.deliveryData.phone;
    const message = `¡Hola ${order.customerName}! Tu pedido #${order.orderCode} está ${getStatusLabel(order.status).toLowerCase()}. Total: ${formatPrice(order.total)}`;
    
    const whatsappUrl = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

// Show success message
function showSuccess(message) {
    // Simple alert for now - could be replaced with better notification system
    alert('✅ ' + message);
}

// Show error message
function showError(message) {
    // Simple alert for now - could be replaced with better notification system
    alert('❌ ' + message);
}

// Format price utility
function formatPrice(price) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(price);
}