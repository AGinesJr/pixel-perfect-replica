# Workforce Prep: Brand, SEO, AIEO, LLMO, AEO, MPO & GPO Audit

**Repository:** `AGinesJr/pixel-perfect-replica`  
**Review date:** 2026-10-17  
**Scope:** source-level review and implementation of foundational branding and discoverability changes. This is not a live crawl, Lighthouse run, Search Console report, or guarantee of ranking/indexing.

## Implemented in this change

### Brand and UX
- Standardized the design tokens around midnight navy (`#0B1220`), slate panels (`#151F32`), electric cyan (`#24D7E8`), achievement lime (`#A5E65A`), cloud-white text, and steel-gray secondary text.
- Standardized typography to Inter for interface/body copy and Space Grotesk for display headings.
- Added consistent focus-visible styles, reduced-motion handling, text rendering, and touch interaction refinements.
- Reworked the public homepage around a single career-advancement promise, feature pathways, trust/limitations messaging, FAQs, and clear calls to action.
- Kept practice employers and roles explicitly described as fictional, avoiding claims that would mislead job seekers.

### Technical SEO and AEO foundations
- Expanded site-wide title, description, Open Graph, Twitter, and theme-color metadata.
- Added homepage-specific title/description and index directives.
- Added JSON-LD for WebSite, SoftwareApplication, and FAQPage. FAQ answers are visible in the page content and schema is generated from the same FAQ data.
- Changed the root auth gate so the marketing homepage and account route render without a session, while product tools remain gated. This gives crawlers a real public page rather than a sign-in interstitial.
- Updated robots.txt to keep account-only application tools out of search indexes until those routes have crawlable public landing pages.
- Prioritized hero image fetching and added responsive content hierarchy and semantic section/article elements.

## Findings and remaining opportunities

### P0 — Confirm canonical production domain
No canonical public domain was supplied in the repository context. Do not guess one. Once confirmed:
- Add canonical URL tags to public routes.
- Add a production sitemap with absolute URLs for indexable public pages only.
- Add the verified property to Google Search Console and Bing Webmaster Tools.
- Verify the live robots.txt and rendered HTML after deployment.
- Add a real Open Graph image with correct absolute URL and dimensions.

### P0 — Validate the public-vs-private route policy
The current product is gated behind sign-in, with the homepage and account route public. Robots.txt disallows the gated feature paths to reduce unwanted indexing, but robots.txt is not an access-control mechanism. Keep authorization checks in the app/server. If public SEO pages are desired for jobs, market insights, resume tools, and interview practice, build separate, useful public landing pages that do not expose private user data, then allow only those public URLs to be indexed.

### P1 — Rendering and indexability
- Confirm production SSR returns the full homepage title, description, primary heading, body content, and JSON-LD to a no-JavaScript crawler.
- Check that route-specific metadata correctly overrides root metadata and that each indexable route has a unique title and description.
- Confirm generated route chunks and redirects do not create duplicate URLs, soft 404s, or accidental noindex states.
- Consider prerendering or static rendering for stable public marketing and editorial pages if supported by the hosting architecture.

### P1 — Structured data quality
- Validate JSON-LD with Schema.org Validator and Google Rich Results Test after deployment.
- Keep SoftwareApplication details factual; add pricing, ratings, screenshots, or URLs only when they exist and are verifiable.
- FAQ structured data is useful for semantic clarity, but Google does not generally show FAQ rich results for most commercial sites; do not promise a rich-result feature.
- Add BreadcrumbList only to routes where visible breadcrumbs are implemented.
- Use JobPosting structured data only for real, current vacancies with accurate employer, location, date, and application information. **Do not use JobPosting schema for fictional practice roles.**

### P1 — AIEO / LLMO / AEO (answer and language-model discoverability)
- Publish public, expert-reviewed guides that directly answer high-intent questions: how to prepare for interviews, how to tailor a resume to a role, how to interpret a resume-match score, and how to research labor-market trends.
- Put a concise answer near the top of each guide, followed by definitions, steps, examples, source citations, last-reviewed date, and author/editor credentials where accurate.
- Use descriptive headings, stable URLs, explicit entities and terminology, original examples, and useful internal links.
- Make labor-market insights explain the metric, geography, period, methodology, data source, and update cadence. Cite primary sources such as BLS when the data originates there.
- Ensure important public content is present in server-rendered HTML; do not rely solely on client-side charts or interactions to communicate key facts.
- Keep an up-to-date About, methodology, privacy, contact, and editorial policy page as applicable. Do not fabricate credentials, experts, or claims of AI accuracy.
- Do not treat an `llms.txt` file as a substitute for crawlable pages, ordinary technical SEO, or reputable source citations. It is an optional experiment, not a guaranteed ranking lever.

### P1 — MPO (marketplace optimization, working definition)
The acronym MPO is ambiguous; this audit uses it to mean marketplace optimization. Because this product currently presents fictional practice roles, it should not imply that it is a live job marketplace.
- Make the simulator-versus-live-vacancy distinction prominent anywhere sample roles appear.
- If real listings are added later, create indexable job detail pages only when the data is current, original, and allowed to be indexed.
- Add accurate role taxonomy, location/work-arrangement filters, salary transparency where available, and clear application destinations.
- Remove expired jobs from public listings, return appropriate HTTP status codes, and use JobPosting structured data only for eligible real vacancies.
- Build employer/industry landing pages only where they contain distinct, useful information—not doorway pages assembled from keyword swaps.

### P1 — GPO (generative platform optimization, working definition)
The acronym GPO is ambiguous; this audit uses it to mean generative-platform optimization.
- Prioritize factual, quotable explanations and unique, well-sourced data rather than keyword repetition.
- Maintain consistent brand/entity naming across the site, social profiles, and reputable third-party references.
- Make pages easy to cite: clearly label source, data period, methodology, and author/reviewer where applicable.
- Track referrals and citations from AI search surfaces where analytics or referral data supports them; no method can guarantee inclusion in generated answers.
- Avoid mass-produced near-duplicate AI pages, fabricated statistics, fake testimonials, or schema that claims features and outcomes the product does not deliver.

### P2 — Performance and accessibility
- Run production Lighthouse/PageSpeed tests on mobile and desktop; source review alone cannot establish Core Web Vitals.
- Review image formats/sizes, font loading, JavaScript bundle size, chart rendering, and third-party scripts.
- Confirm all controls have accessible names, forms have explicit labels, focus order is logical, and text/control contrast meets WCAG 2.2 AA.
- Test reduced motion, keyboard-only navigation, zoom, narrow mobile widths, and slow network conditions.
- Lazy-load below-the-fold imagery and charts where it improves measured performance; preserve fast loading of the main hero/LCP element.

### P2 — Measurement and experimentation
- Establish Search Console and Bing Webmaster baselines after deployment.
- Track impressions, clicks, query/page performance, branded vs non-branded discovery, and crawl/index coverage.
- Use analytics with appropriate privacy controls to measure search-to-detail, resume workflow completion, interview practice completion, task success, and return value.
- A/B test one material UX change at a time. Do not optimize solely for session length; measure meaningful user outcomes.

## Acronym definitions used here
- **SEO:** Search Engine Optimization.
- **AIEO:** AI Engine Optimization (often used interchangeably with generative/answer engine optimization).
- **LLMO:** Large Language Model Optimization.
- **AEO:** Answer Engine Optimization.
- **MPO:** Marketplace Optimization (ambiguous; defined for this audit).
- **GPO:** Generative Platform Optimization (ambiguous; defined for this audit).

These labels overlap substantially. The durable strategy is technically accessible pages, useful original content, reliable sourcing, clear entity identity, honest structured data, fast accessible UX, and measurable iteration—not a separate trick for every acronym.

## Verification status
- Repository files and configuration reviewed through GitHub source access.
- No local dependency install, build, lint, unit tests, browser audit, live production crawl, Search Console inspection, or deployment verification was available in this GitHub-only workflow.
- Run `bun run lint`, `bun run test`, and `bun run build` in CI or a local checkout before merging/deploying.
