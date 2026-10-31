import { supabase } from "./supabase.js";

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user ?? null;
}

export async function getOwnProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_path, bio, website_url, created_at, updated_at")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.replace(`/login.html?next=${next}`);
    return null;
  }
  let profile = null;
  try {
    profile = await getOwnProfile(user.id);
  } catch (error) {
    console.error("Gicomm profile could not be loaded:", error);
  }
  return { user, profile };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
