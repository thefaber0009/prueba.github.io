// Application state
let currentView = 'orderType';
let orderType = '';
let customerName = '';
let cart = {};
let menuItems = [];

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    loadMenu();
    showView('orderTypeView');
});

// Menu data will be loaded from API
let menuData = [];

// View management
function showView(viewId) {
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    document.getElementById(viewId).classList.add('active');
    currentView = viewId;
}

// Order type selection
function selectOrderType(type) {
    orderType = type;
    document.getElementById('orderTypeText').textContent = 
        type === 'physical' ? 'Pedido en local' : 'Pedido a domicilio';
    showView('customerInfoView');
}

// Customer info submission
function submitCustomerInfo(event) {
    event.preventDefault();
    customerName = document.getElementById('customerName').value.trim();
    if (!customerName) return;
    
    document.getElementById('customerNameDisplay').textContent = customerName;
    showView('menuView');
}

// Load menu items from API
async function loadMenu() {
    try {
        const response = await fetch('/api/menu.php');
        const result = await response.json();
        
        if (result.success) {
            menuData = result.data;
            menuItems = menuData;
            renderMenu();
        } else {
            console.error('Error loading menu:', result.error);
            alert('Error al cargar el menú. Por favor recarga la página.');
        }
    } catch (error) {
        console.error('Network error loading menu:', error);
        alert('Error de conexión al cargar el menú. Por favor verifica tu conexión.');
    }
}

// Render menu
function renderMenu() {
    const traditionalContainer = document.getElementById('traditionalMenu');
    const specialContainer = document.getElementById('specialMenu');
    
    traditionalContainer.innerHTML = '';
    specialContainer.innerHTML = '';
    
    menuItems.forEach(item => {
        const menuItemElement = createMenuItemElement(item);
        if (item.category === 'traditional') {
            traditionalContainer.appendChild(menuItemElement);
        } else {
            specialContainer.appendChild(menuItemElement);
        }
    });
    
    updateOrderSummary();
}

// Create menu item element
function createMenuItemElement(item) {
    const div = document.createElement('div');
    div.className = 'menu-item';
    div.innerHTML = `
        <div class="menu-item-header">
            <div>
                <h4>${item.name}</h4>
                <p>${item.description}</p>
            </div>
            <div class="price">${formatPrice(item.price)}</div>
        </div>
        <div class="quantity-controls">
            <button type="button" class="quantity-btn" onclick="updateQuantity('${item.id}', -1)" ${!cart[item.id] ? 'disabled' : ''}>-</button>
            <div class="quantity-display">${cart[item.id] || 0}</div>
            <button type="button" class="quantity-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
        </div>
    `;
    return div;
}

// Update quantity
function updateQuantity(itemId, change) {
    if (!cart[itemId]) cart[itemId] = 0;
    cart[itemId] = Math.max(0, cart[itemId] + change);
    
    if (cart[itemId] === 0) {
        delete cart[itemId];
    }
    
    renderMenu();
}

// Update order summary
function updateOrderSummary() {
    const orderItemsContainer = document.getElementById('orderItems');
    const orderTotalContainer = document.getElementById('orderTotal');
    const continueBtn = document.getElementById('continueBtn');
    
    const orderItems = Object.keys(cart).map(itemId => {
        const item = menuItems.find(i => i.id === itemId);
        return {
            item,
            quantity: cart[itemId]
        };
    }).filter(orderItem => orderItem.quantity > 0);
    
    if (orderItems.length === 0) {
        orderItemsContainer.innerHTML = '<div class="order-summary-empty">Selecciona algunos buñuelos para continuar</div>';
        orderTotalContainer.innerHTML = '';
        continueBtn.style.display = 'none';
        return;
    }
    
    // Render order items
    orderItemsContainer.innerHTML = orderItems.map(orderItem => `
        <div class="order-item">
            <span>${orderItem.quantity}x ${orderItem.item.name}</span>
            <span>${formatPrice(orderItem.item.price * orderItem.quantity)}</span>
        </div>
    `).join('');
    
    // Calculate and render total
    const total = orderItems.reduce((sum, orderItem) => 
        sum + (orderItem.item.price * orderItem.quantity), 0);
    
    orderTotalContainer.innerHTML = `
        <div class="order-total">
            <div class="order-total-line">
                <span>Total:</span>
                <span>${formatPrice(total)}</span>
            </div>
        </div>
    `;
    
    continueBtn.style.display = 'block';
    continueBtn.textContent = orderType === 'delivery' ? 'Continuar con Entrega' : 'Ver Resumen';
}

// Continue to delivery or summary
function continueToDelivery() {
    if (orderType === 'delivery') {
        showView('deliveryView');
    } else {
        submitOrder();
    }
}

// Submit order to API
async function submitOrder(deliveryData = null) {
    const orderItems = Object.keys(cart).map(itemId => {
        const item = menuItems.find(i => i.id === itemId);
        return {
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: cart[itemId],
            category: item.category
        };
    }).filter(orderItem => orderItem.quantity > 0);
    
    if (orderItems.length === 0) {
        alert('No hay productos en el pedido');
        return;
    }
    
    const orderData = {
        customerName: customerName,
        orderType: orderType,
        items: orderItems,
        deliveryData: deliveryData
    };
    
    try {
        const response = await fetch('/api/orders.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            const order = result.data;
            showOrderConfirmation(order);
        } else {
            alert('Error al procesar el pedido: ' + (result.error || 'Error desconocido'));
        }
    } catch (error) {
        console.error('Network error submitting order:', error);
        alert('Error de conexión al procesar el pedido. Por favor intenta de nuevo.');
    }
}

// Show order confirmation
function showOrderConfirmation(order) {
    let summary = `
        ¡PEDIDO CONFIRMADO!\n\n
        Número: #${order.orderCode}\n
        Cliente: ${order.customerName}\n
        Turno: ${order.turnNumber}\n
        Tipo: ${order.orderType === 'physical' ? 'Pedido Físico' : 'Domicilio'}\n
        Cola: ${order.queueType}\n\n
        PRODUCTOS:\n`;
    
    order.items.forEach(item => {
        summary += `${item.quantity}x ${item.name} - ${formatPrice(item.price * item.quantity)}\n`;
    });
    
    summary += `\nTOTAL: ${formatPrice(order.total)}`;
    
    alert(summary);
    resetOrder();
}

// Reset order
function resetOrder() {
    cart = {};
    customerName = '';
    orderType = '';
    document.getElementById('customerName').value = '';
    showView('orderTypeView');
}

// Navigation
function goBack() {
    if (currentView === 'customerInfoView') {
        showView('orderTypeView');
    } else if (currentView === 'menuView') {
        showView('customerInfoView');
    } else if (currentView === 'deliveryView') {
        showView('menuView');
    }
}

// Admin access
function showAdminLogin() {
    const password = prompt('Ingrese la contraseña de administrador:');
    if (password === 'admin123') {
        window.location.href = 'pages/admin.html';
    } else if (password !== null) {
        alert('Contraseña incorrecta');
    }
}

// Delivery form submission
function submitDeliveryForm(event) {
    event.preventDefault();
    
    const deliveryData = {
        phone: document.getElementById('phone').value.trim(),
        address: document.getElementById('address').value.trim(),
        neighborhood: document.getElementById('neighborhood').value.trim(),
        paymentMethod: document.getElementById('paymentMethod').value
    };
    
    // Validate required fields
    if (!deliveryData.phone || !deliveryData.address || !deliveryData.neighborhood) {
        alert('Por favor completa todos los campos obligatorios');
        return;
    }
    
    submitOrder(deliveryData);
}

// Utility functions
function formatPrice(price) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(price);
}