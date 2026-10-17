# Workforce Prep

Workforce Prep is a career-practice simulator for rehearsing job applications and interviews. The current app contains fictional sample job listings and browser-local progress storage.

## Current capabilities

- Browse 10,010 deterministic fictional practice-job listings across 25 industries, 50 US locations, and eight experience levels.
- Search and filter the Supabase practice catalog with database-side filtering, sorting, counts, and 24-item pagination after the catalog is seeded.
- Automatically use the bundled catalog when Supabase is not configured, the database table is unavailable, or the table has not been seeded yet.
- Submit a practice application with resume text and an optional cover letter.
- Choose a practice mode: Training (default, supportive), Career Simulation (balanced), or optional advanced Market Reality (stricter simulated threshold only).
- Receive AI-generated practice screening and interview coaching when the configured AI gateway is available.
- Manage full name, career contact email, phone number, city, state, ZIP code, and profile photo on Account / Profile; edit resume text separately on Resume.
- Search a combined live feed of remote roles from Himalayas and U.S. federal openings from USAJOBS. USAJOBS supports keyword, city/state/ZIP, and radius search when its API credentials are configured.
- Save resume text, profile details, applications, and progress in the current browser, with account cloud sync available after deployment configuration and verification.

## Important limitations

- **Live job search is a limited multi-source feed, not a complete index of every job opening.** Himalayas specializes in remote roles. USAJOBS contains federal government announcements only. Private-sector local coverage requires a separately approved provider/API.
- **USAJOBS location search requires credentials.** Request a free API key at https://developer.usajobs.gov/ and configure the server-only environment variables USAJOBS_API_KEY (the key) and USAJOBS_USER_AGENT (the email address used in the API request). Without both, only the Himalayas remote feed is available and location matching is not enabled.
- **Practice modes are simulations.** They do not represent actual employer decisions or guarantees of hiring outcomes.
- **Supabase sign-in and cloud sync require deployment configuration and live testing.** Until configured and verified, practice data may remain browser-local.
- **AI needs a configured server-side gateway key and available credits.** Never place gateway secrets in browser code or variables prefixed with VITE_.
- **Do not enter sensitive personal data.** Never include Social Security numbers, financial account details, or other unnecessary sensitive information in a resume or practice answer.

## Local development

Requirements: Bun (the repository includes bun.lock) or a compatible Node.js installation.

Install dependencies with bun install, then run bun run dev.

Available checks: bun run test, bun run lint, and bun run build.

## Live job search API setup

1. Request a USAJOBS API key at https://developer.usajobs.gov/ (free registration/API key).
2. In Lovable's supported server-side secrets/environment settings, add USAJOBS_API_KEY (the key provided by USAJOBS) and USAJOBS_USER_AGENT (the email address used in the USAJOBS API request).
3. Keep both values server-side only. Never prefix them with VITE_, commit them, or put them in browser code.
4. Rebuild/redeploy after adding the secrets, then test a city/state search and a ZIP/radius search. Confirm federal results link to the original USAJOBS announcement or application page.
5. Himalayas remains the no-key remote feed. Its location fields are not treated as geographic filters; actual local matching comes from USAJOBS.

USAJOBS uses the official https://data.usajobs.gov/api/search endpoint and requires the Host, User-Agent, and Authorization-Key request headers. Search results link users to the source posting; Workforce Prep does not submit applications.

## Simulated practice-job catalog

The app includes 10,000 generated practice listings plus the original curated examples. All are fictional practice scenarios, not verified vacancies or live labor-market data.

Apply supabase/migrations/20261014000000_practice_job_catalog.sql after the existing account migrations to create the corresponding Supabase table. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in a local shell and run bun run seed:practice-jobs to seed or refresh it. Never put the service-role key in a VITE_ variable or commit it.

## Supabase setup (accounts and cloud sync)

1. Create or open the Supabase project you intend Workforce Prep to use.
2. In the Supabase dashboard, open SQL Editor and run the existing account/profile migrations if they have not already been applied.
3. Confirm profiles and practice_data have row-level security enabled.
4. Add the Supabase URL and public publishable/anon key to the deployment platform's build environment. The app supports VITE_SUPABASE_PUBLISHABLE_KEY or the legacy VITE_SUPABASE_ANON_KEY, along with VITE_SUPABASE_URL.
5. Rebuild/redeploy, open /account, create an account, confirm your email if requested, and sign in. Test saving a profile, resume, and saved job.

Never put a Supabase service-role/secret key in browser code. The public/anon (or publishable) key is designed for client use when row-level security is configured correctly.

## AI gateway configuration

AI functions run on the server and read LOVABLE_API_KEY from the server environment. Never place this secret in a VITE_ variable or client-side code. Configure it in the deployment platform's server-side environment settings. A local .env file can be used for local development and must never be committed.

## Privacy and production readiness

Before public production use, finish and test authentication, per-user database access, cloud persistence, account deletion, rate limiting/abuse controls, privacy and retention disclosures, accessible error handling, and verified labor-market data integrations with source and timestamp metadata. Do not claim these are implemented until configured and tested.
