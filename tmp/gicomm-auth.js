(() => {
  // js/components/storage.js
  var KEYS = {
    cart: "gicomm-cart",
    saved: "gicomm-saved",
    theme: "gicomm-theme",
    demoUser: "gicomm-demo-user"
  };
  function setDemoUser(email) {
    localStorage.setItem(KEYS.demoUser, email);
  }

  // js/pages/auth.js
  var form = document.querySelector("#loginForm");
  var emailInput = document.querySelector("#email");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = emailInput.value.trim() || "demo@gicomm.app";
    setDemoUser(email);
    window.location.href = "dashboard.html";
  });
  document.querySelector("#forgot").addEventListener(
    "click",
    (event) => {
      event.preventDefault();
      window.alert(
        "Demo: password reset will be available after Supabase Auth is connected."
      );
    }
  );
  document.querySelector("#signup").addEventListener(
    "click",
    (event) => {
      event.preventDefault();
      setDemoUser("creator@gicomm.app");
      window.location.href = "dashboard.html";
    }
  );
  for (const id of ["googleDemo", "githubDemo"]) {
    document.querySelector(`#${id}`)?.addEventListener("click", () => {
      setDemoUser("demo@gicomm.app");
      window.location.href = "dashboard.html";
    });
  }
})();
