# GymQuest Community — owner setup (Supabase, Free plan)

The Community is **optional** and ships **disabled**. Until you complete these steps the app stays
exactly as before: fully offline, no accounts, no network requests. Nothing below is done for you.

> Cost: everything here fits the Supabase **Free plan**. Do not upgrade automatically.

---

## 1. Create the project
1. Create a Supabase project (Free plan), note the **Project URL** and the **publishable / anon key**
   (Project settings → API). These two are safe in frontend code.

## 2. Run the database migration
Run [`migrations/0001_community.sql`](./migrations/0001_community.sql) once:
- SQL editor → paste the whole file → Run, **or** with the CLI: `supabase db push`.

It creates `profiles`, `posts`, `reports`, `blocks`, the helper functions, the triggers (new-user
profile, role/suspension guard, post guard), all RLS policies, and the two Storage buckets
(`community` private, `avatars` public) with their policies. Re-running is safe (idempotent).

Verify afterwards: **Storage** shows `community` (private, 6 MB limit) and `avatars` (public, 2 MB).

## 3. Authentication (email + password)
1. **Authentication → Providers → Email**: enable **Email** and keep **Confirm email** ON.
   Do **not** disable email confirmation to work around mail limits.
2. **Authentication → SMTP**: configure **custom SMTP** (e.g. Resend, Postmark, SendGrid, or your own).
   Supabase's built-in mailer is for testing only and is heavily rate-limited — real sign-ups need
   custom SMTP. Without it, verification emails will not reach most users.
3. **Authentication → URL configuration**: set **Site URL** to your deployed app
   (`https://surotvsk.github.io/Gymquest/`) and add it under **Redirect URLs**.

## 4. Deploy the privileged delete-account function
```bash
supabase functions deploy delete-account
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<your service_role key>   # NEVER commit this
```
`SUPABASE_URL` / `SUPABASE_ANON_KEY` are provided by the platform. The **service_role key must never**
appear in `community-config.js`, the repository, or logs.

## 5. Point the app at your project
Edit [`../community-config.js`](../community-config.js) and set ONLY:
```js
supabaseUrl: 'https://<project>.supabase.co',
supabaseAnonKey: '<publishable/anon key>',
```
Then bump `CACHE_VERSION` in `sw.js` **and** the `?v=` strings in `index.html`, and redeploy. (The
service worker precaches the config file, so a version bump is what makes it refresh.)

## 6. Grant the first moderator (owner only)
In the SQL editor, as the project owner:
```sql
update public.profiles set role = 'moderator' where username = 'YOUR_USERNAME';
```
The API can never do this — the `profiles_guard` trigger rejects `role` changes from clients.
**Publishing stays disabled until at least one moderator exists** (`moderation_ready()`): that is the
"moderated beta" switch.

## 7. Test with two accounts
Sign up two users in the app (opt in via ☰ Community), make one a moderator, then verify: approve
posts, feed visibility, profile, reports, blocking, quotas, and account deletion.

---

## Community rules & privacy (shown in the app)
- Share only your own photos, and only what you are comfortable making public.
- No nudity, harassment, hate, or medical/body-shaming claims. Moderators may remove content and
  suspend accounts.
- **Community is online and public.** Everything else in GymQuest — workouts, history, measurements,
  timers, and your **private Progress photos** — stays on your device and is never uploaded unless you
  explicitly choose **Share to Community** for one photo.
- Removing your account deletes your community profile, posts and stored community media. It cannot
  recall copies others already saved, and it never touches your private on-device data.

## Owner decisions / legal (not asserted)
- **Minors:** do not open the beta to minors until you have decided and documented an eligibility age
  and the moderation capacity to support it.
- **Moderation capacity & response times**, a takedown/appeal process, a content policy and a privacy
  notice are **your** decisions. This repository provides the mechanism, not legal compliance.
- **Data residency / GDPR-style obligations** for public user content depend on your jurisdiction —
  review them before enabling the beta.

## Limits (Free-plan friendly)
- ~5 MB maximum upload copy (the app already compresses and generates thumbnails); buckets cap at
  6 MB (`community`) and 2 MB (`avatars`).
- **10 active (pending + approved) photo posts per user**, enforced server-side.
- Feed is paginated and only ever requests thumbnails for cards — never full-size originals.
