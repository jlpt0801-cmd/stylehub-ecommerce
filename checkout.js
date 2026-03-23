document.addEventListener('DOMContentLoaded', function() {
    // 1. INICIALIZACIÓN FIREBASE
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    const db = firebase.firestore();

    // 2. VARIABLES GLOBALES
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const orderItems = document.getElementById('order-items');
    const subtotalElement = document.getElementById('subtotal');
    const shippingElement = document.getElementById('shipping');
    const totalElement = document.getElementById('total');
    const placeOrderBtn = document.getElementById('place-order');
    const confirmationModal = document.getElementById('confirmation-modal');
    
    let subtotal = 0;
    const shipping = 15.00;
    let currentPaymentCode = '';
    let currentOrderId = '';
    let paymentListener = null;

    // 3. MOSTRAR PRODUCTOS
    function displayCartItems() {
        orderItems.innerHTML = '';
        subtotal = 0;
        
        if (cart.length === 0) {
            orderItems.innerHTML = '<p class="empty-cart">No hay productos en tu carrito</p>';
            placeOrderBtn.disabled = true;
            return;
        }
        
        cart.forEach(item => {
            const orderItem = document.createElement('div');
            orderItem.classList.add('order-item');
            
            orderItem.innerHTML = `
                <img src="${item.img}" alt="${item.title}" class="order-item-img">
                <div class="order-item-details">
                    <h4 class="order-item-title">${item.title}</h4>
                    <p class="order-item-price">$${(item.price * item.quantity).toFixed(2)}</p>
                    <p class="order-item-quantity">Cantidad: ${item.quantity}</p>
                    ${item.size ? `<p class="order-item-size">Talla: ${item.size}</p>` : ''}
                </div>
            `;
            
            orderItems.appendChild(orderItem);
            subtotal += item.price * item.quantity;
        });
        
        updateTotals();
        placeOrderBtn.disabled = false;
    }

    function updateTotals() {
        subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
        shippingElement.textContent = `$${shipping.toFixed(2)}`;
        totalElement.textContent = `$${(subtotal + shipping).toFixed(2)}`;
    }

    // 4. MANEJO DE PAGOS
    function generatePaymentCode(method) {
        const prefix = method === 'yape' ? 'YAPE' : method === 'plin' ? 'PLIN' : 'PAY';
        currentPaymentCode = `${prefix}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        
        if (method === 'yape' || method === 'plin') {
            const qrContainer = document.querySelector(`#${method}-details .qr-code`);
            if (qrContainer) {
                qrContainer.innerHTML = `
                    <img src="images/yape/qr2.jpeg" 
                        alt="QR ${method}" class="qr-image">
                    <div class="payment-instructions">
                        <p><strong>Código:</strong> ${currentPaymentCode}</p>
                        <p><strong>Número ${method}:</strong> 999 888 777</p>
                        <p><strong>Monto:</strong> $${(subtotal + shipping).toFixed(2)}</p>
                        <p class="warning">⚠️ Debes incluir el código en el mensaje de pago</p>
                    </div>
                `;
            }
        }
        
        return currentPaymentCode;
    }

    // 5. VALIDACIONES
    function validateForm() {
        // Validar información de contacto
        const requiredFields = [
            { id: 'name', name: 'Nombre completo' },
            { id: 'email', name: 'Correo electrónico' },
            { id: 'phone', name: 'Teléfono' },
            { id: 'address', name: 'Dirección' },
            { id: 'city', name: 'Ciudad' },
            { id: 'zip', name: 'Código postal' },
            { id: 'country', name: 'País' }
        ];

        for (const field of requiredFields) {
            const element = document.getElementById(field.id);
            if (!element.value.trim()) {
                alert(`Por favor completa el campo: ${field.name}`);
                element.focus();
                element.style.borderColor = 'red';
                return false;
            }
            element.style.borderColor = '#ddd';
        }

        // Validar método de pago
        const paymentMethod = document.querySelector('input[name="payment"]:checked');
        if (!paymentMethod) {
            alert('Por favor selecciona un método de pago');
            return false;
        }

        // Validaciones específicas por método de pago
        if (paymentMethod.value === 'credit-card') {
            if (!validateCreditCard()) return false;
        } else if (paymentMethod.value === 'visa') {
            if (!validateVisa()) return false;
        }

        return true;
    }

    function validateCreditCard() {
        const required = [
            { id: 'card-number', name: 'Número de tarjeta', regex: /^\d{16}$/ },
            { id: 'card-expiry', name: 'Fecha de expiración', regex: /^\d{2}\/\d{2}$/ },
            { id: 'card-cvc', name: 'Código CVC', regex: /^\d{3}$/ },
            { id: 'card-name', name: 'Nombre en la tarjeta' }
        ];

        return validateFields(required);
    }

    function validateVisa() {
        const required = [
            { id: 'visa-card-number', name: 'Número Visa', regex: /^\d{16}$/ },
            { id: 'visa-card-expiry', name: 'Fecha de expiración', regex: /^\d{2}\/\d{2}$/ },
            { id: 'visa-card-cvc', name: 'Código CVC', regex: /^\d{3}$/ },
            { id: 'visa-card-name', name: 'Nombre en la tarjeta' }
        ];

        return validateFields(required);
    }

    function validateFields(fields) {
        for (const field of fields) {
            const element = document.getElementById(field.id);
            const value = element.value.trim();
            
            if (!value) {
                alert(`Por favor completa: ${field.name}`);
                element.focus();
                element.style.borderColor = 'red';
                return false;
            }
            
            if (field.regex && !field.regex.test(value)) {
                alert(`Formato incorrecto para: ${field.name}`);
                element.focus();
                element.style.borderColor = 'red';
                return false;
            }
            
            element.style.borderColor = '#ddd';
        }
        return true;
    }

    // 6. PROCESAR PEDIDO
    placeOrderBtn.addEventListener('click', async function() {
        if (!validateForm()) return;
        
        placeOrderBtn.disabled = true;
        placeOrderBtn.textContent = 'Procesando...';
        
        try {
            const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
            const orderNumber = 'STYLE-' + Date.now();
            
            const orderData = {
                orderNumber: orderNumber,
                user: getUserData(),
                items: cart,
                status: 'pending', // Todos los métodos quedan como pendientes
                total: subtotal + shipping,
                paymentMethod: paymentMethod,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                requiresApproval: true // Nuevo campo para identificar que necesita aprobación
            };
            
            // Generar código para métodos que lo requieran
            if (paymentMethod === 'yape' || paymentMethod === 'plin') {
                orderData.paymentCode = generatePaymentCode(paymentMethod);
                orderData.qrImage = document.querySelector('.qr-image')?.src;
            }
            
            // Guardar en Firebase
            const docRef = await db.collection('orders').add(orderData);
            currentOrderId = docRef.id;
            
            // Mostrar instrucciones según el método de pago
            listenForPaymentUpdate(orderNumber);
            showPaymentInstructions(paymentMethod);
            
        } catch (error) {
            console.error("Error:", error);
            alert("Error al procesar el pedido. Intenta nuevamente.");
        } finally {
            placeOrderBtn.disabled = false;
            placeOrderBtn.textContent = 'Realizar pedido';
        }
    });

    function getUserData() {
        return {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            address: document.getElementById('address').value,
            city: document.getElementById('city').value,
            zip: document.getElementById('zip').value,
            country: document.getElementById('country').value,
            notes: document.getElementById('notes').value
        };
    }

                // Reemplaza la función listenForPaymentUpdate en tu checkout.js con esta versión mejorada
function listenForPaymentUpdate(orderNumber) {
    // Cancelar listener anterior si existe
    if (paymentListener) {
        paymentListener();
    }
    
    paymentListener = db.collection('orders')
        .where('orderNumber', '==', orderNumber)
        .onSnapshot(snapshot => {
            snapshot.docChanges().forEach(change => {
                if (change.type === 'modified') {
                    const orderData = change.doc.data();
                    
                    if (orderData.status === 'paid') {
                        showConfirmation(orderNumber);
                        clearCart();
                        
                        // Mostrar notificación al usuario
                        showPaymentNotification('¡Tu pago ha sido confirmado!', 'success');
                        
                        // Cerrar listener
                        if (paymentListener) {
                            paymentListener();
                            paymentListener = null;
                        }
                    } else if (orderData.status === 'cancelled') {
                        // Mostrar notificación persistente de cancelación
                        showPersistentCancellationNotification(orderData);
                        
                        // No limpiamos el carrito para permitir reintentar
                        if (paymentListener) {
                            paymentListener();
                            paymentListener = null;
                        }
                    }
                }
            });
        });
}

// Añade esta nueva función para mostrar la notificación persistente
function showPersistentCancellationNotification(orderData) {
    // Cerrar cualquier modal de pago existente
    const existingModals = document.querySelectorAll('.modal-overlay.active');
    existingModals.forEach(modal => modal.remove());

    // Crear notificación persistente
    const notification = document.createElement('div');
    notification.className = 'cancellation-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <h3>Pedido Cancelado</h3>
            <p>Tu pedido ha sido cancelado por el administrador.</p>
            ${orderData.cancelReason ? `<p><strong>Motivo:</strong> ${orderData.cancelReason}</p>` : ''}
            <div class="notification-actions">
                <button id="retry-order" class="btn-primary">Intentar nuevamente</button>
                <button id="close-notification" class="btn-secondary">Entendido</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Eventos para los botones
    notification.querySelector('#retry-order').addEventListener('click', () => {
        notification.remove();
        // Aquí puedes redirigir al carrito o reiniciar el proceso
        window.location.href = 'checkout.html';
    });
    
    notification.querySelector('#close-notification').addEventListener('click', () => {
        notification.remove();
    });
}

    // 7. INTERFAZ DE USUARIO
    function showPaymentInstructions(method) {
        const methodNames = {
            'yape': 'Yape',
            'plin': 'Plin',
            'credit-card': 'Tarjeta de Crédito',
            'visa': 'Visa'
        };

        const modalContent = `
            <div class="payment-modal">
                <h2>¡Pedido registrado con éxito!</h2>
                <div class="payment-instructions-container">
                    <p>Tu pedido con ${methodNames[method]} está pendiente de aprobación.</p>
                    
                    ${method === 'yape' || method === 'plin' ? `
                    <div class="payment-details">
                        <img src="images/yape/qr2.jpeg" 
                            alt="QR ${methodNames[method]}">
                        <div>
                            <p><strong>Código:</strong> ${currentPaymentCode}</p>
                            <p><strong>Número:</strong> 999 888 777</p>
                            <p><strong>Monto:</strong> $${(subtotal + shipping).toFixed(2)}</p>
                        </div>
                    </div>
                    <p class="important">⚠️ Asegúrate de incluir el código en el mensaje de pago</p>
                    ` : ''}
                    
                    <p>Recibirás una notificación cuando verifiquemos tu pago (normalmente en 5-15 minutos).</p>
                    <button id="close-payment-modal" class="btn-primary">Entendido</button>
                </div>
            </div>
        `;
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.innerHTML = modalContent;
        document.body.appendChild(modal);
        
        modal.querySelector('#close-payment-modal').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }

    function showPaymentNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `payment-notification ${type}`;
        notification.innerHTML = `
            <p>${message}</p>
            <button class="close-notification">&times;</button>
        `;
        document.body.appendChild(notification);
        
        // Cerrar notificación después de 5 segundos
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                notification.remove();
            }, 500);
        }, 5000);
        
        // Evento para cerrar manualmente
        notification.querySelector('.close-notification').addEventListener('click', () => {
            notification.remove();
        });
    }

    function showConfirmation(orderNumber) {
        document.getElementById('order-number').textContent = orderNumber;
        
        // Calcular fecha de entrega
        const deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + 3 + Math.floor(Math.random() * 3));
        document.getElementById('delivery-date').textContent = deliveryDate.toLocaleDateString('es-ES', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        });
        
        // Mostrar productos en factura
        const invoiceItems = document.getElementById('invoice-items');
        invoiceItems.innerHTML = '';
        
        cart.forEach(item => {
            invoiceItems.innerHTML += `
                <div class="invoice-item">
                    <span>${item.title} x ${item.quantity}</span>
                    <span>$${(item.price * item.quantity).toFixed(2)}</span>
                </div>
            `;
        });
        
        // Mostrar totales
        document.getElementById('invoice-subtotal').textContent = `$${subtotal.toFixed(2)}`;
        document.getElementById('invoice-shipping').textContent = `$${shipping.toFixed(2)}`;
        document.getElementById('invoice-total').textContent = `$${(subtotal + shipping).toFixed(2)}`;
        
        confirmationModal.classList.add('active');
    }

    function clearCart() {
        localStorage.removeItem('cart');
        localStorage.removeItem('cartTotal');
        updateCartCount();
    }

    function updateCartCount() {
        const cartCount = document.querySelectorAll('.cart-count');
        cartCount.forEach(element => {
            element.textContent = '0';
        });
    }

    // 8. EVENTOS ADICIONALES
    document.querySelectorAll('input[name="payment"]').forEach(radio => {
        radio.addEventListener('change', function() {
            document.querySelectorAll('.payment-details').forEach(details => {
                details.style.display = 'none';
            });
            
            const detailsId = this.id + '-details';
            const detailsElement = document.getElementById(detailsId);
            if (detailsElement) {
                detailsElement.style.display = 'block';
                
                if (this.id === 'yape' || this.id === 'plin') {
                    generatePaymentCode(this.value);
                }
            }
        });
    });

    document.querySelector('.close-modal')?.addEventListener('click', () => {
        confirmationModal.classList.remove('active');
    });

    document.querySelector('.continue-shopping')?.addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    document.querySelector('.back-to-cart')?.addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    document.querySelector('.print-invoice')?.addEventListener('click', printInvoice);

    // 9. INICIALIZACIÓN
    displayCartItems();
    document.getElementById('credit-card-details').style.display = 'block';
    
    // Limpiar listeners al salir
    window.addEventListener('beforeunload', () => {
        if (paymentListener) {
            paymentListener();
        }
    });
});

// 10. FUNCIÓN PARA IMPRIMIR
function printInvoice() {
    const printWindow = window.open('', '_blank');
    const invoiceContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Factura StyleHub</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
                .invoice-header { text-align: center; margin-bottom: 30px; }
                .invoice-header h1 { color: #000; margin: 10px 0; }
                .invoice-info { display: flex; justify-content: space-between; margin-bottom: 20px; }
                .invoice-items { width: 100%; border-collapse: collapse; margin: 20px 0; }
                .invoice-items th { background: #f5f5f5; padding: 10px; text-align: left; }
                .invoice-items td { padding: 10px; border-bottom: 1px solid #eee; }
                .invoice-totals { float: right; width: 300px; margin-top: 20px; }
                .invoice-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
                .total { font-weight: bold; font-size: 1.1em; border-top: 1px solid #333; padding-top: 8px; }
                .thank-you { text-align: center; margin-top: 40px; font-style: italic; color: #666; }
                @media print { body { padding: 0; } }
            </style>
        </head>
        <body>
            <div class="invoice-header">
                <h1>STYLEHUB</h1>
                <h2>FACTURA</h2>
                <p>N° ${document.getElementById('order-number').textContent}</p>
            </div>
            
            <div class="invoice-info">
                <div>
                    <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
                    <p><strong>Cliente:</strong> ${document.getElementById('name').value}</p>
                </div>
                <div>
                    <p><strong>Email:</strong> ${document.getElementById('email').value}</p>
                    <p><strong>Teléfono:</strong> ${document.getElementById('phone').value}</p>
                </div>
            </div>
            
            <table class="invoice-items">
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Precio Unit.</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${Array.from(document.querySelectorAll('.invoice-item')).map(item => {
                        const parts = item.textContent.split('$');
                        const nameQty = parts[0].trim().split(' x ');
                        return `
                            <tr>
                                <td>${nameQty[0]}</td>
                                <td>${nameQty[1]}</td>
                                <td>$${(parseFloat(parts[1])/parseInt(nameQty[1])).toFixed(2)}</td>
                                <td>$${parts[1]}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
            
            <div class="invoice-totals">
                <div class="invoice-row">
                    <span>Subtotal:</span>
                    <span>${document.getElementById('invoice-subtotal').textContent}</span>
                </div>
                <div class="invoice-row">
                    <span>Envío:</span>
                    <span>${document.getElementById('invoice-shipping').textContent}</span>
                </div>
                <div class="invoice-row total">
                    <span>Total:</span>
                    <span>${document.getElementById('invoice-total').textContent}</span>
                </div>
            </div>
            
            <div class="thank-you">
                <p>¡Gracias por tu compra en StyleHub!</p>
                <p>Fecha estimada de entrega: ${document.getElementById('delivery-date').textContent}</p>
            </div>
            
            <script>
                window.onload = function() {
                    setTimeout(() => {
                        window.print();
                        window.close();
                    }, 300);
                };
            </script>
        </body>
        </html>
    `;
    
    printWindow.document.open();
    printWindow.document.write(invoiceContent);
    printWindow.document.close();
}