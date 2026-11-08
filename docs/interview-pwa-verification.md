# Interview repair and installation support

## Changes
- Interview route: pending manual turns are ignored after a mode switch, live job overrides follow SDK types, switching back restarts manual questions, and live feedback errors are visible.
- Corrected catalog employer-name indexing and strict-type errors in account, job preparation, catalog queries, ads, resume scoring, live jobs, market insights and voice diagnostics.
- Added a manifest, icons derived from the existing favicon, production-only worker registration, root mobile metadata, and a network-only service worker.
- Added transcript mapping and production-only registration tests.

## Verification
- AI interviewer returned a real question for the Data Analyst practice role in the preview.
- Full existing test suite passed (35 tests before additional tests).
- Scoped lint reported no errors; existing formatting warnings remain. Full-project lint timed out after three minutes.
- Automated preview build reported build OK; no manual build was run.
- Authenticated voice calls and saved interview feedback could not be verified with this external Supabase project. No session was fabricated.
- No new raw audio or transcript persistence was introduced.

## ElevenLabs settings
The existing agent must allow prompt, first-message and language overrides. The deployed `elevenlabs-session` function must accept the user's Supabase token, have its existing ElevenLabs secrets configured, and allow this site's origin. These external settings were not independently verified.

## Installation testing after publication
1. Chrome desktop: open the published HTTPS site, then use the install icon in the address bar or Chrome menu > Cast, save and share > Install page as app.
2. Chrome Android: open the published HTTPS site, then Chrome menu > Add to Home screen > Install.
3. Launch the installed app and check sign-in, theme switching, job navigation and interview controls.
4. Cloud features need a connection; there is intentionally no offline caching or private-data storage in the worker.

No native packaging, AdMob, paid packaging provider or new advertising integration was added. Production installation is not yet verified. Git branching and pull request creation were not performed because repository state is managed by Lovable in this environment.