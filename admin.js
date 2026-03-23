document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    const db = firebase.firestore();
    const ordersContainer = document.getElementById('ordersContainer');
    const refreshBtn = document.getElementById('refreshBtn');
    const statusFilter = document.getElementById('statusFilter');
    const paymentFilter = document.getElementById('paymentFilter');
    const searchInput = document.getElementById('searchInput');
    const notification = document.getElementById('notification');
    
    let orders = [];
    let unsubscribeOrders = null;
    
    // Cargar pedidos iniciales
    loadOrders();
    
    // Configurar eventos
    refreshBtn.addEventListener('click', loadOrders);
    statusFilter.addEventListener('change', filterOrders);
    paymentFilter.addEventListener('change', filterOrders);
    searchInput.addEventListener('input', filterOrders);
    
    // Función para cargar pedidos
    function loadOrders() {
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cargando...';
        
        // Cancelar listener anterior si existe
        if (unsubscribeOrders) {
            unsubscribeOrders();
        }
        
        ordersContainer.innerHTML = '';
        orders = [];
        
        // Nuevo listener con snapshot optimizado
        unsubscribeOrders = db.collection('orders')
            .orderBy('createdAt', 'desc')
            .onSnapshot(querySnapshot => {
                // Limpiar solo si es una carga inicial
                if (orders.length === 0) {
                    ordersContainer.innerHTML = '';
                }
                
                const changes = querySnapshot.docChanges();
                
                changes.forEach(change => {
                    const order = change.doc.data();
                    order.id = change.doc.id;
                    
                    if (change.type === 'added') {
                        // Solo agregar si no existe ya
                        if (!orders.some(o => o.id === order.id)) {
                            orders.push(order);
                            renderOrder(order);
                        }
                    } else if (change.type === 'modified') {
                        // Actualizar pedido existente
                        const index = orders.findIndex(o => o.id === order.id);
                        if (index !== -1) {
                            orders[index] = order;
                            updateOrderInDOM(order);
                        }
                    } else if (change.type === 'removed') {
                        // Eliminar pedido
                        orders = orders.filter(o => o.id !== order.id);
                        removeOrderFromDOM(order.id);
                    }
                });
                
                refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Actualizar';
            }, error => {
                console.error("Error al cargar pedidos:", error);
                showNotification('Error al cargar pedidos', 'error');
                refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Actualizar';
            });
    }
    
    // Función para renderizar un pedido
    function renderOrder(order) {
        // Verificar si el pedido ya existe en el DOM
        if (document.getElementById(`order-${order.id}`)) {
            return;
        }
        
        const orderElement = document.createElement('div');
        orderElement.className = 'order-card';
        orderElement.id = `order-${order.id}`;
        
        // Calcular total de productos
        const itemsTotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        // Formatear fecha
        const orderDate = order.createdAt?.toDate() || new Date();
        const formattedDate = orderDate.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Mapear estado a clases CSS
        const statusClass = {
            'pending': '',
            'paid': 'paid',
            'cancelled': 'cancelled'
        }[order.status] || '';
        
        // Crear HTML del pedido
        orderElement.innerHTML = `
            <div class="order-header">
                <div class="order-id">Pedido #${order.orderNumber || order.id.substring(0, 8)}</div>
                <div class="order-status ${statusClass}">
                    ${getStatusText(order.status)}
                </div>
            </div>
            <div class="order-body">
                <div class="order-meta">
                    <div class="meta-item">
                        <div class="meta-label">Fecha</div>
                        <div class="meta-value">${formattedDate}</div>
                    </div>
                    <div class="meta-item">
                        <div class="meta-label">Cliente</div>
                        <div class="meta-value">${order.user?.name || 'No especificado'}</div>
                    </div>
                    <div class="meta-item">
                        <div class="meta-label">Método de Pago</div>
                        <div class="meta-value">${getPaymentMethodText(order.paymentMethod)}</div>
                    </div>
                    <div class="meta-item">
                        <div class="meta-label">Teléfono</div>
                        <div class="meta-value">${order.user?.phone || 'No especificado'}</div>
                    </div>
                </div>
                
                ${order.yapeCode ? `
                <div class="meta-item">
                    <div class="meta-label">Código Yape</div>
                    <div class="meta-value">${order.yapeCode}</div>
                </div>
                ` : ''}
                
                <div class="order-items">
                    ${order.items.map(item => `
                        <div class="order-item">
                            <img src="${item.img || 'https://via.placeholder.com/50'}" alt="${item.title}" class="item-img">
                            <div class="item-details">
                                <div class="item-name">${item.title}</div>
                                <div class="item-price">
                                    ${item.quantity} x $${item.price.toFixed(2)} | Talla: ${item.size || 'Única'}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="order-total">
                    <span>Total:</span>
                    <span>$${(order.total || itemsTotal).toFixed(2)}</span>
                </div>
                
                <div class="order-actions">
                    ${order.status === 'pending' ? `
                    <button class="action-btn approve-btn" data-id="${order.id}">
                        <i class="fas fa-check"></i> Aprobar
                    </button>
                    <button class="action-btn cancel-btn" data-id="${order.id}">
                        <i class="fas fa-times"></i> Cancelar
                    </button>
                    ` : ''}
                    
                    <button class="action-btn details-btn" data-id="${order.id}">
                        <i class="fas fa-eye"></i> Detalles
                    </button>
                </div>
            </div>
        `;
        
        ordersContainer.appendChild(orderElement);
        
        // Añadir eventos a los botones
        if (order.status === 'pending') {
            orderElement.querySelector('.approve-btn').addEventListener('click', () => updateOrderStatus(order.id, 'paid'));
            orderElement.querySelector('.cancel-btn').addEventListener('click', () => updateOrderStatus(order.id, 'cancelled'));
        }
        
        orderElement.querySelector('.details-btn').addEventListener('click', () => {
            showOrderDetails(order);
        });
    }
    
    // Función para actualizar un pedido en el DOM
    function updateOrderInDOM(order) {
        const existingOrder = document.getElementById(`order-${order.id}`);
        if (existingOrder) {
            existingOrder.remove();
        }
        renderOrder(order);
    }
    
    // Función para eliminar un pedido del DOM
    function removeOrderFromDOM(orderId) {
        const orderElement = document.getElementById(`order-${orderId}`);
        if (orderElement) {
            orderElement.remove();
        }
    }
    
    // Función para mostrar detalles del pedido
    function showOrderDetails(order) {
        // Implementa un modal con más detalles aquí
        console.log("Mostrar detalles del pedido:", order);
    }
    
    // Función para actualizar el estado de un pedido
    function updateOrderStatus(orderId, newStatus) {
        const confirmMessage = newStatus === 'paid' 
            ? '¿Marcar este pedido como pagado? Se notificará al cliente.' 
            : '¿Cancelar este pedido? Se notificará al cliente.';
        
        if (!confirm(confirmMessage)) return;
        
        db.collection('orders').doc(orderId).update({
            status: newStatus,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            adminAction: true
        })
        .then(() => {
            showNotification(`Pedido ${newStatus === 'paid' ? 'aprobado' : 'cancelado'} con éxito`);
            
            // Actualizar el pedido en la lista
            const index = orders.findIndex(o => o.id === orderId);
            if (index !== -1) {
                orders[index].status = newStatus;
                updateOrderInDOM(orders[index]);
            }
        })
        .catch(error => {
            console.error("Error al actualizar pedido:", error);
            showNotification('Error al actualizar pedido', 'error');
        });
    }
    
    // Función para filtrar pedidos
    function filterOrders() {
        const status = statusFilter.value;
        const paymentMethod = paymentFilter.value;
        const searchTerm = searchInput.value.toLowerCase();
        
        ordersContainer.innerHTML = '';
        
        orders.forEach(order => {
            // Filtrar por estado
            if (status !== 'all' && order.status !== status) return;
            
            // Filtrar por método de pago
            if (paymentMethod !== 'all' && order.paymentMethod !== paymentMethod) return;
            
            // Filtrar por término de búsqueda
            if (searchTerm) {
                const matchesId = order.id.toLowerCase().includes(searchTerm);
                const matchesNumber = order.orderNumber?.toLowerCase().includes(searchTerm);
                const matchesName = order.user?.name?.toLowerCase().includes(searchTerm);
                
                if (!matchesId && !matchesNumber && !matchesName) return;
            }
            
            renderOrder(order);
        });
    }
    
    // Función para mostrar notificaciones
    function showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        const notificationText = document.getElementById('notificationText');
        
        notification.className = 'notification';
        notificationText.textContent = message;
        
        // Cambiar color según tipo
        if (type === 'error') {
            notification.style.backgroundColor = '#e74c3c';
        } else if (type === 'warning') {
            notification.style.backgroundColor = '#f39c12';
        } else {
            notification.style.backgroundColor = '#2ecc71';
        }
        
        notification.classList.add('show');
        
        // Ocultar después de 3 segundos
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
    
    // Funciones auxiliares
    function getStatusText(status) {
        const statusText = {
            'pending': 'Pendiente',
            'paid': 'Pagado',
            'cancelled': 'Cancelado'
        };
        return statusText[status] || status;
    }
    
    function getPaymentMethodText(method) {
        const methodText = {
            'yape': 'Yape',
            'credit-card': 'Tarjeta de Crédito',
            'plin': 'Plin',
            'visa': 'Visa'
        };
        return methodText[method] || method;
    }
    
    // Limpiar listeners al salir
    window.addEventListener('beforeunload', () => {
        if (unsubscribeOrders) {
            unsubscribeOrders();
        }
    });
});