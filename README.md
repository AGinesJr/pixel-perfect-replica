# Workforce Prep

Workforce Prep is a career-practice simulator for rehearsing job applications and interviews. The current app contains fictional sample job listings and browser-local progress storage.

## Current capabilities

- Browse a curated set of fictional practice jobs.
- Submit a practice application with resume text and an optional cover letter.
- Receive AI-generated practice screening when the configured AI gateway is available.
- Practice an interview and receive rubric-based coaching feedback.
- Save resume text, applications, and progress in the current browser.
- Export or delete browser-local practice data from **My resume**.

## Important limitations

- **This is a practice simulator, not a real job board.** Jobs, employers, posting dates, and salary ranges are sample content, not verified vacancies or live labor-market data.
- **Supabase sign-in and cloud sync require deployment configuration.** The account page uses Supabase Auth and the app syncs profile and practice data to the RLS-protected tables. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the hosting build environment, rebuild, and test sign-up/sign-in before relying on cloud storage. Until configured, practice data remains browser-local.
- **AI needs a configured server-side gateway key and available credits.** If AI is unavailable or the workspace is out of credits, application screening and interview coaching cannot complete. The app should show an error rather than fabricate an AI assessment.
- **No real applications are submitted.** Simulated decisions are not actual employer decisions or guarantees of hiring outcomes.
- **Do not enter sensitive personal data.** Never include Social Security numbers, financial account details, or other unnecessary sensitive information in a resume or practice answer.

## Local development

Requirements: Bun (the repository includes `bun.lock`) or a compatible Node.js installation.

```sh
git clone https://github.com/AGinesJr/pixel-perfect-replica.git
cd pixel-perfect-replica
bun install
bun run dev
```

Available checks:

```sh
bun run test
bun run lint
bun run build
```

## Supabase setup (accounts and cloud sync)

1. Create or open the Supabase project you intend Workforce Prep to use.
2. In the Supabase dashboard, open **SQL Editor**.
3. Open `supabase/migrations/20261013000000_initial_workforce_prep.sql` in this repository and run its contents in the SQL Editor.
4. Confirm that `profiles` and `practice_data` appear in Table Editor and that row-level security (RLS) is enabled on both.
5. The migration deliberately has no anonymous/public access policies. A signed-in user can access only rows whose `user_id` matches their Supabase Auth user ID.

6. In Project Settings → API (or the Connect panel), copy the Project URL and public publishable/anon key into the deployment platform’s build environment as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
7. Rebuild/redeploy, open `/account`, create an account, confirm your email if requested, and sign in. Test saving a resume and saved job, then sign in from a second browser to confirm sync.

**Important:** never put a Supabase service-role/secret key in browser code. The public/anon (or publishable) key is designed for client use when RLS is configured correctly. Access tokens are stored in browser local storage, so protect the app from cross-site scripting and use strong unique passwords.

## AI gateway configuration

AI functions run on the server and read `LOVABLE_API_KEY` from the server environment. Never place this secret in a `VITE_*` variable or client-side code. Configure it in the deployment platform's server-side environment settings. A local `.env` file can be used for local development and must never be committed.

If deployed through Lovable, configure the secret in the platform's supported secrets/environment settings. A GitHub code change cannot restore exhausted hosted AI credits or add credits to an account.

## Privacy and production readiness

The profile page currently exports and deletes browser-local practice data. This is not yet account-level deletion because cloud accounts and persistence are not wired into the app.

Before public production use, finish and test authentication, per-user database access, cloud persistence, account deletion, rate limiting/abuse controls, privacy and retention disclosures, accessible error handling, and verified labor-market data integrations with source and timestamp metadata. Do not claim these are implemented until they are configured and tested.
