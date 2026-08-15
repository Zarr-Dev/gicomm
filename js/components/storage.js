/**
 * Small localStorage helpers.
 * These are intentionally isolated so the later Supabase migration
 * has a single place to replace demo persistence.
 */

const KEYS = {
    cart: "gicomm-cart",
    saved: "gicomm-saved",
    theme: "gicomm-theme",
    demoUser: "gicomm-demo-user",
};

export function readJSON(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
    } catch {
        return fallback;
    }
}

export function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

export function getCart() {
    return readJSON(KEYS.cart, []);
}

export function saveCart(cart) {
    writeJSON(KEYS.cart, cart);
}

export function getSavedIds() {
    return new Set(readJSON(KEYS.saved, []));
}

export function saveSavedIds(ids) {
    writeJSON(KEYS.saved, [...ids]);
}

export function getTheme() {
    return localStorage.getItem(KEYS.theme) || "light";
}

export function setTheme(theme) {
    localStorage.setItem(KEYS.theme, theme);
}

export function setDemoUser(email) {
    localStorage.setItem(KEYS.demoUser, email);
}

export function clearDemoUser() {
    localStorage.removeItem(KEYS.demoUser);
}
