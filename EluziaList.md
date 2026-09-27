# Gida SEO Go-Live Checklist

## Goal

Make only `https://gida.apartments/` eligible for Google indexing. Keep app routes and the legal pages out of search results.

## Current status (checked 27 September 2026)

- SEO metadata exists in `components/seo/default-head.tsx` and is mounted in `app/_layout.tsx`.
- `public/landing/index.html` has title, description, canonical, Open Graph, and Twitter metadata.
- `public/privacy.html` and `public/terms.html` have `noindex, nofollow` metadata.
- Expo Router-generated sitemap is disabled in `app.json`.
- Vercel is configured to run `npx expo export --platform web` and serve `dist`.
- `public/robots.txt`, `public/sitemap.xml`, and `public/404.html` are missing.
- The app's `/` route currently redirects based on authentication; the signed-out landing route is gated to the coming-soon screen. The target indexable marketing homepage from the previous checklist is not implemented in this checkout.
- The current canonical/metadata describes the general platform and uses `https://gida.apartments`; verify it matches the actual homepage content before launch.
- Fix applied: `Head` is a default export in this installed Expo Router version. `DefaultHead` must use `import Head from 'expo-router/head'`.

## A. Code work required before deployment

1. **Decide the exact public homepage.** If the goal remains an indexable marketing page at `/`, implement it as the root web route with server/static-rendered visible content. Do not redirect crawlers to an empty shell or gated app screen. Keep signed-in app routing working for users.
2. **Set homepage metadata to match visible copy.** Provide a distinct title, description, canonical URL (`https://gida.apartments/`), Open Graph tags, and Twitter card metadata. Avoid a canonical pointing at `/` from every app route. Apply `noindex` to non-public app routes using route-appropriate metadata.
3. **Add `public/robots.txt`.** Allow crawling of `/` and disallow app/private routes. Do not disallow the entire site: crawlers must be able to fetch the homepage and read its metadata. Keep rules consistent with the sitemap and route policy.
4. **Add `public/sitemap.xml`.** Include exactly one canonical URL: `https://gida.apartments/`. Make sure Expo export copies it to `dist/sitemap.xml`.
5. **Add a real 404 page/behavior.** Ensure unknown URLs return HTTP 404 (not a successful homepage rewrite) and show a useful branded not-found page. Validate Vercel's routing rules against Expo's generated paths.
6. **Review static export and SEO output locally.** Run `npx expo export --platform web`; inspect `dist/index.html`, `dist/robots.txt`, `dist/sitemap.xml`, and the 404 output. Confirm homepage text and metadata are in the HTML without requiring client-side JavaScript.
7. **Keep app routes out of search results.** Validate route metadata/headers for sign-in, onboarding, property, roommate, messages, and admin paths. `robots.txt` disallow rules alone do not guarantee de-indexing; use `noindex` where crawlers can access pages, and do not block crawling of pages whose `noindex` must be read.

## B. Deploy (owner action)

1. Review `git status --short` and `git diff`; confirm only intended SEO/app changes are included.
2. Stage and commit the reviewed changes on the branch used by the existing release process.
3. Push that branch to GitHub.
4. In Vercel, promote the matching deployment to Production using the established manual promotion flow.
5. Wait for the production deployment to report Ready. The local export succeeding does not confirm the live deployment is correct.

## C. Verify production before asking Google to index

- [ ] `https://gida.apartments/` loads the intended public homepage.
- [ ] View Source contains the expected visible homepage copy, title, description, canonical, and social metadata.
- [ ] `https://gida.apartments/robots.txt` returns plain text with the intended rules.
- [ ] `https://gida.apartments/sitemap.xml` returns valid XML with only `https://gida.apartments/`.
- [ ] `https://gida.apartments/privacy.html` and `/terms.html` load for people and include `noindex, nofollow`.
- [ ] Representative private/app routes are excluded from indexing as intended.
- [ ] A random nonexistent path shows the branded 404 and returns HTTP 404.
- [ ] Canonical URL, host, and HTTPS behavior are consistent (one canonical homepage URL; redirects converge on it).

Do not submit the sitemap to Google until all checks above pass.

## D. Google Search Console (owner action)

1. Verify the `gida.apartments` **Domain property** with the DNS TXT record Google provides. Add it wherever the domain's DNS is managed, then complete verification. A URL-prefix property with an HTML verification tag is an alternative.
2. Submit `https://gida.apartments/sitemap.xml` in Search Console's Sitemaps section.
3. Use URL Inspection on `https://gida.apartments/`, run the live test, and confirm it can fetch the page and sees the intended title, description, canonical, and indexability.
4. Request indexing for the homepage.
5. Check Search Console for sitemap or indexing errors over the following days. Indexing can take days or weeks; avoid repeatedly resubmitting an unchanged sitemap.

## E. Keep out of scope for this launch

- Do not add property/listing URLs to the sitemap until those pages are intentionally public, crawlable, and have useful unique metadata.
- Do not add the coming-soon route to the sitemap unless the decision changes to make it searchable.
- Keep preview deployments out of Search Console and ensure they cannot be indexed.
