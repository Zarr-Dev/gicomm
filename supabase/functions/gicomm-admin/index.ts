import { withSupabase } from "npm:@supabase/server@1.9.2";

type AdminAction =
  | { action: "list_users" }
  | { action: "set_role"; user_id: string; role: "admin" | "member" };

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

async function listAllUsers(admin: any) {
  const users: any[] = [];
  const perPage = 100;
  for (let page = 1; page <= 100; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const batch = data.users ?? [];
    users.push(...batch);
    if (batch.length < perPage) break;
  }
  return users;
}

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

    const actorId = ctx.jwtClaims?.sub;
    if (!actorId) return json({ error: "Authentication required." }, 401);

    // Resolve the actor from Auth again so revoked roles are not trusted from a stale JWT.
    const { data: actorResult, error: actorError } =
      await ctx.supabaseAdmin.auth.admin.getUserById(actorId);
    if (actorError || !actorResult.user) return json({ error: "Account could not be verified." }, 401);
    if (actorResult.user.app_metadata?.role !== "admin") {
      return json({ error: "Admin permission required." }, 403);
    }

    let body: AdminAction;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid JSON body." }, 400);
    }

    if (body.action === "list_users") {
      try {
        const users = await listAllUsers(ctx.supabaseAdmin);
        return json({
          users: users.map((user) => ({
            id: user.id,
            email: user.email ?? null,
            created_at: user.created_at ?? null,
            last_sign_in_at: user.last_sign_in_at ?? null,
            email_confirmed_at: user.email_confirmed_at ?? null,
            role: user.app_metadata?.role === "admin" ? "admin" : "member",
          })),
        });
      } catch {
        return json({ error: "Unable to load user directory." }, 500);
      }
    }

    if (body.action === "set_role") {
      if (!body.user_id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.user_id)) {
        return json({ error: "Invalid user identifier." }, 400);
      }
      if (body.role !== "admin" && body.role !== "member") {
        return json({ error: "Unsupported role." }, 400);
      }
      if (body.user_id === actorId) {
        return json({ error: "You cannot change your own Admin role." }, 409);
      }

      const { data: targetResult, error: targetError } =
        await ctx.supabaseAdmin.auth.admin.getUserById(body.user_id);
      if (targetError || !targetResult.user) return json({ error: "Target account not found." }, 404);
      const target = targetResult.user;

      if (body.role === "admin" && !target.email_confirmed_at) {
        return json({ error: "The account must confirm its email before receiving Admin access." }, 409);
      }

      if (body.role === "member" && target.app_metadata?.role === "admin") {
        try {
          const users = await listAllUsers(ctx.supabaseAdmin);
          const adminCount = users.filter((user) => user.app_metadata?.role === "admin").length;
          if (adminCount <= 1) return json({ error: "The last active Admin cannot be demoted." }, 409);
        } catch {
          return json({ error: "Unable to verify the current Admin count." }, 500);
        }
      }

      const nextMetadata = { ...(target.app_metadata ?? {}), role: body.role };
      const { data: updated, error: updateError } =
        await ctx.supabaseAdmin.auth.admin.updateUserById(body.user_id, {
          app_metadata: nextMetadata,
        });
      if (updateError || !updated.user) {
        return json({ error: "Unable to update account role." }, 500);
      }

      return json({
        ok: true,
        user: {
          id: updated.user.id,
          email: updated.user.email ?? null,
          role: updated.user.app_metadata?.role === "admin" ? "admin" : "member",
        },
        message: "Role updated. The target account should refresh its session.",
      });
    }

    return json({ error: "Unknown admin action." }, 400);
  }),
};
