# Gicomm primary Admin provisioning

Gicomm has one primary Admin account. Public Signup never accepts a role, and the
application's Admin Edge Function cannot promote a second account.

## First-time setup

1. Create the designated account through the normal Gicomm Signup page.
2. Complete email confirmation.
3. In the Supabase Dashboard for **Gicomm Butterfly**, open Authentication → Users
   and select that account.
4. Edit the account's **App Metadata** (not User Metadata) to include:

   ```json
   {
     "role": "admin"
   }
   ```

5. Save the change, then sign out and sign in again so the session receives fresh
   trusted app metadata.
6. Open `/admin.html` and confirm the Admin Control Center loads.

Do not put the Admin role in `user_metadata`: users can edit their own user
metadata. Never expose a Supabase service-role or secret key in browser code.

## Enforcement

- The database trigger `gicomm_single_admin_role_guard` blocks creating or
  promoting a second Admin, and prevents deleting or demoting the only Admin.
- The `gicomm-admin` Edge Function re-checks the caller's trusted
  `app_metadata.role` on every request and refuses a second Admin promotion.
- Existing duplicate Admin accounts can be demoted until only one remains.
- Admin transfer/replacement is intentionally an out-of-band maintenance
  operation; there is no public or self-service transfer action.

## Current validation state

The Auth user table was empty when the guard was deployed, so no Admin account
was automatically created. The first Admin must be provisioned using the steps
above. Signup and role-protected routes should then be tested with one member
account and the designated Admin account.
