# Gida SEO Go-Live Checklist

## Goal

Make the homepage and four public Minna housing pages eligible for Google indexing. Keep private app routes and legal pages out of search results.

## Current status

- [x] SEO metadata component exists in `components/seo/default-head.tsx`, is mounted in `app/_layout.tsx`, and uses Expo Router's default `Head` export.
- [x] `DefaultHead` now sets `index, follow` and the homepage canonical only on `/`; other app routes get `noindex, nofollow` and no homepage canonical.
- [x] `public/landing/index.html` has title, description, canonical, Open Graph, and Twitter metadata.
- [x] `public/privacy.html` and `public/terms.html` have `noindex, nofollow` metadata.
- [x] `public/robots.txt` allows crawling and points crawlers to the sitemap.
- [x] `public/sitemap.xml` contains the homepage and the four canonical housing and guide URLs.
- [x] `public/404.html` provides a branded not-found page.
- [x] The production web root is built from the existing marketing page in `public/landing/index.html`; its metadata canonicalizes `/`, and a small no-JavaScript fallback includes the core headline and links.
- [x] The public marketing page assets are referenced at `/landing/...`; the build copies its relative `gida.png` asset to the web root as required by the built bundle.
- [x] The marketing bundle requests its slideshow images relative to `/`; the post-export script copies `public/landing/Screenshots` to `dist/Screenshots` so those requests resolve on Vercel.
- [x] Expo Router sitemap generation is disabled in `app.json`.
- [x] Vercel is configured for clean URLs and known dynamic app-route rewrites. The broad catch-all was removed so unknown paths can return a real 404.
- [x] `scripts/copy-public-assets.mjs` copies public static files into `dist` after Expo export; local export initially omitted the new SEO files, and this script now ensures Vercel receives them.
- [x] Local export confirmed `dist/robots.txt`, `dist/sitemap.xml`, `dist/404.html`, and `dist/coming-soon.html` are present; `dist/coming-soon.html` has `noindex` metadata.
- [x] Minna, Gidan Kwano, Bosso, and the Minna lodge guide are available as public static pages under `public/housing/` and `public/guides/`, styled with `public/housing-pages.css`.
- [x] All four pages are indexable, have self-referencing canonical URLs, and are included in the sitemap.
- [x] The guide title and heading directly answer “How do I get a lodge in Minna?” and its steps follow the Gida account, preference, reservation, and payment flow.
- [x] The public asset-copy step includes the new static pages and stylesheet in the Vercel export.
- [x] The chosen SEO homepage is the existing marketing landing page, published at `/` by the Vercel post-export asset-copy step. Native root routing remains unchanged.
- [x] Root-page canonical, title, description, and social metadata now belong to the marketing page rather than the generic app head.
- [ ] Deploy and verify Vercel clean-URL routing, `/coming-soon` refresh, and HTTP status for unknown paths; local export alone cannot verify Vercel status behavior.

## A. Code work completed; verify after deployment

The root is built from the existing marketing site. Its metadata canonicalizes `/`; `robots.txt` allows crawling; and the sitemap lists the homepage plus the four public Minna housing pages. The post-export script copies these static files into `dist` and publishes the marketing HTML at the root. Private app routes and legal pages use `noindex, nofollow` and omit the homepage canonical. Vercel uses clean URLs, explicit app-route rewrites, and a branded 404 file; the broad catch-all has been removed so unknown routes can return 404.

Local validation completed: `npx tsc --noEmit`, `npx expo export --platform web`, copying public files into `dist`, inspecting the generated homepage and SEO files, and checking `vercel.json` plus `git diff --check`. Expo's Metro cache reported a corrupt cache and fell back to a full crawl; export completed successfully.

The remaining step is production verification. In particular, confirm Vercel serves `/coming-soon` after a hard refresh, app routes still load, and a random unknown URL returns HTTP 404.

## B. Deploy (owner action)

1. Review `git status --short` and `git diff`; confirm only intended SEO/app changes are included.
2. Stage and commit the reviewed changes on the branch used by the existing release process.
3. Push that branch to GitHub.
4. In Vercel, promote the matching deployment to Production using the established manual promotion flow.
5. Wait for the production deployment to report Ready. The local export succeeding does not confirm the live deployment is correct.

## C. Verify production before asking Google to index

- [ ] `https://gida.apartments/` loads the intended public homepage.
- [ ] View Source contains the expected visible homepage copy, title, description, canonical, and social metadata.
- [ ] `https://gida.apartments/robots.txt` returns plain text allowing crawlers to access the public pages.
- [ ] `https://gida.apartments/sitemap.xml` returns valid XML with the homepage and all four canonical housing and guide URLs.
- [ ] `/housing/minna`, `/housing/gidan-kwano`, `/housing/bosso`, and `/guides/how-to-find-house-minna` load successfully, show their intended content, and have no `noindex` directive.
- [ ] `https://gida.apartments/privacy.html` and `/terms.html` load for people and include `noindex, nofollow`.
- [ ] Representative private/app routes are excluded from indexing as intended.
- [ ] `/coming-soon` survives a hard refresh.
- [ ] A random nonexistent path shows the branded 404 and returns HTTP 404 after the catch-all rewrite removal.
- [ ] Canonical URL, host, and HTTPS behavior are consistent (one canonical homepage URL; redirects converge on it).

Do not submit the sitemap to Google until all checks above pass.

## D. Google Search Console (owner action)

1. Verify the `gida.apartments` **Domain property** with the DNS TXT record Google provides. Add it wherever the domain's DNS is managed, then complete verification. A URL-prefix property with an HTML verification tag is an alternative.
2. Submit `https://gida.apartments/sitemap.xml` in Search Console's Sitemaps section.
3. Use URL Inspection on the homepage and each of the four housing and guide URLs. Run the live test and confirm Google can fetch each page and sees its intended canonical and indexability.
4. Request indexing for the homepage and the four housing and guide pages.
5. Check Search Console for sitemap or indexing errors over the following days. Indexing can take days or weeks; avoid repeatedly resubmitting an unchanged sitemap.

## E. Keep out of scope for this launch

- Do not add individual property/listing URLs to the sitemap until those pages are intentionally public, crawlable, and have useful unique metadata.
- Do not add the coming-soon route to the sitemap unless the decision changes to make it searchable.
- Keep preview deployments out of Search Console and ensure they cannot be indexed.
