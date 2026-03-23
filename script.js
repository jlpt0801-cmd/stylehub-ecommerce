document.addEventListener('DOMContentLoaded', function() {
    // Carruseles de productos
    setupCarousels();
    
    // Carrusel fullscreen
    setupFullscreenCarousel();
    
    // Carrusel automático de marcas
    setupBrandsCarousel();
    
    // Carrito de compras
    setupCart();
    
    // Función de búsqueda
    setupSearch();
});

// ==================== FUNCIÓN DE BÚSQUEDA ====================
function setupSearch() {
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const searchResults = document.getElementById('search-results');
    const searchContainer = document.querySelector('.search-container');
    
    if (!searchInput || !searchButton || !searchResults || !searchContainer) return;
    
    // Array con todos los productos
    const allProducts = [];
    
    // Recoger todos los productos de los carruseles
    document.querySelectorAll('.carousel-slide').forEach(slide => {
        allProducts.push({
            name: slide.querySelector('h4').textContent,
            price: slide.querySelector('p').textContent,
            image: slide.querySelector('img').src,
            element: slide
        });
    });
    
    // Función para buscar productos
    function searchProducts(query) {
        if (!query.trim()) {
            searchResults.innerHTML = '';
            searchResults.style.display = 'none';
            return;
        }
        
        const lowerQuery = query.toLowerCase();
        const results = allProducts.filter(product => 
            product.name.toLowerCase().includes(lowerQuery)
        );
        
        displayResults(results);
    }
    
    // Mostrar resultados
    function displayResults(results) {
        searchResults.innerHTML = '';
        
        if (results.length === 0) {
            searchResults.innerHTML = '<p class="no-results">No se encontraron productos</p>';
            searchResults.style.display = 'block';
            return;
        }
        
        results.slice(0, 5).forEach(result => {
            const resultItem = document.createElement('div');
            resultItem.classList.add('search-result-item');
            resultItem.innerHTML = `
                <img src="${result.image}" alt="${result.name}">
                <div class="search-result-info">
                    <h4>${result.name}</h4>
                    <p>${result.price}</p>
                </div>
            `;
            
            resultItem.addEventListener('click', () => {
                // Desplazarse al producto y resaltarlo
                result.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                highlightProduct(result.element);
                searchResults.style.display = 'none';
                searchInput.value = '';
            });
            
            searchResults.appendChild(resultItem);
        });
        
        searchResults.style.display = 'block';
    }
    
    // Resaltar producto encontrado
    function highlightProduct(element) {
        element.style.boxShadow = '0 0 0 3px rgba(0,150,255,0.5)';
        element.style.transition = 'box-shadow 0.3s ease';
        
        setTimeout(() => {
            element.style.boxShadow = 'none';
        }, 2000);
    }
    
    // Event listeners
    searchInput.addEventListener('input', (e) => {
        searchProducts(e.target.value);
    });
    
    searchButton.addEventListener('click', () => {
        searchProducts(searchInput.value);
    });
    
    // Ocultar resultados al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (!searchContainer.contains(e.target)) {
            searchResults.style.display = 'none';
        }
    });
    
    // Presionar Enter para buscar
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchProducts(searchInput.value);
        }
    });
    
    // Añadir estilos para la búsqueda
    const searchStyles = document.createElement('style');
    searchStyles.textContent = `
        .search-container {
            position: relative;
            display: flex;
            align-items: center;
        }
        
        .search-container input {
            padding: 8px 15px;
            border: 1px solid #ddd;
            border-radius: 20px;
            outline: none;
            width: 200px;
            transition: width 0.3s;
        }
        
        .search-container input:focus {
            width: 250px;
            border-color: #555;
        }
        
        .search-container button {
            background: none;
            border: none;
            cursor: pointer;
            margin-left: -35px;
            color: #555;
        }
        
        .search-results {
            display: none;
            position: absolute;
            top: 100%;
            left: 0;
            width: 100%;
            max-height: 400px;
            overflow-y: auto;
            background: white;
            border: 1px solid #ddd;
            border-radius: 5px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            z-index: 1000;
            margin-top: 5px;
        }
        
        .search-result-item {
            display: flex;
            align-items: center;
            padding: 10px;
            border-bottom: 1px solid #eee;
            cursor: pointer;
            transition: background 0.2s;
        }
        
        .search-result-item:hover {
            background: #f9f9f9;
        }
        
        .search-result-item img {
            width: 50px;
            height: 50px;
            object-fit: cover;
            margin-right: 10px;
            border-radius: 3px;
        }
        
        .search-result-info h4 {
            margin: 0;
            font-size: 14px;
            color: #333;
        }
        
        .search-result-info p {
            margin: 5px 0 0;
            font-size: 13px;
            color: #888;
        }
        
        .no-results {
            padding: 15px;
            text-align: center;
            color: #888;
        }
    `;
    document.head.appendChild(searchStyles);
}

// ==================== CARRUSELES ====================
let currentIndexes = {};

function setupCarousels() {
    const carousels = document.querySelectorAll('.carousel');
    
    carousels.forEach((carousel, i) => {
        const carouselId = carousel.id || `carousel-${i}`;
        currentIndexes[carouselId] = 0;
        
        const track = carousel.querySelector('.carousel-track');
        const slides = Array.from(track.children);
        if (slides.length === 0) return;
        
        const slideWidth = slides[0].getBoundingClientRect().width;
        const gap = 20;
        
        // Configurar botones de navegación
        const prevBtn = carousel.querySelector('.prev');
        const nextBtn = carousel.querySelector('.next');
        
        if (prevBtn && nextBtn) {
            prevBtn.addEventListener('click', () => {
                currentIndexes[carouselId] = Math.max(currentIndexes[carouselId] - 1, 0);
                updateCarouselPosition(carousel, carouselId);
            });
            
            nextBtn.addEventListener('click', () => {
                const maxIndex = slides.length - getVisibleSlidesCount(carousel);
                currentIndexes[carouselId] = Math.min(currentIndexes[carouselId] + 1, maxIndex);
                updateCarouselPosition(carousel, carouselId);
            });
        }
        
        // Manejar redimensionamiento de pantalla
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                updateCarouselPosition(carousel, carouselId);
            }, 100);
        });
        
        // Posicionamiento inicial
        updateCarouselPosition(carousel, carouselId);
    });
}

function getVisibleSlidesCount(carousel) {
    const track = carousel.querySelector('.carousel-track');
    const firstSlide = track.querySelector('.carousel-slide');
    if (!firstSlide) return 0;
    
    const slideWidth = firstSlide.getBoundingClientRect().width;
    const gap = 20;
    const carouselWidth = carousel.getBoundingClientRect().width;
    
    return Math.floor(carouselWidth / (slideWidth + gap));
}

function updateCarouselPosition(carousel, carouselId) {
    const track = carousel.querySelector('.carousel-track');
    const slides = Array.from(track.children);
    const firstSlide = slides[0];
    
    if (!firstSlide) return;
    
    const slideWidth = firstSlide.getBoundingClientRect().width;
    const gap = 20;
    const maxIndex = Math.max(0, slides.length - getVisibleSlidesCount(carousel));
    
    // Asegurarse de que el índice actual no exceda el máximo
    currentIndexes[carouselId] = Math.min(currentIndexes[carouselId], maxIndex);
    
    const offset = -currentIndexes[carouselId] * (slideWidth + gap);
    track.style.transform = `translateX(${offset}px)`;
    
    // Actualizar estado de los botones
    const prevBtn = carousel.querySelector('.prev');
    const nextBtn = carousel.querySelector('.next');
    
    if (prevBtn && nextBtn) {
        prevBtn.disabled = currentIndexes[carouselId] === 0;
        nextBtn.disabled = currentIndexes[carouselId] >= maxIndex;
        
        // Estilos para botones deshabilitados
        prevBtn.style.opacity = prevBtn.disabled ? '0.5' : '1';
        prevBtn.style.cursor = prevBtn.disabled ? 'not-allowed' : 'pointer';
        
        nextBtn.style.opacity = nextBtn.disabled ? '0.5' : '1';
        nextBtn.style.cursor = nextBtn.disabled ? 'not-allowed' : 'pointer';
    }
}

// ==================== CARRUSEL FULLSCREEN ====================
function setupFullscreenCarousel() {
    const track = document.querySelector('.fs-carousel-track');
    if (!track) return;
    
    const slides = document.querySelectorAll('.fs-slide');
    const dots = document.querySelectorAll('.fs-dot');
    let currentIndex = 0;
    let interval;
    
    function nextSlide() {
        currentIndex = (currentIndex + 1) % slides.length;
        updateCarousel();
    }
    
    function updateCarousel() {
        track.style.transform = `translateX(-${currentIndex * 100}%)`;
        
        // Actualizar dots
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentIndex);
        });
        
        // Reiniciar intervalo
        clearInterval(interval);
        interval = setInterval(nextSlide, 5000);
    }
    
    // Iniciar carrusel
    if (slides.length > 0) {
        updateCarousel();
        
        // Pausar al hacer hover
        track.addEventListener('mouseenter', () => {
            clearInterval(interval);
        });
        
        track.addEventListener('mouseleave', () => {
            interval = setInterval(nextSlide, 5000);
        });
        
        // Manejar clic en dots
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                currentIndex = index;
                updateCarousel();
            });
        });
    }
}

function goToFsSlide(index) {
    const track = document.querySelector('.fs-carousel-track');
    const dots = document.querySelectorAll('.fs-dot');
    
    if (!track || !dots.length) return;
    
    track.style.transform = `translateX(-${index * 100}%)`;
    
    dots.forEach(dot => dot.classList.remove('active'));
    dots[index].classList.add('active');
}

// ==================== CARRUSEL DE MARCAS ====================
function setupBrandsCarousel() {
    const brandsTrack = document.querySelector('.brands-track');
    if (!brandsTrack) return;
    
    const brands = document.querySelectorAll('.brand-slide');
    if (brands.length === 0) return;
    
    const brandWidth = brands[0].getBoundingClientRect().width;
    const gap = 40;
    
    // Duplicar marcas para efecto infinito
    brands.forEach(brand => {
        const clone = brand.cloneNode(true);
        brandsTrack.appendChild(clone);
    });
    
    let position = 0;
    const speed = 0.5; // px por frame
    let animationId;
    
    function animate() {
        position -= speed;
        
        if (position <= -brandWidth) {
            position = 0;
            brandsTrack.appendChild(brandsTrack.firstElementChild);
        }
        
        brandsTrack.style.transform = `translateX(${position}px)`;
        animationId = requestAnimationFrame(animate);
    }
    
    // Iniciar animación
    animate();
    
    // Pausar al hacer hover
    brandsTrack.addEventListener('mouseenter', () => {
        cancelAnimationFrame(animationId);
    });
    
    brandsTrack.addEventListener('mouseleave', () => {
        animate();
    });
}

// ==================== CARRITO DE COMPRAS ====================
function setupCart() {
    // Cargar carrito desde localStorage o inicializar uno nuevo
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartIcon = document.querySelector('.cart-icon');
    const cartOverlay = document.querySelector('.cart-overlay');
    const closeCart = document.querySelector('.close-cart');
    const cartContent = document.querySelector('.cart-content');
    const cartTotal = document.querySelector('.cart-total span');
    const cartCount = document.querySelector('.cart-count');
    const checkoutBtn = document.querySelector('.checkout-btn');
    
    // Verificar que los elementos del carrito existen
    if (!cartIcon || !cartOverlay || !closeCart || !cartContent || !cartTotal || !cartCount || !checkoutBtn) {
        console.error('Elementos del carrito no encontrados');
        return;
    }
    
    // Actualizar contador del carrito
    function updateCartCount() {
        const count = cart.reduce((total, item) => total + item.quantity, 0);
        cartCount.textContent = count;
    }
    
    // Actualizar vista del carrito
    function updateCart() {
        cartContent.innerHTML = '';
        let total = 0;
        
        cart.forEach((item, index) => {
            const cartItem = document.createElement('div');
            cartItem.classList.add('cart-item');
            
            cartItem.innerHTML = `
                <img src="${item.img}" alt="${item.title}" class="cart-item-img">
                <div class="cart-item-details">
                    <h4 class="cart-item-title">${item.title}</h4>
                    <p class="cart-item-price">$${item.price.toFixed(2)}</p>
                    <button class="cart-item-remove">Eliminar</button>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn minus">-</button>
                        <input type="number" class="quantity-input" value="${item.quantity}" min="1">
                        <button class="quantity-btn plus">+</button>
                    </div>
                </div>
            `;
            
            cartContent.appendChild(cartItem);
            total += item.price * item.quantity;
            
            // Configurar eventos para los controles del item
            setupCartItemEvents(cartItem, item, index);
        });
        
        // Actualizar total y contador
        cartTotal.textContent = `$${total.toFixed(2)}`;
        updateCartCount();
        
        // Mostrar u ocultar botón de compra
        checkoutBtn.style.display = cart.length > 0 ? 'block' : 'none';
    }
    
    // Configurar eventos para un item del carrito
    function setupCartItemEvents(cartItem, item, index) {
        const minusBtn = cartItem.querySelector('.minus');
        const plusBtn = cartItem.querySelector('.plus');
        const quantityInput = cartItem.querySelector('.quantity-input');
        const removeBtn = cartItem.querySelector('.cart-item-remove');
        
        minusBtn.addEventListener('click', () => {
            if (item.quantity > 1) {
                item.quantity--;
                quantityInput.value = item.quantity;
                saveCart();
            }
        });
        
        plusBtn.addEventListener('click', () => {
            item.quantity++;
            quantityInput.value = item.quantity;
            saveCart();
        });
        
        quantityInput.addEventListener('change', () => {
            const newQuantity = parseInt(quantityInput.value);
            if (newQuantity >= 1) {
                item.quantity = newQuantity;
                saveCart();
            } else {
                quantityInput.value = item.quantity;
            }
        });
        
        removeBtn.addEventListener('click', () => {
            cart.splice(index, 1);
            saveCart();
        });
    }
    
    // Guardar carrito en localStorage y notificar cambios
    function saveCart() {
        localStorage.setItem('cart', JSON.stringify(cart));
        window.dispatchEvent(new Event('cartUpdated'));
        updateCart();
    }
    
    // Añadir productos al carrito desde los carruseles
    document.querySelectorAll('.carousel-slide').forEach(slide => {
        const addToCartBtn = document.createElement('button');
        addToCartBtn.classList.add('add-to-cart');
        addToCartBtn.textContent = 'Añadir al carrito';
        
        addToCartBtn.addEventListener('click', () => {
            const product = {
                id: slide.querySelector('h4').textContent,
                title: slide.querySelector('h4').textContent,
                price: parseFloat(slide.querySelector('p').textContent.replace('$', '')),
                img: slide.querySelector('img').src,
                quantity: 1
            };
            
            addToCart(product);
        });
        
        slide.appendChild(addToCartBtn);
    });
    
    // Función para añadir productos al carrito
    function addToCart(product) {
        const existingItem = cart.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push(product);
        }
        
        saveCart();
        showAddedToCartMessage(product.title);
    }
    
    // Mostrar mensaje de producto añadido
    function showAddedToCartMessage(productName) {
        const message = document.createElement('div');
        message.classList.add('cart-message');
        message.innerHTML = `<p>¡${productName} ha sido añadido al carrito!</p>`;
        document.body.appendChild(message);
        
        setTimeout(() => message.classList.add('show'), 10);
        setTimeout(() => {
            message.classList.remove('show');
            setTimeout(() => document.body.removeChild(message), 300);
        }, 3000);
    }
    
    // Eventos del carrito
    cartIcon.addEventListener('click', () => {
        cartOverlay.classList.add('active');
    });
    
    closeCart.addEventListener('click', () => {
        cartOverlay.classList.remove('active');
    });
    
    cartOverlay.addEventListener('click', (e) => {
        if (e.target === cartOverlay) {
            cartOverlay.classList.remove('active');
        }
    });
    
    // Evento para el botón de comprar
    checkoutBtn.addEventListener('click', () => {
        localStorage.setItem('cartTotal', cartTotal.textContent);
        window.location.href = 'checkout.html';
    });
    
    // Escuchar cambios en el carrito desde otras pestañas
    window.addEventListener('storage', function(e) {
        if (e.key === 'cart') {
            cart = JSON.parse(e.newValue) || [];
            updateCart();
        }
    });
    
    // Escuchar nuestro evento personalizado
    window.addEventListener('cartUpdated', function() {
        cart = JSON.parse(localStorage.getItem('cart')) || [];
        updateCart();
    });
    
    // Inicializar carrito
    updateCart();
    
    // Añadir estilos para el mensaje de producto añadido
    const cartMessageStyles = document.createElement('style');
    cartMessageStyles.textContent = `
        .cart-message {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: #4CAF50;
            color: white;
            padding: 15px 25px;
            border-radius: 4px;
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
            opacity: 0;
            transition: opacity 0.3s ease;
            z-index: 3000;
        }
        .cart-message.show {
            opacity: 1;
        }
    `;
    document.head.appendChild(cartMessageStyles);
}

// WhatsApp Widget - Versión completa con chatbot
// WhatsApp Widget - Versión completa con chatbot corregida
document.addEventListener('DOMContentLoaded', function() {
    // Elementos principales
    const widget = document.querySelector('.whatsapp-widget');
    const button = widget?.querySelector('.whatsapp-button');
    const chatContainer = widget?.querySelector('.whatsapp-chat-container');
    
    // Solo continuar si los elementos existen
    if (!widget || !button || !chatContainer) {
        console.error('Elementos del WhatsApp widget no encontrados');
        return;
    }

    // Mostrar/ocultar chat
    button.addEventListener('click', function(e) {
        e.stopPropagation();
        chatContainer.classList.toggle('active');
        chatContainer.classList.toggle('hidden');
    });

    // Cerrar al hacer clic en la X
    const closeBtn = chatContainer.querySelector('.close-chat');
    if (closeBtn) {
        closeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            chatContainer.classList.remove('active');
            chatContainer.classList.add('hidden');
        });
    }

    // Cerrar al hacer clic fuera
    document.addEventListener('click', function(e) {
        if (!widget.contains(e.target)) {
            chatContainer.classList.remove('active');
            chatContainer.classList.add('hidden');
        }
    });

    // Opciones de chat
    const optionButtons = chatContainer.querySelectorAll('.select-option');
    optionButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const option = this.getAttribute('data-option');
            if (option === 'human') {
                window.open('https://wa.me/51906194737?text=Hola,%20necesito%20asesoría', '_blank');
            } else if (option === 'bot') {
                const options = chatContainer.querySelector('.chat-options');
                const messages = chatContainer.querySelector('.chat-messages');
                if (options && messages) {
                    options.classList.add('hidden');
                    messages.classList.remove('hidden');
                    
                    // Mensajes iniciales del bot
                    addBotMessage("¡Hola! 👋 Soy el asistente virtual de StyleHub. ¿En qué puedo ayudarte hoy?");
                    setTimeout(() => {
                        addBotMessage("Por favor selecciona una opción:", [
                            {text: "📦 Información sobre productos", value: "products"},
                            {text: "🔍 Consultar disponibilidad", value: "availability"},
                            {text: "🚚 Estado de mi pedido", value: "order"},
                            {text: "💬 Hablar con un asesor", value: "agent"}
                        ]);
                    }, 800);
                }
            }
        });
    });

    // Función para añadir mensajes del bot
    function addBotMessage(text, options = null) {
        const messagesContainer = chatContainer.querySelector('.chat-messages .messages-container');
        if (!messagesContainer) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';
        messageDiv.innerHTML = `<p>${text}</p>`;
        messagesContainer.appendChild(messageDiv);
        
        if (options) {
            const optionsDiv = document.createElement('div');
            optionsDiv.className = 'bot-options';
            
            options.forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'chat-option';
                btn.textContent = opt.text;
                btn.setAttribute('data-value', opt.value);
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    handleOptionSelection(opt.value);
                });
                optionsDiv.appendChild(btn);
            });
            
            messagesContainer.appendChild(optionsDiv);
        }
        
        // Auto-scroll al final de los mensajes
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Función para añadir mensajes del usuario
    function addUserMessage(text) {
        const messagesContainer = chatContainer.querySelector('.chat-messages .messages-container');
        if (!messagesContainer) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user-message';
        messageDiv.innerHTML = `<p>${text}</p>`;
        messagesContainer.appendChild(messageDiv);
        
        // Auto-scroll al final de los mensajes
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Función para manejar la selección de opciones (corregida)
    function handleOptionSelection(value) {
        // Limpiar opciones anteriores
        const oldOptions = chatContainer.querySelector('.bot-options');
        if (oldOptions) oldOptions.remove();
        
        // Añadir mensaje del usuario
        addUserMessage(getOptionText(value));
        
        // Respuestas basadas en la selección
        switch(value) {
            case 'products':
                setTimeout(() => {
                    addBotMessage("Tenemos una amplia gama de productos para niños. ¿Qué te interesa?", [
                        {text: "👟 Zapatillas deportivas", value: "shoes"},
                        {text: "👕 Ropa casual", value: "clothing"},
                        {text: "🧦 Accesorios", value: "accessories"},
                        {text: "🔙 Volver al menú principal", value: "back"}
                    ]);
                }, 800);
                break;
                
            case 'shoes':
                setTimeout(() => {
                    addBotMessage("Nuestra colección de zapatillas para niños incluye:", [
                        {text: "🏃 Zapatillas running ($49.99)", value: "running"},
                        {text: "👟 Zapatillas casuales ($45.00)", value: "casual"},
                        {text: "⚽ Zapatillas deportivas ($55.00)", value: "sports"},
                        {text: "🔙 Volver", value: "products"}
                    ]);
                }, 800);
                break;
                
            case 'clothing':
                setTimeout(() => {
                    addBotMessage("Tenemos estas opciones en ropa para niños:", [
                        {text: "👕 Poleras desde $89.00", value: "t-shirts"},
                        {text: "🧥 Chaquetas desde $69.00", value: "jackets"},
                        {text: "👖 Pantalones desde $59.00", value: "pants"},
                        {text: "🔙 Volver", value: "products"}
                    ]);
                }, 800);
                break;
                
            case 'availability':
                setTimeout(() => {
                    addBotMessage("Para consultar disponibilidad, por favor indícame el nombre del producto o el código si lo tienes.");
                }, 800);
                break;
                
            case 'order':
                setTimeout(() => {
                    addBotMessage("Para consultar el estado de tu pedido, necesito el número de seguimiento. ¿Lo tienes a mano?");
                }, 800);
                break;
                
            case 'agent':
                setTimeout(() => {
                    addBotMessage("Claro, voy a conectarte con uno de nuestros asesores. Por favor espera un momento...");
                    setTimeout(() => {
                        window.open('https://wa.me/51941270621?text=Hola,%20necesito%20asesoría', '_blank');
                    }, 2000);
                }, 800);
                break;
                
            case 'back':
                setTimeout(() => {
                    addBotMessage("¿En qué más puedo ayudarte?", [
                        {text: "📦 Información sobre productos", value: "products"},
                        {text: "🔍 Consultar disponibilidad", value: "availability"},
                        {text: "🚚 Estado de mi pedido", value: "order"},
                        {text: "💬 Hablar con un asesor", value: "agent"}
                    ]);
                }, 800);
                break;
                
            default:
                setTimeout(() => {
                    addBotMessage("Lo siento, no entendí tu selección. Por favor elige una opción:", [
                        {text: "📦 Información sobre productos", value: "products"},
                        {text: "🔍 Consultar disponibilidad", value: "availability"},
                        {text: "🚚 Estado de mi pedido", value: "order"},
                        {text: "💬 Hablar con un asesor", value: "agent"}
                    ]);
                }, 800);
        }
    }

    // Función auxiliar para obtener el texto de la opción seleccionada
    function getOptionText(value) {
        const optionsMap = {
            'products': 'Información sobre productos',
            'availability': 'Consultar disponibilidad',
            'order': 'Estado de mi pedido',
            'agent': 'Hablar con un asesor',
            'shoes': 'Zapatillas deportivas',
            'clothing': 'Ropa casual',
            'accessories': 'Accesorios',
            'back': 'Volver al menú principal'
        };
        return optionsMap[value] || value;
    }

    // Configurar el input de mensaje
    const messageInput = chatContainer.querySelector('.message-input');
    const sendButton = chatContainer.querySelector('.send-button');
    
    if (messageInput && sendButton) {
        sendButton.addEventListener('click', function(e) {
            e.stopPropagation();
            sendMessage();
        });
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.stopPropagation();
                sendMessage();
            }
        });
    }
    
    function sendMessage() {
        if (messageInput.value.trim() === '') return;
        
        addUserMessage(messageInput.value);
        const userMessage = messageInput.value.toLowerCase();
        messageInput.value = '';
        
        // Respuestas automáticas a mensajes de texto
        setTimeout(() => {
            if (userMessage.includes('hola') || userMessage.includes('buenos días') || userMessage.includes('buenas tardes')) {
                addBotMessage("¡Hola de nuevo! ¿En qué puedo ayudarte hoy?");
            } else if (userMessage.includes('gracias')) {
                addBotMessage("¡De nada! 😊 ¿Hay algo más en lo que pueda ayudarte?");
            } else if (userMessage.includes('precio') || userMessage.includes('coste') || userMessage.includes('cuesta')) {
                addBotMessage("Los precios varían según el producto. ¿Te interesa algún artículo en particular?");
            } else if (userMessage.includes('talla') || userMessage.includes('tamaño')) {
                addBotMessage("Para niños tenemos tallas desde la 20 hasta la 36. ¿Qué producto necesitas?");
            } else {
                addBotMessage("Entendido. ¿Prefieres que te ayude con:", [
                    {text: "📦 Información sobre productos", value: "products"},
                    {text: "🔍 Consultar disponibilidad", value: "availability"},
                    {text: "🚚 Estado de mi pedido", value: "order"},
                    {text: "💬 Hablar con un asesor", value: "agent"}
                ]);
            }
        }, 1000);
    }
});

// Añade estos estilos CSS para el chat (con barra de desplazamiento)
const chatStyles = document.createElement('style');
chatStyles.textContent = `
    /* Estilos para el chat */
    .whatsapp-widget {
        font-family: 'Segoe UI', Helvetica, Arial, sans-serif;
    }
    
    .whatsapp-chat-container {
        position: fixed;
        bottom: 100px;
        right: 30px;
        width: 350px;
        max-height: 500px;
        background: white;
        border-radius: 15px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        z-index: 1000;
        transition: all 0.3s ease;
    }
    
    .whatsapp-chat-container.hidden {
        opacity: 0;
        visibility: hidden;
        transform: translateY(20px);
    }
    
    .whatsapp-chat-container.active {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
    }
    
    .whatsapp-chat-header {
        background: #25D366;
        color: white;
        padding: 15px;
        display: flex;
        flex-direction: column;
    }
    
    .chat-title {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 5px;
    }
    
    .chat-title h4 {
        margin: 0;
        font-size: 16px;
        flex-grow: 1;
        text-align: center;
    }
    
    .close-chat {
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
    }
    
    .chat-subtitle p {
        margin: 0;
        font-size: 12px;
        opacity: 0.9;
    }
    
    .whatsapp-chat-body {
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        background: #e5ddd5;
        background-image: url('https://web.whatsapp.com/img/bg-chat-tile-light_a4be512e7195b6b733d9110b408f075d.png');
    }
    
    .chat-options {
        display: flex;
        flex-direction: column;
        padding: 15px;
        gap: 10px;
    }
    
    .chat-option {
        background: white;
        border: none;
        border-radius: 10px;
        padding: 15px;
        text-align: left;
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .chat-option:hover {
        background: #f5f5f5;
    }
    
    .select-option {
        background: #25D366;
        color: white;
        border: none;
        border-radius: 5px;
        padding: 8px 15px;
        margin-top: 10px;
        cursor: pointer;
        font-size: 12px;
    }
    
    .chat-messages {
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        padding: 10px;
        overflow: hidden;
    }
    
    .messages-container {
        flex-grow: 1;
        overflow-y: auto;
        padding: 10px;
        max-height: 300px;
        scrollbar-width: thin;
        scrollbar-color: #25D366 #f1f1f1;
    }
    
    .messages-container::-webkit-scrollbar {
        width: 6px;
    }
    
    .messages-container::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 10px;
    }
    
    .messages-container::-webkit-scrollbar-thumb {
        background: #25D366;
        border-radius: 10px;
    }
    
    .messages-container::-webkit-scrollbar-thumb:hover {
        background: #128C7E;
    }
    
    .message {
        max-width: 80%;
        margin-bottom: 10px;
        padding: 8px 12px;
        border-radius: 7.5px;
        font-size: 14px;
        line-height: 1.4;
        position: relative;
    }
    
    .bot-message {
        background: white;
        align-self: flex-start;
        border-top-left-radius: 0;
    }
    
    .user-message {
        align-self: flex-end;
        border-top-right-radius: 0;
    }
    
    .bot-options {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: 10px;
    }
    
    .bot-options button {
        background: white;
        border: 1px solid #ddd;
        border-radius: 20px;
        padding: 8px 15px;
        font-size: 13px;
        cursor: pointer;
        text-align: left;
        transition: all 0.2s;
    }
    
    .bot-options button:hover {
        background: #f5f5f5;
    }
    
    .chat-input {
        display: flex;
        padding: 10px;
        background: white;
        border-top: 1px solid #eee;
    }
    
    .message-input {
        flex-grow: 1;
        border: 1px solid #ddd;
        border-radius: 20px;
        padding: 8px 15px;
        outline: none;
    }
    
    .send-button {
        background: #25D366;
        color: white;
        border: none;
        border-radius: 50%;
        width: 35px;
        height: 35px;
        margin-left: 10px;
        cursor: pointer;
    }
    
    .whatsapp-button {
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 60px;
        height: 60px;
        background: #25D366;
        color: white;
        border: none;
        border-radius: 50%;
        font-size: 24px;
        cursor: pointer;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999;
    }
    
    .whatsapp-button i {
        animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
    }
`;
document.head.appendChild(chatStyles);