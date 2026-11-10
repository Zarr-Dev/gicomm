// Small, dependency-free interaction helpers shared by Gicomm pages.
export function initMotion() {
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const targets = [...document.querySelectorAll("[data-reveal]")];

  if (reduceMotion || !targets.length) {
    targets.forEach((node) => node.classList.add("is-visible"));
    return;
  }

  if (!("IntersectionObserver" in window)) {
    targets.forEach((node) => node.classList.add("is-visible"));
    return;
  }

  document.body.classList.add("motion-ready");
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: "0px 0px -32px 0px" });

  targets.forEach((node) => observer.observe(node));
}

export function initMarketMenu() {
  const toggle = document.getElementById("marketMenuToggle");
  const menu = document.getElementById("marketNavigation");
  if (!toggle || !menu) return;

  const close = () => {
    document.body.classList.remove("market-menu-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Buka navigasi");
  };

  toggle.addEventListener("click", () => {
    const open = !document.body.classList.contains("market-menu-open");
    document.body.classList.toggle("market-menu-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Tutup navigasi" : "Buka navigasi");
  });

  menu.querySelectorAll("a").forEach((link) => link.addEventListener("click", close));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 760) close();
  }, { passive: true });
}
