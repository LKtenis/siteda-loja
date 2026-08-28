/* =========================
   CONFIGURAÇÃO
========================= */

// Número de WhatsApp da loja (formato internacional, só números).
// Troque pelo número real da LK antes de publicar o site.
const WHATSAPP_NUMBER = "14998900334";

/* =========================
   ESTADO DO CARRINHO
========================= */

let cart = [];

function formatBRL(value) {
    return value.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
}

function findCartItem(id, size) {
    return cart.find((item) => item.id === id && item.size === size);
}

function addToCart(product, size) {
    const existing = findCartItem(product.id, size);

    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            size: size,
            qty: 1,
        });
    }

    renderCart();
}

function updateQty(id, size, delta) {
    const item = findCartItem(id, size);
    if (!item) return;

    item.qty += delta;

    if (item.qty <= 0) {
        cart = cart.filter((i) => !(i.id === id && i.size === size));
    }

    renderCart();
}

function removeFromCart(id, size) {
    cart = cart.filter((i) => !(i.id === id && i.size === size));
    renderCart();
}

function cartSubtotal() {
    return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function cartTotalItems() {
    return cart.reduce((sum, item) => sum + item.qty, 0);
}

/* =========================
   RENDER
========================= */

const cartItemsEl = document.getElementById("cartItems");
const cartEmptyEl = document.getElementById("cartEmpty");
const cartFooterEl = document.getElementById("cartFooter");
const cartSubtotalEl = document.getElementById("cartSubtotal");
const cartCountEl = document.getElementById("cartCount");

function renderCart() {
    cartItemsEl.querySelectorAll(".cart-item").forEach((el) => el.remove());

    if (cart.length === 0) {
        cartEmptyEl.hidden = false;
        cartFooterEl.hidden = true;
    } else {
        cartEmptyEl.hidden = true;
        cartFooterEl.hidden = false;

        cart.forEach((item) => {
            const row = document.createElement("div");
            row.className = "cart-item";

            row.innerHTML = `
                <div class="cart-item-image">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <div class="cart-item-details">
                    <strong>${item.name}</strong>
                    <span class="cart-item-meta">Tamanho ${item.size}</span>
                    <div class="cart-item-row">
                        <div class="cart-qty">
                            <button type="button" data-action="dec">−</button>
                            <span>${item.qty}</span>
                            <button type="button" data-action="inc">+</button>
                        </div>
                        <span class="cart-item-price">${formatBRL(item.price * item.qty)}</span>
                    </div>
                    <button type="button" class="cart-item-remove">Remover</button>
                </div>
            `;

            row.querySelector('[data-action="inc"]').addEventListener("click", () => {
                updateQty(item.id, item.size, 1);
            });

            row.querySelector('[data-action="dec"]').addEventListener("click", () => {
                updateQty(item.id, item.size, -1);
            });

            row.querySelector(".cart-item-remove").addEventListener("click", () => {
                removeFromCart(item.id, item.size);
            });

            cartItemsEl.appendChild(row);
        });
    }

    cartSubtotalEl.textContent = formatBRL(cartSubtotal());

    const totalItems = cartTotalItems();
    cartCountEl.textContent = totalItems;
    cartCountEl.setAttribute("data-empty", totalItems === 0 ? "true" : "false");
}

/* =========================
   TOAST
========================= */

const toastEl = document.getElementById("toast");
let toastTimeout;

function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add("active");

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toastEl.classList.remove("active");
    }, 2200);
}

/* =========================
   DRAWER DO CARRINHO
========================= */

const cartToggle = document.getElementById("cartToggle");
const cartClose = document.getElementById("cartClose");
const cartOverlay = document.getElementById("cartOverlay");
const cartDrawer = document.getElementById("cartDrawer");

function openCart() {
    cartDrawer.classList.add("active");
    cartOverlay.classList.add("active");
}

function closeCart() {
    cartDrawer.classList.remove("active");
    cartOverlay.classList.remove("active");
}

cartToggle.addEventListener("click", openCart);
cartClose.addEventListener("click", closeCart);
cartOverlay.addEventListener("click", closeCart);

/* =========================
   CARDS DE PRODUTO
========================= */

document.querySelectorAll(".product-card").forEach((card) => {
    const product = {
        id: card.dataset.id,
        name: card.dataset.name,
        price: parseFloat(card.dataset.price),
        image: card.dataset.image,
    };

    let selectedSize = null;

    const sizeButtons = card.querySelectorAll(".size-btn");
    const sizeWarning = card.querySelector(".size-warning");
    const addButton = card.querySelector(".add-to-cart-btn");

    sizeButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            sizeButtons.forEach((b) => b.classList.remove("selected"));
            btn.classList.add("selected");
            selectedSize = btn.dataset.size;
            sizeWarning.hidden = true;
        });
    });

    addButton.addEventListener("click", () => {
        if (!selectedSize) {
            sizeWarning.hidden = false;
            return;
        }

        addToCart(product, selectedSize);
        showToast(`${product.name} (tam. ${selectedSize}) adicionado ao carrinho`);
        openCart();

        addButton.textContent = "Adicionado ✓";
        addButton.classList.add("just-added");

        setTimeout(() => {
            addButton.textContent = "Adicionar ao carrinho";
            addButton.classList.remove("just-added");
        }, 1400);
    });
});

/* =========================
   CONTA — ATENÇÃO
   Este é um sistema de conta simples, feito só com
   HTML/CSS/JS (sem servidor). Os dados ficam salvos
   apenas no navegador do próprio cliente (localStorage).
   Não é um sistema de autenticação seguro — não use
   senhas reais/reaproveitadas de outros sites aqui.
   Para contas de verdade (seguras, acessíveis em
   qualquer aparelho) é preciso um backend com banco
   de dados.
========================= */

const ACCOUNTS_KEY = "lk_accounts";
const SESSION_KEY = "lk_session";
const ORDERS_KEY = "lk_orders";

// Ofuscação simples só para não gravar a senha em texto puro.
// NÃO é criptografia segura.
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
    }
    return String(hash);
}

function getAccounts() {
    try {
        return JSON.parse(localStorage.getItem(ACCOUNTS_KEY)) || {};
    } catch {
        return {};
    }
}

function saveAccounts(accounts) {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function getSession() {
    return localStorage.getItem(SESSION_KEY);
}

function setSession(email) {
    localStorage.setItem(SESSION_KEY, email);
}

function clearSession() {
    localStorage.removeItem(SESSION_KEY);
}

function getAllOrders() {
    try {
        return JSON.parse(localStorage.getItem(ORDERS_KEY)) || {};
    } catch {
        return {};
    }
}

function saveOrder(email, order) {
    const all = getAllOrders();
    if (!all[email]) all[email] = [];
    all[email].unshift(order);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(all));
}

function getOrders(email) {
    const all = getAllOrders();
    return all[email] || [];
}

/* =========================
   ELEMENTOS — CONTA
========================= */

const accountToggle = document.getElementById("accountToggle");
const accountToggleLabel = document.getElementById("accountToggleLabel");
const accountOverlay = document.getElementById("accountOverlay");
const accountDrawer = document.getElementById("accountDrawer");
const accountClose = document.getElementById("accountClose");
const accountHeaderTitle = document.getElementById("accountHeaderTitle");

const loginForm = document.getElementById("loginForm");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginError = document.getElementById("loginError");
const showSignup = document.getElementById("showSignup");

const signupForm = document.getElementById("signupForm");
const signupName = document.getElementById("signupName");
const signupEmail = document.getElementById("signupEmail");
const signupPhone = document.getElementById("signupPhone");
const signupPassword = document.getElementById("signupPassword");
const signupError = document.getElementById("signupError");
const showLogin = document.getElementById("showLogin");

const accountPanel = document.getElementById("accountPanel");
const accountAvatar = document.getElementById("accountAvatar");
const accountName = document.getElementById("accountName");
const accountEmail = document.getElementById("accountEmail");
const profileName = document.getElementById("profileName");
const profilePhone = document.getElementById("profilePhone");
const saveProfileBtn = document.getElementById("saveProfileBtn");
const profileSaved = document.getElementById("profileSaved");
const ordersList = document.getElementById("ordersList");
const ordersEmpty = document.getElementById("ordersEmpty");
const logoutBtn = document.getElementById("logoutBtn");

function openAccount() {
    accountDrawer.classList.add("active");
    accountOverlay.classList.add("active");
}

function closeAccount() {
    accountDrawer.classList.remove("active");
    accountOverlay.classList.remove("active");
}

accountToggle.addEventListener("click", openAccount);
accountClose.addEventListener("click", closeAccount);
accountOverlay.addEventListener("click", closeAccount);

function switchToLogin() {
    loginForm.hidden = false;
    signupForm.hidden = true;
    accountPanel.hidden = true;
    accountHeaderTitle.textContent = "Entrar";
    loginError.hidden = true;
}

function switchToSignup() {
    loginForm.hidden = true;
    signupForm.hidden = false;
    accountPanel.hidden = true;
    accountHeaderTitle.textContent = "Criar conta";
    signupError.hidden = true;
}

function switchToPanel() {
    loginForm.hidden = true;
    signupForm.hidden = true;
    accountPanel.hidden = false;
    accountHeaderTitle.textContent = "Minha conta";
}

showSignup.addEventListener("click", switchToSignup);
showLogin.addEventListener("click", switchToLogin);

/* =========================
   RENDER — CONTA
========================= */

function renderAccountUI() {
    const email = getSession();
    const accounts = getAccounts();
    const account = email ? accounts[email] : null;

    if (account) {
        accountToggleLabel.textContent = account.name.split(" ")[0];
        accountAvatar.textContent = account.name.trim().charAt(0).toUpperCase();
        accountName.textContent = account.name;
        accountEmail.textContent = account.email;
        profileName.value = account.name;
        profilePhone.value = account.phone || "";

        renderOrders(account.email);
        switchToPanel();
    } else {
        accountToggleLabel.textContent = "Entrar";
        switchToLogin();
    }
}

function renderOrders(email) {
    const orders = getOrders(email);

    ordersList.querySelectorAll(".order-card").forEach((el) => el.remove());

    if (orders.length === 0) {
        ordersEmpty.hidden = false;
        return;
    }

    ordersEmpty.hidden = true;

    orders.forEach((order) => {
        const card = document.createElement("div");
        card.className = "order-card";

        const itemsHtml = order.items
            .map((item) => `${item.qty}x ${item.name} (tam. ${item.size})`)
            .join("<br>");

        card.innerHTML = `
            <div class="order-card-header">
                <span>${order.date}</span>
            </div>
            <div class="order-card-items">${itemsHtml}</div>
            <div class="order-card-total">${formatBRL(order.subtotal)}</div>
        `;

        ordersList.appendChild(card);
    });
}

/* =========================
   LOGIN / CADASTRO / LOGOUT
========================= */

loginForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = loginEmail.value.trim().toLowerCase();
    const password = loginPassword.value;

    const accounts = getAccounts();
    const account = accounts[email];

    if (!account || account.passwordHash !== simpleHash(password)) {
        loginError.textContent = "E-mail ou senha incorretos.";
        loginError.hidden = false;
        return;
    }

    setSession(email);
    loginForm.reset();
    renderAccountUI();
    showToast(`Bem-vindo(a) de volta, ${account.name.split(" ")[0]}!`);
});

signupForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = signupName.value.trim();
    const email = signupEmail.value.trim().toLowerCase();
    const phone = signupPhone.value.trim();
    const password = signupPassword.value;

    const accounts = getAccounts();

    if (accounts[email]) {
        signupError.textContent = "Já existe uma conta com esse e-mail.";
        signupError.hidden = false;
        return;
    }

    accounts[email] = {
        name,
        email,
        phone,
        passwordHash: simpleHash(password),
    };

    saveAccounts(accounts);
    setSession(email);
    signupForm.reset();
    renderAccountUI();
    showToast(`Conta criada! Bem-vindo(a), ${name.split(" ")[0]}.`);
});

saveProfileBtn.addEventListener("click", () => {
    const email = getSession();
    if (!email) return;

    const accounts = getAccounts();
    accounts[email].name = profileName.value.trim() || accounts[email].name;
    accounts[email].phone = profilePhone.value.trim();
    saveAccounts(accounts);

    renderAccountUI();

    profileSaved.hidden = false;
    setTimeout(() => {
        profileSaved.hidden = true;
    }, 2000);
});

logoutBtn.addEventListener("click", () => {
    clearSession();
    renderAccountUI();
    closeAccount();
    showToast("Você saiu da sua conta.");
});

/* =========================
   CHECKOUT
========================= */

const checkoutBtn = document.getElementById("checkoutBtn");

checkoutBtn.addEventListener("click", () => {
    if (cart.length === 0) return;

    const email = getSession();
    const accounts = getAccounts();
    const account = email ? accounts[email] : null;

    const lines = cart.map(
        (item) =>
            `• ${item.qty}x ${item.name} (tam. ${item.size}) — ${formatBRL(item.price * item.qty)}`
    );

    const greeting = account
        ? `Olá! Sou ${account.name} e quero finalizar essa compra na LK Tênis:`
        : "Olá! Quero finalizar essa compra na LK Tênis:";

    const contactLine = account && account.phone ? `\nMeu contato: ${account.phone}` : "";

    const message =
        greeting + "\n\n" +
        lines.join("\n") +
        `\n\nSubtotal: ${formatBRL(cartSubtotal())}` +
        contactLine +
        "\n\nPode me ajudar a fechar o pedido?";

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

    if (account) {
        saveOrder(account.email, {
            date: new Date().toLocaleDateString("pt-BR"),
            items: cart.map((item) => ({ name: item.name, size: item.size, qty: item.qty })),
            subtotal: cartSubtotal(),
        });
        renderOrders(account.email);
    }

    window.open(url, "_blank");
});

/* =========================
   INICIALIZAÇÃO
========================= */

renderCart();
renderAccountUI();

/* =========================
   ANIMAÇÃO AO ROLAR A PÁGINA
========================= */

const revealObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("in-view");
                revealObserver.unobserve(entry.target);
            }
        });
    },
    { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
);

document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));
