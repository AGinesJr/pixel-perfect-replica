# Workforce Prep

Workforce Prep is a career-practice simulator for rehearsing job applications and interviews. The current app contains fictional sample job listings and browser-local progress storage.

## Current capabilities

- Browse a curated set of fictional practice jobs.
- Submit a practice application with resume text and an optional cover letter.
- Receive AI-generated practice screening when the configured AI gateway is available.
- Practice an AI interview and receive rubric-based coaching feedback.
- Use a hosted, browser-based voice interview prototype: spoken questions, microphone speech recognition, editable transcripts, and typed-answer fallback.
- Manage full name, career contact email, phone number, city, state, ZIP code, and profile photo on **Account / Profile**; edit resume text separately on **Resume**.
- Save resume text, profile details, applications, and progress in the current browser, with account cloud sync available after deployment configuration and verification.
- Export or delete browser-local practice data from **Account / Profile**.

## Important limitations

- **This is a practice simulator, not a real job board.** Jobs, employers, posting dates, and salary ranges are sample content, not verified vacancies or live labor-market data.
- **Profile contact email is separate from the Supabase sign-in email.** Updating the profile contact email does not change account credentials.
- **Supabase sign-in and cloud sync require deployment configuration and live testing.** The account page uses Supabase Auth and the app syncs profile and practice data to the RLS-protected tables. Add the required Supabase URL and public key to the hosting build environment, run both database migrations, rebuild, and test sign-up/sign-in before relying on cloud storage. Until configured and verified, practice data remains browser-local.
- **The profile photo is compressed in the browser and stored as a data URL** with the profile record. The image is resized to a square and compressed before saving. Avoid uploading sensitive images.
- **AI needs a configured server-side gateway key and available credits.** If AI is unavailable or the workspace is out of credits, application screening and interview coaching cannot complete. The app should show an error rather than fabricate an AI assessment. Existing interview AI calls can use Lovable AI credits; the voice prototype does not guarantee unlimited free AI usage.
- **Voice support depends on the browser.** Spoken questions use the browser's speech synthesis. Microphone answers use browser speech recognition when available (typically best supported in current Chrome or Edge). Some browsers may send recognition audio to their own speech service; this prototype does not save an audio recording. If speech recognition is unavailable or permission is denied, users can type their answer instead.
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
3. Run `supabase/migrations/20261013000000_initial_workforce_prep.sql` if it has not already been applied.
4. Run `supabase/migrations/20261013010000_profile_details.sql` to add the new profile fields to existing accounts.
5. Confirm that `profiles` and `practice_data` appear in Table Editor and that row-level security (RLS) is enabled on both.
6. The migrations do not add anonymous/public access policies. A signed-in user can access only rows whose `user_id` matches their Supabase Auth user ID.
7. In Project Settings → API (or the Connect panel), copy the Project URL and public publishable/anon key into the deployment platform’s build environment. The app supports `VITE_SUPABASE_PUBLISHABLE_KEY` or the legacy `VITE_SUPABASE_ANON_KEY`, along with `VITE_SUPABASE_URL`.
8. Rebuild/redeploy, open `/account`, create an account, confirm your email if requested, and sign in. Test saving a profile, resume, and saved job, then sign in from a second browser to confirm sync.

**Important:** never put a Supabase service-role/secret key in browser code. The public/anon (or publishable) key is designed for client use when RLS is configured correctly. Access tokens are stored in browser local storage, so protect the app from cross-site scripting and use strong unique passwords.

## AI gateway configuration

AI functions run on the server and read `LOVABLE_API_KEY` from the server environment. Never place this secret in a `VITE_*` variable or client-side code. Configure it in the deployment platform's server-side environment settings. A local `.env` file can be used for local development and must never be committed.

If deployed through Lovable, configure the secret in the platform's supported secrets/environment settings. A GitHub code change cannot restore exhausted hosted AI credits or add credits to an account.

## Privacy and production readiness

The app currently exports and deletes browser-local practice data. **Account-level deletion of the Supabase cloud records and Auth account is not yet implemented.** Cloud sync is implemented in the code but must be configured and verified against the deployed app before relying on it.

Before public production use, finish and test authentication, per-user database access, cloud persistence, account deletion, rate limiting/abuse controls, privacy and retention disclosures, accessible error handling, and verified labor-market data integrations with source and timestamp metadata. Do not claim these are implemented until they are configured and tested.
