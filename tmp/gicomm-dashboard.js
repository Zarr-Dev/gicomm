(() => {
  // js/components/storage.js
  var KEYS = {
    cart: "gicomm-cart",
    saved: "gicomm-saved",
    theme: "gicomm-theme",
    demoUser: "gicomm-demo-user"
  };
  function getTheme() {
    return localStorage.getItem(KEYS.theme) || "light";
  }
  function setTheme(theme) {
    localStorage.setItem(KEYS.theme, theme);
  }
  function clearDemoUser() {
    localStorage.removeItem(KEYS.demoUser);
  }

  // js/components/ui.js
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

  // js/pages/dashboard.js
  var tabs = {
    Overview: [
      "Recent activity",
      "Latest updates from your demo workspace."
    ],
    "My Library": [
      "My Library",
      "18 items saved in your demo library."
    ],
    Saved: [
      "Saved",
      "6 products you have saved."
    ],
    Orders: [
      "Orders",
      "12 demo orders completed."
    ],
    Selling: [
      "Selling",
      "3 demo products are currently live."
    ],
    Settings: [
      "Settings",
      "Manage your demo account preferences."
    ]
  };
  var tabTitle = document.querySelector("#tabTitle");
  var tabSubtitle = document.querySelector("#tabSub");
  document.querySelectorAll("[data-tab]").forEach(
    (button) => {
      button.addEventListener("click", () => {
        document.querySelectorAll("[data-tab]").forEach(
          (item) => item.classList.remove("active")
        );
        button.classList.add("active");
        const [title, subtitle] = tabs[button.dataset.tab];
        tabTitle.textContent = title;
        tabSubtitle.textContent = subtitle;
      });
    }
  );
  document.querySelector("#theme").addEventListener(
    "click",
    () => {
      const nextTheme = document.body.classList.contains("dark") ? "light" : "dark";
      setTheme(nextTheme);
      setTheme2(nextTheme);
    }
  );
  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextTheme = document.body.classList.contains("dark") ? "light" : "dark";
      setTheme(nextTheme);
      setTheme2(nextTheme);
    });
  });
  document.querySelector("#logout").addEventListener(
    "click",
    () => {
      clearDemoUser();
      window.location.href = "index.html";
    }
  );
  setTheme2(getTheme());
})();
