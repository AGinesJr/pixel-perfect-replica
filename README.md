# Workforce Prep

Workforce Prep is a career-practice simulator for rehearsing job applications and interviews. The current repository contains fictional sample job listings and browser-local progress storage.

## Current capabilities

- Browse a curated set of fictional practice jobs.
- Submit a practice application with resume text and an optional cover letter.
- Receive an AI-generated practice screening when the configured AI gateway is available.
- Practice an interview and receive rubric-based coaching feedback.
- Save resume text, applications, and progress in the current browser.
- Export or delete browser-local practice data from **My resume**.

## Important limitations

- **This is a practice simulator, not a real job board.** The jobs, employers, posting dates, and salary ranges are sample content and are not verified vacancies or live labor-market data.
- **No user accounts or cloud sync are implemented.** Practice data is stored in local browser storage on the current device/browser. Clearing browser data or switching devices can remove or hide that data.
- **AI needs a configured server-side gateway key and available credits.** If AI is unavailable or the workspace is out of credits, application screening and interview coaching cannot complete. The app should show an error rather than fabricate an AI assessment.
- **No real applications are submitted.** Do not treat simulated decisions as actual employer decisions or guarantees of hiring outcomes.
- **Do not enter sensitive personal data.** Never include Social Security numbers, financial account details, or other unnecessary sensitive information in a resume or practice answer.

## Local development

Requirements: Node.js 22 or newer and npm.

```sh
git clone https://github.com/AGinesJr/pixel-perfect-replica.git
cd pixel-perfect-replica
npm install
npm run dev
```

Available checks:

```sh
npm run test
npm run lint
npm run build
```

## AI gateway configuration

The AI functions run on the server and read `LOVABLE_API_KEY` from the server environment. Never place this secret in a `VITE_*` variable or client-side code. Configure it in the deployment platform's server-side environment settings. A local `.env` file can be used only for local development and must never be committed.

If the project is deployed through Lovable, configure the secret in the platform's supported secrets/environment settings. A GitHub code change cannot restore exhausted hosted AI credits or add credits to the account.

## Privacy and production readiness

The profile page offers an export of browser-local practice data and a delete-all action. This is not a substitute for account-level data deletion because the current app does not have accounts or a central database.

Before public production use, add and test authentication, per-user database access policies, secure server-side persistence, rate limiting/abuse controls, privacy and retention disclosures, accessible error handling, and verified labor-market data integrations with source and timestamp metadata. Do not claim these are implemented until they are actually configured and tested.
