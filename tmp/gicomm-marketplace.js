(() => {
  // js/data/products.js
  var PRODUCTS = [
    {
      id: 1,
      name: "Minimal UI Kit",
      category: "Design",
      format: "Figma",
      price: 12,
      rating: 4.9,
      creator: "North Studio",
      description: "Clean components for product designers.",
      mark: "UI",
      isNew: true
    },
    {
      id: 2,
      name: "Creator Workspace",
      category: "Productivity",
      format: "Notion",
      price: 8,
      rating: 4.8,
      creator: "Mika Labs",
      description: "A focused Notion system for creators.",
      mark: "N"
    },
    {
      id: 3,
      name: "Starter Dev Kit",
      category: "Development",
      format: "Code",
      price: 15,
      rating: 4.7,
      creator: "Zetta Code",
      description: "Useful boilerplate for small web apps.",
      mark: "DEV"
    },
    {
      id: 4,
      name: "Studio Objects",
      category: "3D",
      format: "Blender",
      price: 10,
      rating: 4.9,
      creator: "Forma 3D",
      description: "A compact set of clean 3D objects.",
      mark: "3D",
      isNew: true
    },
    {
      id: 5,
      name: "Finance Dashboard",
      category: "Productivity",
      format: "Notion",
      price: 7,
      rating: 4.6,
      creator: "Plain Tools",
      description: "A simple personal finance dashboard.",
      mark: "FIN"
    },
    {
      id: 6,
      name: "Landing Page System",
      category: "Design",
      format: "Figma",
      price: 14,
      rating: 4.8,
      creator: "North Studio",
      description: "Responsive sections for modern websites.",
      mark: "WEB",
      isNew: true
    },
    {
      id: 7,
      name: "Icon Essentials",
      category: "Design",
      format: "Figma",
      price: 6,
      rating: 4.7,
      creator: "Lineworks",
      description: "A compact monochrome icon collection.",
      mark: "IC"
    },
    {
      id: 8,
      name: "Motion Starter",
      category: "3D",
      format: "Blender",
      price: 11,
      rating: 4.8,
      creator: "Forma 3D",
      description: "Minimal motion assets for presentations.",
      mark: "MO"
    }
  ];

  // js/components/storage.js
  var KEYS = {
    cart: "gicomm-cart",
    saved: "gicomm-saved",
    theme: "gicomm-theme",
    demoUser: "gicomm-demo-user"
  };
  function readJSON(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  }
  function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  function getCart() {
    return readJSON(KEYS.cart, []);
  }
  function saveCart(cart2) {
    writeJSON(KEYS.cart, cart2);
  }
  function getSavedIds() {
    return new Set(readJSON(KEYS.saved, []));
  }
  function saveSavedIds(ids) {
    writeJSON(KEYS.saved, [...ids]);
  }
  function getTheme() {
    return localStorage.getItem(KEYS.theme) || "light";
  }
  function setTheme(theme) {
    localStorage.setItem(KEYS.theme, theme);
  }

  // js/components/ui.js
  function showToast(element, message, duration = 2200) {
    element.textContent = message;
    element.classList.add("show");
    window.clearTimeout(element._toastTimer);
    element._toastTimer = window.setTimeout(() => {
      element.classList.remove("show");
    }, duration);
  }
  function setTheme2(theme) {
    const isDark = theme === "dark";
    document.body.classList.toggle("dark", isDark);
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      const icon = isDark ? "\u2600" : "\u263E";
      button.textContent = icon;
      button.setAttribute(
        "aria-label",
        isDark ? "Switch to light mode" : "Switch to dark mode"
      );
    });
  }

  // js/pages/marketplace.js
  var state = {
    query: "",
    category: "All",
    price: "all",
    format: "all",
    sort: "featured"
  };
  var cart = getCart();
  var saved = getSavedIds();
  var elements = {
    grid: document.querySelector("#grid"),
    resultText: document.querySelector("#resultText"),
    emptyState: document.querySelector("#empty"),
    searchInput: document.querySelector("#search"),
    searchButton: document.querySelector("#searchBtn"),
    filterToggle: document.querySelector("#filterToggle"),
    filters: document.querySelector("#filters"),
    sort: document.querySelector("#sort"),
    toast: document.querySelector("#toast"),
    drawer: document.querySelector("#drawer"),
    backdrop: document.querySelector("#backdrop"),
    cartItems: document.querySelector("#cartItems"),
    cartCount: document.querySelector("#cartCount"),
    cartTotal: document.querySelector("#total"),
    modalWrap: document.querySelector("#modalWrap"),
    modal: document.querySelector("#modal")
  };
  function getVisibleProducts() {
    const query = state.query.trim().toLowerCase();
    const filtered = PRODUCTS.filter((product) => {
      const searchableText = [
        product.name,
        product.category,
        product.format,
        product.creator,
        product.description
      ].join(" ").toLowerCase();
      const matchesQuery = !query || searchableText.includes(query);
      const matchesCategory = state.category === "All" || product.category === state.category;
      const matchesPrice = state.price === "all" || state.price === "free" && product.price === 0 || state.price !== "free" && product.price <= Number(state.price);
      const matchesFormat = state.format === "all" || product.format === state.format;
      return matchesQuery && matchesCategory && matchesPrice && matchesFormat;
    });
    switch (state.sort) {
      case "rating":
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case "low":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "high":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "new":
        filtered.sort(
          (a, b) => Number(b.isNew) - Number(a.isNew)
        );
        break;
      default:
        break;
    }
    return filtered;
  }
  function renderProducts() {
    const products = getVisibleProducts();
    elements.resultText.textContent = `${products.length} products available`;
    elements.emptyState.hidden = products.length > 0;
    elements.grid.innerHTML = products.map(
      (product) => `
                <article class="product">
                    <div class="art">
                        <span>${product.mark}</span>
                    </div>

                    <div class="info">
                        <b>${product.name}</b>

                        <p>${product.description}</p>

                        <div class="meta">
                            <span>
                                \u2605 ${product.rating}
                                \xB7 ${product.category}
                            </span>
                            <strong>$${product.price}</strong>
                        </div>

                        <div class="product-actions">
                            <button
                                class="secondary"
                                data-view="${product.id}"
                            >
                                View
                            </button>

                            <button
                                class="icon ${saved.has(product.id) ? "saved" : ""}"
                                data-save="${product.id}"
                                aria-label="Save product"
                            >
                                ${saved.has(product.id) ? "\u2665" : "\u2661"}
                            </button>

                            <button
                                class="icon"
                                data-add="${product.id}"
                                aria-label="Add to cart"
                            >
                                \uFF0B
                            </button>
                        </div>
                    </div>
                </article>
            `
    ).join("");
  }
  function renderCart() {
    const count = cart.reduce(
      (total2, item) => total2 + item.quantity,
      0
    );
    const total = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    elements.cartCount.textContent = count;
    elements.cartTotal.textContent = `$${total.toFixed(2)}`;
    elements.cartItems.innerHTML = cart.length > 0 ? cart.map(
      (item) => `
                        <div class="cart-item">
                            <div class="thumb">${item.mark}</div>

                            <div>
                                <b>${item.name}</b>
                                <small>
                                    $${item.price} \xB7
                                    ${item.quantity} item
                                </small>
                            </div>

                            <button
                                data-remove="${item.id}"
                            >
                                Remove
                            </button>
                        </div>
                    `
    ).join("") : `
                <div
                    style="
                        padding:45px 0;
                        text-align:center;
                        color:var(--muted);
                        font-size:11px;
                    "
                >
                    Your bag is empty.
                </div>
            `;
  }
  function addToCart(productId) {
    const product = PRODUCTS.find(
      (item) => item.id === productId
    );
    if (!product) return;
    const existing = cart.find(
      (item) => item.id === productId
    );
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        ...product,
        quantity: 1
      });
    }
    saveCart(cart);
    renderCart();
    showToast(
      elements.toast,
      `${product.name} added to your bag.`
    );
  }
  function toggleSaved(productId) {
    if (saved.has(productId)) {
      saved.delete(productId);
      showToast(
        elements.toast,
        "Removed from wishlist."
      );
    } else {
      saved.add(productId);
      showToast(
        elements.toast,
        "Saved to wishlist."
      );
    }
    saveSavedIds(saved);
    renderProducts();
  }
  function openProduct(productId) {
    const product = PRODUCTS.find(
      (item) => item.id === productId
    );
    if (!product) return;
    elements.modal.innerHTML = `
        <button
            class="modal-close"
            id="closeModal"
            aria-label="Close"
        >
            \xD7
        </button>

        <div class="modal-art">
            ${product.mark}
        </div>

        <div>
            <p class="eyebrow">
                ${product.category.toUpperCase()}
                \xB7 ${product.format.toUpperCase()}
            </p>

            <h3>${product.name}</h3>

            <p class="creator">
                by ${product.creator}
                \xB7 \u2605 ${product.rating}
            </p>

            <p>${product.description}</p>

            <div class="features">
                \u2713 Instant delivery
                <br><br>
                \u2713 Creator updates
                <br><br>
                \u2713 License information
            </div>

            <div class="price">
                $${product.price}
            </div>

            <button
                class="primary wide"
                id="modalAdd"
            >
                Add to bag
            </button>
        </div>
    `;
    elements.modalWrap.classList.add("on");
    document.querySelector("#closeModal").onclick = () => {
      elements.modalWrap.classList.remove("on");
    };
    document.querySelector("#modalAdd").onclick = () => {
      addToCart(product.id);
      elements.modalWrap.classList.remove("on");
    };
  }
  function runSearch() {
    state.query = elements.searchInput.value;
    renderProducts();
    document.querySelector("#discover").scrollIntoView({ behavior: "smooth" });
  }
  function resetFilters() {
    Object.assign(state, {
      query: "",
      category: "All",
      price: "all",
      format: "all",
      sort: "featured"
    });
    elements.searchInput.value = "";
    elements.sort.value = "featured";
    document.querySelectorAll(".chips button").forEach((button) => button.classList.remove("selected"));
    document.querySelector('[data-cat="All"]').classList.add("selected");
    document.querySelector('[data-price="all"]').classList.add("selected");
    document.querySelector('[data-format="all"]').classList.add("selected");
    renderProducts();
  }
  function openCart() {
    elements.drawer.classList.add("on");
    elements.backdrop.classList.add("on");
  }
  function closeCart() {
    elements.drawer.classList.remove("on");
    elements.backdrop.classList.remove("on");
  }
  elements.searchButton?.addEventListener("click", runSearch);
  elements.searchInput?.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Enter") runSearch();
    }
  );
  document.querySelectorAll("[data-search]").forEach(
    (button) => {
      button.onclick = () => {
        elements.searchInput.value = button.dataset.search;
        runSearch();
      };
    }
  );
  document.querySelector("#focusSearch").onclick = () => {
    elements.searchInput.focus();
  };
  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextTheme = document.body.classList.contains("dark") ? "light" : "dark";
      setTheme(nextTheme);
      setTheme2(nextTheme);
    });
  });
  elements.filterToggle.onclick = () => {
    elements.filters.classList.toggle("open");
  };
  elements.sort.onchange = (event) => {
    state.sort = event.target.value;
    renderProducts();
  };
  document.querySelectorAll("[data-cat]").forEach(
    (button) => {
      button.onclick = () => {
        document.querySelectorAll("[data-cat]").forEach(
          (item) => item.classList.remove("selected")
        );
        button.classList.add("selected");
        state.category = button.dataset.cat;
        renderProducts();
      };
    }
  );
  document.querySelectorAll("[data-price]").forEach(
    (button) => {
      button.onclick = () => {
        document.querySelectorAll("[data-price]").forEach(
          (item) => item.classList.remove("selected")
        );
        button.classList.add("selected");
        state.price = button.dataset.price;
        renderProducts();
      };
    }
  );
  document.querySelectorAll("[data-format]").forEach((button) => {
    button.onclick = () => {
      document.querySelectorAll("[data-format]").forEach(
        (item) => item.classList.remove("selected")
      );
      button.classList.add("selected");
      state.format = button.dataset.format;
      renderProducts();
    };
  });
  document.querySelectorAll("[data-category]").forEach((button) => {
    button.onclick = () => {
      state.category = button.dataset.category;
      document.querySelectorAll("[data-cat]").forEach((item) => {
        item.classList.toggle(
          "selected",
          item.dataset.cat === state.category
        );
      });
      document.querySelector("#discover").scrollIntoView({
        behavior: "smooth"
      });
      renderProducts();
    };
  });
  document.querySelector("#reset").onclick = resetFilters;
  elements.grid.addEventListener("click", (event) => {
    const viewButton = event.target.closest("[data-view]");
    const addButton = event.target.closest("[data-add]");
    const saveButton = event.target.closest("[data-save]");
    if (viewButton) {
      openProduct(Number(viewButton.dataset.view));
    }
    if (addButton) {
      addToCart(Number(addButton.dataset.add));
    }
    if (saveButton) {
      toggleSaved(Number(saveButton.dataset.save));
    }
  });
  document.querySelector("#openCart").onclick = openCart;
  document.querySelector("#closeCart").onclick = closeCart;
  elements.backdrop.onclick = closeCart;
  elements.cartItems.addEventListener(
    "click",
    (event) => {
      const button = event.target.closest("[data-remove]");
      if (!button) return;
      const id = Number(button.dataset.remove);
      cart = cart.filter(
        (item) => item.id !== id
      );
      saveCart(cart);
      renderCart();
    }
  );
  document.querySelector("#checkout").onclick = () => {
    showToast(
      elements.toast,
      cart.length > 0 ? "Checkout demo is ready for backend integration." : "Your bag is empty."
    );
  };
  elements.modalWrap.onclick = (event) => {
    if (event.target === elements.modalWrap) {
      elements.modalWrap.classList.remove("on");
    }
  };
  setTheme2(getTheme());
  renderProducts();
  renderCart();
})();
