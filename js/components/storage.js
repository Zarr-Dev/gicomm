/**
 * Storage Module - Data Persistence Layer
 * 
 * This module handles all data persistence for Gicomm.
 * Currently uses localStorage, but designed for Supabase migration.
 * 
 * TODO SUPABASE: Replace all localStorage calls with Supabase client.
 * See config/supabase.example.js for complete integration guide.
 * 
 * Migration steps:
 * 1. npm install @supabase/supabase-js
 * 2. Copy config/supabase.example.js → config/supabase.js
 * 3. Add Supabase credentials
 * 4. Import Supabase client at top of this file
 * 5. Replace each function to use supabase API calls
 * 6. Update authentication in auth.js
 * 7. Handle error states and offline support
 * 
 * Example migration:
 * import { createClient } from "@supabase/supabase-js";
 * const supabase = createClient(URL, KEY);
 * export async function getCart() {
 *     const { data, error } = await supabase
 *         .from("cart").select("*").eq("user_id", userId);
 *     return data || [];
 * }
 */

const KEYS = {
    cart: "gicomm-cart",
    saved: "gicomm-saved",
    theme: "gicomm-theme",
    demoUser: "gicomm-demo-user",
    // TODO SUPABASE: Add session token key
    // session: "gicomm-session",
};

// TODO SUPABASE: Cart management
// Replace with: supabase.from("cart").select().eq("user_id", userId)
export function getCart() {
    return readJSON(KEYS.cart, []);
}

export function saveCart(cart) {
    writeJSON(KEYS.cart, cart);
}

// TODO SUPABASE: Wishlist/saved products
// Replace with: supabase.from("saved_products").select().eq("user_id", userId)
export function getSavedIds() {
    return new Set(readJSON(KEYS.saved, []));
}

export function saveSavedIds(ids) {
    writeJSON(KEYS.saved, [...ids]);
}

// TODO SUPABASE: Theme preference
// Can stay in localStorage or sync with user.metadata in Supabase
export function getTheme() {
    return localStorage.getItem(KEYS.theme) || "light";
}

export function setTheme(theme) {
    localStorage.setItem(KEYS.theme, theme);
}

// TODO SUPABASE: User session management
// Replace with: supabase.auth.getSession()
export function getDemoUser() {
    return localStorage.getItem(KEYS.demoUser) || null;
}

export function setDemoUser(email) {
    localStorage.setItem(KEYS.demoUser, email);
}

export function clearDemoUser() {
    localStorage.removeItem(KEYS.demoUser);
}

// TODO SUPABASE: Helper functions
// These should be updated to use Supabase after migration
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

/**
 * Supabase Integration Template
 * 
 * After setting up Supabase, replace functions like:
 * 
 * export async function getCart() {
 *     const { data, error } = await supabase
 *         .from("cart")
 *         .select("*")
 *         .eq("user_id", currentUserId);
 *     if (error) {
 *         console.error("Failed to fetch cart:", error);
 *         return [];
 *     }
 *     return data || [];
 * }
 * 
 * export async function saveCart(items) {
 *     const { data, error } = await supabase
 *         .from("cart")
 *         .upsert({
 *             user_id: currentUserId,
 *             items: items,
 *             updated_at: new Date().toISOString()
 *         });
 *     if (error) console.error("Failed to save cart:", error);
 * }
 * 
 * export async function getProducts() {
 *     const { data, error } = await supabase
 *         .from("products")
 *         .select(\"id, name, price, rating, creator_id\")
 *         .eq("is_published", true)
 *         .order("created_at", { ascending: false });
 *     if (error) {
 *         console.error("Failed to fetch products:", error);
 *         return [];
 *     }
 *     return data || [];
 * }
 */
