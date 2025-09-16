// =======================
// 🔐 Sesión y seguridad
// =======================
const user = JSON.parse(localStorage.getItem("adminUser"));
if (!user) {
  window.location.href = "login.html";
}

// =======================
// 📊 Variables globales
// =======================
let orders = [];
let autoRefreshInterval = null;
let notificationsEnabled = localStorage.getItem('notificationsEnabled') !== 'false';
let lastOrderCount = 0;
let audioContext = null;

// Contadores de turnos
let turnCounters = {
  tradicional: parseInt(localStorage.getItem("turnCounter_tradicional") || "0"),
  especiales: parseInt(localStorage.getItem("turnCounter_especiales") || "0")
};

// =======================
// 🔊 Sistema de audio
// =======================
function initAudio() {
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  } catch (e) {
    console.log('Audio no soportado');
  }
}

function playNotificationSound() {
  if (!notificationsEnabled || !audioContext) return;

  try {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (e) {
    console.log('Error reproduciendo sonido:', e);
  }
}

function playTestSound() {
  if (!audioContext) initAudio();
  playNotificationSound();
  showNotification('Sonido de prueba reproducido', 'success');
}

// =======================
// 🔔 Sistema de notificaciones
// =======================
function toggleNotifications() {
  notificationsEnabled = !notificationsEnabled;
  localStorage.setItem('notificationsEnabled', notificationsEnabled);
  updateNotificationButton();
}

function updateNotificationButton() {
  const btn = document.getElementById('notificationToggle');
  if (btn) {
    btn.textContent = notificationsEnabled ? '🔔 Notificaciones: ON' : '🔕 Notificaciones: OFF';
    btn.classList.toggle('active', notificationsEnabled);
  }
}

function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  
  notification.innerHTML = `
    <div class="notification-content">
      <span class="notification-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️'}</span>
      <span>${message}</span>
      <button class="close-notification" onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => notification.classList.add('show'), 100);
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 300);
  }, 4000);
  
  if (notificationsEnabled && type === 'success') {
    playNotificationSound();
  }
}

// =======================
// 🚪 Logout
// =======================
function logout() {
  localStorage.removeItem("adminUser");
  window.location.href = "login.html";
}

// =======================
// 🖥️ Inicializar dashboard
// =======================
function initializeDashboard() {
  // Mostrar nombre del usuario
  try {
    const userData = JSON.parse(localStorage.getItem("adminUser"));
    const adminNameElement = document.getElementById("adminName");
    if (adminNameElement && userData) {
      adminNameElement.textContent = userData.username || userData.full_name || 'Admin';
    }
  } catch (e) {
    console.error('Error parsing user data:', e);
  }

  // Configurar URL del QR
  const currentUrl = window.location.origin + window.location.pathname.replace("dashboard.html", "index.html");
  const qrUrlInput = document.getElementById("qrUrl");
  if (qrUrlInput) {
    qrUrlInput.value = currentUrl;
  }

  // Inicializar audio
  initAudio();
  
  // Configurar botón de notificaciones
  const notificationToggleBtn = document.getElementById('notificationToggle');
  if (notificationToggleBtn) {
    notificationToggleBtn.addEventListener('click', toggleNotifications);
    updateNotificationButton();
  }

  // Cargar datos iniciales
  updateQueueCounters();
  loadOrders();
  setupAutoRefresh();

  console.log("✅ Dashboard inicializado");
}

// =======================
// 📂 Mostrar secciones
// =======================
function showSection(sectionName) {
  const sections = document.querySelectorAll(".content-section");
  sections.forEach((section) => section.classList.remove("active"));

  const tabs = document.querySelectorAll(".nav-tab");
  tabs.forEach((tab) => tab.classList.remove("active"));

  const targetSection = document.getElementById(sectionName + "-section");
  if (targetSection) {
    targetSection.classList.add("active");
  }
  
  // Encontrar el tab que se clickeó
  const clickedTab = Array.from(tabs).find(tab => 
    tab.textContent.toLowerCase().includes(sectionName.toLowerCase()) ||
    (sectionName === 'orders' && tab.textContent.includes('Pedidos')) ||
    (sectionName === 'queues' && tab.textContent.includes('Turnos')) ||
    (sectionName === 'qr-generator' && tab.textContent.includes('QR')) ||
    (sectionName === 'reports' && tab.textContent.includes('Reportes'))
  );
  
  if (clickedTab) {
    clickedTab.classList.add("active");
  }
}

// =======================
// 📦 Gestión de pedidos
// =======================
function loadOrders() {
  try {
    const adminOrders = JSON.parse(localStorage.getItem("adminOrders") || "[]");
    orders = adminOrders.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    // Detectar nuevos pedidos
    if (orders.length > lastOrderCount) {
      const newOrdersCount = orders.length - lastOrderCount;
      if (lastOrderCount > 0) { // No mostrar en la primera carga
        showNotification(`${newOrdersCount} nuevo${newOrdersCount > 1 ? 's' : ''} pedido${newOrdersCount > 1 ? 's' : ''} recibido${newOrdersCount > 1 ? 's' : ''}!`, 'success');
      }
      lastOrderCount = orders.length;
    }

    displayOrders();
    updateStats();
  } catch (error) {
    console.error("Error cargando pedidos:", error);
    showNotification("Error cargando pedidos", "error");
  }
}

function displayOrders() {
  const container = document.getElementById("ordersGrid");
  if (!container) return;

  if (orders.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="icon">📋</div>
        <h3>No hay pedidos</h3>
        <p>Los nuevos pedidos aparecerán aquí automáticamente</p>
      </div>
    `;
    return;
  }

  const sortedOrders = [...orders].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  container.innerHTML = sortedOrders.map((order) => createOrderCard(order)).join("");
}

function createOrderCard(order) {
  const statusClass = order.status || "pending";
  const statusLabel = getStatusLabel(order.status || "pending");

  return `
    <div class="order-card ${statusClass}" data-order-id="${order.id}">
      <div class="order-header">
        <div class="order-code">#${order.code || order.order_code || 'N/A'}</div>
        <div class="order-turn">${order.turn || order.turn_number || 'N/A'}</div>
      </div>
      
      <div class="customer-name">👤 ${order.customer || order.customer_name || 'Cliente'}</div>
      
      <div class="order-meta">
        <span>${formatDate(order.date || order.order_date || order.timestamp)}</span>
        <span class="status-badge status-${statusClass}">${statusLabel}</span>
      </div>
      
      <div class="order-items">
        ${formatOrderItems(order)}
      </div>
      
      <div class="order-total">
        <span>Total:</span>
        <span class="total-amount">${formatPrice(order.total || order.total_amount || 0)}</span>
      </div>
      
      <div class="order-actions">
        ${getActionButtons(order)}
      </div>
    </div>
  `;
}

function formatDate(dateInput) {
  if (!dateInput) return 'N/A';
  
  try {
    let date;
    if (typeof dateInput === 'number') {
      date = new Date(dateInput);
    } else if (typeof dateInput === 'string') {
      date = new Date(dateInput);
    } else {
      return 'N/A';
    }
    
    return date.toLocaleString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return 'N/A';
  }
}

function formatPrice(price) {
  if (!price && price !== 0) return '0';
  return parseFloat(price).toLocaleString('es-CO');
}

function formatOrderItems(order) {
  if (order.items && Array.isArray(order.items)) {
    return order.items.map(item => `
      <div class="order-item">
        <span>${item.quantity || 1}x ${item.name || 'Item'}</span>
        <span>${formatPrice(item.total || item.price || 0)}</span>
      </div>
    `).join('');
  } else if (order.items_detail) {
    return order.items_detail.split(', ').map(item => `
      <div class="order-item">${item}</div>
    `).join('');
  } else {
    return '<div class="order-item">Sin items especificados</div>';
  }
}

function getStatusLabel(status) {
  const labels = {
    pending: "Pendiente",
    preparing: "Preparando",
    ready: "Listo",
    delivered: "Entregado"
  };
  return labels[status] || "Pendiente";
}

function getQueueLabel(queueType) {
  const labels = {
    tradicional: "Tradicional",
    especiales: "Especiales",
    mixto: "Mixto"
  };
  return labels[queueType] || "Sin definir";
}

function getActionButtons(order) {
  const status = order.status || "pending";

  switch (status) {
    case "pending":
      return `
        <button class="action-btn btn-primary" onclick="updateOrderStatus(${order.id}, 'preparing')">🔥 Comenzar Preparación</button>
        <button class="action-btn btn-danger" onclick="cancelOrder(${order.id})">❌ Cancelar</button>
      `;
    case "preparing":
      return `
        <button class="action-btn btn-success" onclick="updateOrderStatus(${order.id}, 'ready')">✅ Marcar Listo</button>
        <button class="action-btn btn-warning" onclick="updateOrderStatus(${order.id}, 'pending')">⬅️ Volver a Pendiente</button>
      `;
    case "ready":
      return `
        <button class="action-btn btn-success" onclick="updateOrderStatus(${order.id}, 'delivered')">📦 Marcar Entregado</button>
        <button class="action-btn btn-primary" onclick="updateOrderStatus(${order.id}, 'preparing')">⬅️ Volver a Preparación</button>
      `;
    case "delivered":
      return `
        <button class="action-btn btn-warning" onclick="updateOrderStatus(${order.id}, 'ready')">⬅️ Marcar Listo</button>
        <button class="action-btn btn-danger" onclick="cancelOrder(${order.id})">🗑️ Eliminar</button>
      `;
    default:
      return "";
  }
}

function updateOrderStatus(orderId, newStatus) {
  const orderIndex = orders.findIndex((order) => order.id === orderId);
  if (orderIndex === -1) {
    showNotification("Pedido no encontrado", "error");
    return;
  }

  orders[orderIndex].status = newStatus;
  orders[orderIndex].lastUpdated = Date.now();
  localStorage.setItem("adminOrders", JSON.stringify(orders));

  displayOrders();
  updateStats();
  showNotification(`Pedido actualizado a ${getStatusLabel(newStatus)}`, "success");
}

function cancelOrder(orderId) {
  if (!confirm("¿Estás seguro de que quieres cancelar/eliminar este pedido?")) {
    return;
  }

  const orderIndex = orders.findIndex((order) => order.id === orderId);
  if (orderIndex !== -1) {
    orders.splice(orderIndex, 1);
    localStorage.setItem("adminOrders", JSON.stringify(orders));

    displayOrders();
    updateStats();
    showNotification("Pedido eliminado", "warning");
  }
}

// =======================
// 📊 Estadísticas
// =======================
function updateStats() {
  const stats = {
    pending: orders.filter((o) => (o.status || "pending") === "pending").length,
    preparing: orders.filter((o) => o.status === "preparing").length,
    ready: orders.filter((o) => o.status === "ready").length,
    total: orders.reduce((sum, order) => sum + parseFloat(order.total || order.total_amount || 0), 0)
  };

  const statElements = {
    statPending: document.getElementById("statPending"),
    statPreparing: document.getElementById("statPreparing"),
    statReady: document.getElementById("statReady"),
    statTotal: document.getElementById("statTotal")
  };

  if (statElements.statPending) statElements.statPending.textContent = stats.pending;
  if (statElements.statPreparing) statElements.statPreparing.textContent = stats.preparing;
  if (statElements.statReady) statElements.statReady.textContent = stats.ready;
  if (statElements.statTotal) statElements.statTotal.textContent = `${formatPrice(stats.total)}`;
}

// =======================
// 🎛️ Filtrar pedidos
// =======================
function filterOrders() {
  const statusFilter = document.getElementById("statusFilter");
  const queueFilter = document.getElementById("queueFilter");
  
  if (!statusFilter || !queueFilter) return;

  const statusValue = statusFilter.value;
  const queueValue = queueFilter.value;

  let filteredOrders = [...orders];

  if (statusValue !== "all") {
    filteredOrders = filteredOrders.filter(
      (order) => (order.status || "pending") === statusValue
    );
  }

  if (queueValue !== "all") {
    filteredOrders = filteredOrders.filter((order) => order.queueType === queueValue);
  }

  const container = document.getElementById("ordersGrid");
  if (!container) return;

  if (filteredOrders.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="icon">🔍</div>
        <h3>No se encontraron pedidos</h3>
        <p>Intenta cambiar los filtros de búsqueda</p>
      </div>
    `;
  } else {
    const sortedOrders = [...filteredOrders].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    container.innerHTML = sortedOrders.map((order) => createOrderCard(order)).join("");
  }
}

function refreshOrders() {
  loadOrders();
  showNotification("Pedidos actualizados", "success");
}

function setupAutoRefresh() {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
  }
  autoRefreshInterval = setInterval(() => {
    loadOrders();
  }, 10000); // Cada 10 segundos
}

// =======================
// 🎫 Gestión de turnos
// =======================
function updateQueueCounters() {
  const tradicionalElement = document.getElementById("tradicionalCounter");
  const especialesElement = document.getElementById("especialesCounter");
  
  if (tradicionalElement) {
    tradicionalElement.textContent = turnCounters.tradicional;
  }
  if (especialesElement) {
    especialesElement.textContent = turnCounters.especiales;
  }
}

function adjustQueue(queueType, change) {
  turnCounters[queueType] = Math.max(0, turnCounters[queueType] + change);
  localStorage.setItem(
    `turnCounter_${queueType}`,
    turnCounters[queueType].toString()
  );
  updateQueueCounters();
  showNotification(
    `Contador ${queueType} actualizado: ${turnCounters[queueType]}`,
    "success"
  );
}

function resetQueue(queueType) {
  if (!confirm(`¿Estás seguro de resetear la fila ${queueType}?`)) return;
  turnCounters[queueType] = 0;
  localStorage.setItem(`turnCounter_${queueType}`, "0");
  updateQueueCounters();
  showNotification(`Fila ${queueType} reseteada`, "success");
}

function resetAllQueues() {
  if (!confirm("¿Estás seguro de resetear TODAS las filas de turnos?")) return;
  turnCounters.tradicional = 0;
  turnCounters.especiales = 0;
  localStorage.setItem("turnCounter_tradicional", "0");
  localStorage.setItem("turnCounter_especiales", "0");
  updateQueueCounters();
  showNotification("Todas las filas han sido reseteadas", "success");
}

// =======================
// 📱 Generador de QR
// =======================
function generateQRCode() {
  const qrUrl = document.getElementById("qrUrl");
  const qrContainer = document.getElementById("qrContainer");
  const qrCodeDiv = document.getElementById("qrcode");

  if (!qrUrl || !qrContainer || !qrCodeDiv) {
    showNotification("Error: elementos no encontrados", "error");
    return;
  }

  const url = qrUrl.value;
  if (!url) {
    showNotification("URL no válida", "error");
    return;
  }

  qrCodeDiv.innerHTML = "";

  if (typeof QRCode === "undefined") {
    qrCodeDiv.innerHTML = `
      <div style="padding: 20px; background: #f0f0f0; border-radius: 10px;">
        <p>📱 Código QR para:</p>
        <code style="background: white; padding: 10px; display: block; margin: 10px 0; word-break: break-all;">${url}</code>
        <p><small>Librería QR no disponible. Usa la URL directamente.</small></p>
      </div>
    `;
  } else {
    try {
      QRCode.toCanvas(qrCodeDiv, url, {
        width: 300,
        height: 300,
        margin: 4,
        color: { dark: "#8B4513", light: "#FFFFFF" }
      });
    } catch (error) {
      console.error("Error generando QR:", error);
      qrCodeDiv.innerHTML = "<p>Error generando QR. Verifica la URL.</p>";
    }
  }

  qrContainer.style.display = "block";
  showNotification("Código QR generado", "success");
}

function downloadQR() {
  const canvas = document.querySelector("#qrcode canvas");
  if (canvas) {
    const link = document.createElement("a");
    link.download = "qr-pedidos-bunuelos.png";
    link.href = canvas.toDataURL();
    link.click();
    showNotification("QR descargado", "success");
  } else {
    showNotification("No hay QR para descargar", "warning");
  }
}

function printQR() {
  const canvas = document.querySelector("#qrcode canvas");
  if (canvas) {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Código QR - El Rey de los Buñuelos</title>
          <style>
            body { text-align: center; font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #8B4513; }
            img { margin: 20px 0; }
          </style>
        </head>
        <body>
          <h1>🧄 El Rey de los Buñuelos 🧄</h1>
          <h2>Escanea para hacer tu pedido</h2>
          <img src="${canvas.toDataURL()}" alt="Código QR">
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 1000);
  } else {
    showNotification("No hay QR para imprimir", "warning");
  }
}

// =======================
// 📊 Reportes
// =======================
function generateReport() {
  const reportContainer = document.getElementById("dailyReport");
  if (!reportContainer) return;

  try {
    const today = new Date().toDateString();
    const todayOrders = orders.filter(
      (order) => {
        const orderDate = new Date(order.timestamp || order.order_date || order.date);
        return orderDate.toDateString() === today;
      }
    );

    const stats = {
      total: todayOrders.length,
      pending: todayOrders.filter((o) => (o.status || "pending") === "pending").length,
      preparing: todayOrders.filter((o) => o.status === "preparing").length,
      ready: todayOrders.filter((o) => o.status === "ready").length,
      delivered: todayOrders.filter((o) => o.status === "delivered").length,
      revenue: todayOrders.reduce((sum, order) => sum + parseFloat(order.total || order.total_amount || 0), 0),
      avgOrder: 0
    };

    stats.avgOrder = stats.total > 0 ? stats.revenue / stats.total : 0;

    reportContainer.innerHTML = `
      <div class="orders-grid">
        <div class="order-card">
          <h4>📈 Resumen del Día</h4>
          <div class="order-total">
            <span>Total Pedidos:</span>
            <span class="total-amount">${stats.total}</span>
          </div>
          <div class="order-total">
            <span>Entregados:</span>
            <span class="total-amount">${stats.delivered}</span>
          </div>
        </div>
        <div class="order-card">
          <h4>💰 Finanzas</h4>
          <div class="order-total">
            <span>Ingresos del Día:</span>
            <span class="total-amount">${formatPrice(stats.revenue)}</span>
          </div>
          <div class="order-total">
            <span>Pedido Promedio:</span>
            <span class="total-amount">${formatPrice(stats.avgOrder)}</span>
          </div>
        </div>
      </div>
    `;
    
    showNotification("Reporte generado exitosamente", "success");
  } catch (error) {
    console.error("Error generando reporte:", error);
    reportContainer.innerHTML = '<div style="color: red; text-align: center; padding: 20px;"><strong>Error:</strong> No se pudo generar el reporte.</div>';
    showNotification("Error generando reporte", "error");
  }
}

function exportReport() {
  try {
    const today = new Date().toISOString().split("T")[0];
    const todayOrders = orders.filter(
      (order) => {
        const orderDate = new Date(order.timestamp || order.order_date || order.date);
        return orderDate.toDateString() === new Date().toDateString();
      }
    );

    if (todayOrders.length === 0) {
      showNotification("No hay datos para exportar del día de hoy", "warning");
      return;
    }

    const headers = [
      "Fecha",
      "Turno",
      "Cliente",
      "Código",
      "Estado",
      "Fila",
      "Productos",
      "Total"
    ];
    
    const csvContent = [
      headers.join(","),
      ...todayOrders.map((order) =>
        [
          `"${formatDate(order.date || order.order_date || order.timestamp)}"`,
          `"${order.turn || order.turn_number || 'N/A'}"`,
          `"${order.customer || order.customer_name || 'Cliente'}"`,
          `"${order.code || order.order_code || 'N/A'}"`,
          `"${getStatusLabel(order.status || "pending")}"`,
          `"${getQueueLabel(order.queueType)}"`,
          `"${order.items ? order.items.map((item) => `${item.quantity}x ${item.name}`).join("; ") : 'Sin items'}"`,
          `"${formatPrice(order.total || order.total_amount || 0)}"`
        ].join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `reporte-${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification(`Reporte exportado: ${todayOrders.length} pedidos`, "success");
  } catch (error) {
    console.error("Error exportando reporte:", error);
    showNotification("Error exportando reporte", "error");
  }
}

// =======================
// 🚀 Inicialización
// =======================
document.addEventListener("DOMContentLoaded", function() {
  // Verificar sesión
  const user = localStorage.getItem('adminUser');
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  
  // Inicializar dashboard
  initializeDashboard();
  
  // Permitir interacción con audio en primera acción del usuario
  document.addEventListener('click', function initAudioContext() {
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume();
    }
  }, { once: true });
});

// Event listeners adicionales
document.addEventListener('click', function(e) {
  if (e.target && e.target.matches('.nav-tab')) {
    const buttonText = e.target.textContent.toLowerCase();
    let sectionName = 'orders'; // default
    
    if (buttonText.includes('pedidos')) {
      sectionName = 'orders';
    } else if (buttonText.includes('turnos')) {
      sectionName = 'queues';
    } else if (buttonText.includes('qr')) {
      sectionName = 'qr-generator';
    } else if (buttonText.includes('reportes')) {
      sectionName = 'reports';
    }
    
    showSection(sectionName);
  }
});

// Agregar estas funciones al dashboard.js existente (al final del archivo)

// =======================
// 🔔 SISTEMA DE NOTIFICACIONES MEJORADO
// =======================

// Detectar nuevos pedidos mediante localStorage
function setupOrderNotificationListener() {
  // Listener para cambios en localStorage
  window.addEventListener('storage', function(e) {
    if (e.key === 'lastOrderNotification' && e.newValue) {
      try {
        const notification = JSON.parse(e.newValue);
        if (notification && notification.message) {
          showNotification(notification.message, 'success');
          // Forzar recarga de pedidos
          setTimeout(() => {
            loadOrders();
          }, 500);
        }
      } catch (error) {
        console.error('Error procesando notificación:', error);
      }
    }
    
    if (e.key === 'adminOrders' && e.newValue) {
      // Se agregó un nuevo pedido, recargar automáticamente
      setTimeout(() => {
        loadOrders();
      }, 500);
    }
  });

  // Listener para eventos personalizados (misma ventana)
  window.addEventListener('newOrderCreated', function(e) {
    if (e.detail && e.detail.message) {
      showNotification(e.detail.message, 'success');
      setTimeout(() => {
        loadOrders();
      }, 500);
    }
  });
}

// Verificar periódicamente nuevos pedidos (backup method)
function setupPeriodicNotificationCheck() {
  let lastNotificationCheck = Date.now();
  
  setInterval(() => {
    try {
      const notificationData = localStorage.getItem('lastOrderNotification');
      if (notificationData) {
        const notification = JSON.parse(notificationData);
        if (notification && notification.timestamp > lastNotificationCheck) {
          showNotification(notification.message || 'Nuevo pedido recibido', 'success');
          lastNotificationCheck = notification.timestamp;
          
          // Cargar pedidos inmediatamente
          loadOrders();
        }
      }
    } catch (error) {
      console.error('Error en verificación periódica:', error);
    }
  }, 2000); // Verificar cada 2 segundos
}

// Mejorar la detección de nuevos pedidos en loadOrders()
function loadOrdersWithBetterNotification() {
  try {
    const adminOrders = JSON.parse(localStorage.getItem("adminOrders") || "[]");
    const newOrders = adminOrders.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    
    // Detectar nuevos pedidos de manera más precisa
    const previousOrderIds = orders.map(order => order.id);
    const currentOrderIds = newOrders.map(order => order.id);
    
    const newOrderIds = currentOrderIds.filter(id => !previousOrderIds.includes(id));
    
    if (newOrderIds.length > 0 && orders.length > 0) {
      // Solo mostrar notificación si ya había pedidos cargados (no es la primera carga)
      showNotification(
        `${newOrderIds.length} nuevo${newOrderIds.length > 1 ? 's' : ''} pedido${newOrderIds.length > 1 ? 's' : ''} recibido${newOrderIds.length > 1 ? 's' : ''}!`, 
        'success'
      );
      
      // Hacer parpadear el título de la página
      blinkPageTitle();
    }

    orders = newOrders;
    displayOrders();
    updateStats();
    
  } catch (error) {
    console.error("Error cargando pedidos:", error);
    showNotification("Error cargando pedidos", "error");
  }
}

// Hacer parpadear el título cuando hay nuevos pedidos
function blinkPageTitle() {
  const originalTitle = document.title;
  let blinkCount = 0;
  const maxBlinks = 6;
  
  const blinkInterval = setInterval(() => {
    if (blinkCount % 2 === 0) {
      document.title = "🔔 ¡NUEVO PEDIDO! - Dashboard";
    } else {
      document.title = originalTitle;
    }
    
    blinkCount++;
    
    if (blinkCount >= maxBlinks) {
      clearInterval(blinkInterval);
      document.title = originalTitle;
    }
  }, 500);
}

// Reproducir sonido de notificación más fuerte
function playStrongerNotificationSound() {
  if (!notificationsEnabled || !audioContext) return;

  try {
    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Primer tono
    oscillator1.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator1.frequency.setValueAtTime(600, audioContext.currentTime + 0.15);
    oscillator1.frequency.setValueAtTime(800, audioContext.currentTime + 0.3);
    
    // Segundo tono (armonía)
    oscillator2.frequency.setValueAtTime(400, audioContext.currentTime);
    oscillator2.frequency.setValueAtTime(300, audioContext.currentTime + 0.15);
    oscillator2.frequency.setValueAtTime(400, audioContext.currentTime + 0.3);
    
    gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
    
    oscillator1.start(audioContext.currentTime);
    oscillator1.stop(audioContext.currentTime + 0.4);
    oscillator2.start(audioContext.currentTime);
    oscillator2.stop(audioContext.currentTime + 0.4);
    
  } catch (e) {
    console.log('Error reproduciendo sonido mejorado:', e);
  }
}

// Modificar la función showNotification existente para usar mejor sonido
const originalShowNotification = showNotification;
function showNotification(message, type = 'success') {
  // Llamar a la función original
  originalShowNotification(message, type);
  
  // Si es una notificación de nuevo pedido, usar sonido más fuerte
  if (type === 'success' && message.toLowerCase().includes('pedido')) {
    playStrongerNotificationSound();
  }
}

// Actualizar la función de inicialización
function initializeDashboardWithNotifications() {
  // Llamar a la inicialización original
  initializeDashboard();
  
  // Configurar listeners de notificaciones
  setupOrderNotificationListener();
  setupPeriodicNotificationCheck();
  
  // Reemplazar loadOrders con la versión mejorada
  window.loadOrders = loadOrdersWithBetterNotification;
  
  console.log("✅ Sistema de notificaciones mejorado activado");
}

// Reemplazar el event listener original
document.addEventListener("DOMContentLoaded", function() {
  // Verificar sesión
  const user = localStorage.getItem('adminUser');
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  
  // Inicializar dashboard con notificaciones mejoradas
  initializeDashboardWithNotifications();
  
  // Permitir interacción con audio en primera acción del usuario
  document.addEventListener('click', function initAudioContext() {
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume();
    }
  }, { once: true });
});

