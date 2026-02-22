

# Plan: Fix High Priority (Error Level) Security Findings

## Summary

There are **2 error-level findings** from the security scan:

1. **Profiles table: email column exposed** -- Any authenticated user can SELECT the `email` column directly from the profiles table. While most sensitive fields (phone, addresses, WhatsApp, etc.) are already locked down via column-level privileges, `email` is still readable by any authenticated user.

2. **OAuth client secrets stored in plain text** -- The `oauth_clients` table has a `client_secret` column with secrets in plain text. A `client_secret_hash` column already exists but isn't used. If an account is compromised, secrets can be read directly.

---

## Fix 1: Revoke direct email column access on profiles

**What changes:**
- A database migration to revoke the `SELECT` privilege on the `email` column for the `authenticated` role
- The `email` field is already properly gated through `get_visible_profile()` and `get_own_profile()`, so no frontend changes are needed

**Migration:**
```sql
REVOKE SELECT (email) ON public.profiles FROM authenticated;
```

**Risk:** Low. All existing code accesses email through security definer functions, not direct table queries. This just closes the last gap.

---

## Fix 2: Hash OAuth client secrets

**What changes:**

### A. Database migration
- Populate the existing `client_secret_hash` column with bcrypt hashes of current plain-text secrets
- Clear the plain-text `client_secret` column so secrets are no longer readable
- Note: This is a one-way operation -- existing secrets cannot be viewed after hashing

### B. Edge function update (`oauth-token/index.ts`)
- Instead of comparing `client_secret` directly (`=== client_secret`), use bcrypt to verify the submitted secret against the stored hash
- Applies to both the authorization_code and refresh_token grant flows
- Import a Deno-compatible bcrypt library (e.g., `https://deno.land/x/bcrypt/mod.ts`)

### C. Developer app registration flow
- When a new OAuth app is registered, hash the secret before storing it
- Show the plain-text secret to the developer only once at creation time (standard practice)

**Technical details for the edge function change:**

Current (insecure):
```typescript
if (authCode.oauth_clients.client_secret !== client_secret) { ... }
```

New (secure):
```typescript
import { compare } from "https://deno.land/x/bcrypt/mod.ts";
// ...
const isValid = await compare(client_secret, authCode.oauth_clients.client_secret_hash);
if (!isValid) { ... }
```

The SELECT queries in the edge function will switch from reading `client_secret` to reading `client_secret_hash`.

---

## After implementation

- Re-run the security scan to confirm both error-level findings are resolved
- Mark the profiles finding as resolved once the email column grant is revoked
- Mark the OAuth secrets finding as resolved once hashing is in place

