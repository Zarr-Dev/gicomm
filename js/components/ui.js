/**
 * Shared UI helpers.
 */

export function showToast(element, message, duration = 2200) {
    element.textContent = message;
    element.classList.add("show");

    window.clearTimeout(element._toastTimer);
    element._toastTimer = window.setTimeout(() => {
        element.classList.remove("show");
    }, duration);
}

export function setTheme(theme) {
    const isDark = theme === "dark";
    document.body.classList.toggle("dark", isDark);

    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
        const icon = isDark ? "☀" : "☾";
        button.textContent = icon;
        button.setAttribute(
            "aria-label",
            isDark ? "Switch to light mode" : "Switch to dark mode"
        );
    });
}

export function toggleTheme() {
    const nextTheme = document.body.classList.contains("dark") ? "light" : "dark";
    setTheme(nextTheme);
    return nextTheme;
}
