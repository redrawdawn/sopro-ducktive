# Motive Handoff Notes

Source thread: "Move Sopro Ducktive app"

## Current project identity

- The website/app is now intended to be called Motive.
- It previously lived under the working name `sopro-ducktive`.
- Prior local app path was `C:\Users\redra\OneDrive\Documents\sopro-ducktive`.
- Current new Codex workspace is `C:\Users\redra\OneDrive\Documents\Motive 2`.

## GitHub and deploy setup

- GitHub repo used in the prior thread: `redrawdawn/sopro-ducktive`.
- Main branch: `main`.
- Vercel account confirmed in the prior thread: `redrawdawn`.
- Public Vercel URL at that point: `https://sopro-ducktive.vercel.app`.
- Future rename/domain should use Motive naming, then Supabase redirect URLs must be updated to match.

## Supabase setup

- Supabase project URL:
  `https://nxihmzquzwvscjrwmbec.supabase.co`
- Vercel env vars needed:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- The publishable key should be copied from local `.env.local` or Supabase Settings > API Keys.
- Do not use a secret/service-role key in Vercel public env vars.
- Supabase GitHub integration working directory was `supabase`.

## Auth changes already made and pushed

- Commit `2073ed2 Fix signup email callback`
  - Signup confirmation redirects through `/auth/callback?next=/dashboard` instead of directly to `/dashboard`.
- Commit `040d670 Harden auth recovery flow`
  - Signup duplicate-email messaging was improved.
  - Reset-password missing-session messaging was improved.
  - `/auth/callback` was hardened so Supabase recovery session cookies are attached to the redirect response.

## Supabase auth URL configuration

For the old Vercel URL:

- Site URL:
  `https://sopro-ducktive.vercel.app`
- Redirect URLs:
  - `https://sopro-ducktive.vercel.app/auth/callback`
  - `https://sopro-ducktive.vercel.app/reset-password`

If the Vercel project/domain is renamed to Motive, replace `https://sopro-ducktive.vercel.app` with the new public Motive URL everywhere above.

## Important behavior notes

- "Auth session missing" on reset-password means the page was opened without a valid Supabase recovery session, often from an old link, direct page visit, or callback cookie issue.
- Password reset should be tested using a fresh forgot-password email after deployment.
- If signup is attempted with an email that already has an account, Supabase may not send a new signup verification email; the UI was changed to show a clearer duplicate-account message.

## Current Motive 2 workspace state

- As of this handoff note, `C:\Users\redra\OneDrive\Documents\Motive 2` contains only an empty Git repo.
- The actual app files still need to be brought into this workspace or cloned/copied from the prior app/repo before coding can continue here.
