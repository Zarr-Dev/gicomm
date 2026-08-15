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
    document.body.classList.toggle("dark", theme === "dark");
}

export function toggleTheme() {
    const nextTheme = document.body.classList.contains("dark") ? "light" : "dark";
    setTheme(nextTheme);
    return nextTheme;
}
