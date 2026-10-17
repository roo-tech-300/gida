import { cpSync, copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const publicDirectory = resolve('public');
const outputDirectory = resolve('dist');

if (!existsSync(publicDirectory)) {
  throw new Error(`Public assets directory not found: ${publicDirectory}`);
}

mkdirSync(outputDirectory, { recursive: true });

// Copy all public assets (includes .well-known/assetlinks.json, etc.)
// Do NOT force-overwrite so Expo's built index.html stays intact as the app shell.
cpSync(publicDirectory, outputDirectory, { recursive: true, force: false });

// Place the marketing landing page at dist/landing/index.html so Vercel
// can serve it for the root path without clobbering the Expo app shell.
// dist/index.html (produced by `expo export`) stays untouched — it is the
// entry point for all Expo Router routes including /r/:code.
mkdirSync(resolve(outputDirectory, 'landing'), { recursive: true });
copyFileSync(resolve(publicDirectory, 'landing/index.html'), resolve(outputDirectory, 'landing/index.html'));
copyFileSync(resolve(publicDirectory, 'landing/gida.png'), resolve(outputDirectory, 'gida.png'));
cpSync(resolve(publicDirectory, 'landing/Screenshots'), resolve(outputDirectory, 'Screenshots'), {
  recursive: true,
  force: true,
});

// Copy the referral invite interstitial page to dist/r-invite/
// Vercel rewrites /r/:code → /r-invite/index.html which shows a proper
// "You've been invited" page on web/desktop instead of a 404.
cpSync(resolve(publicDirectory, 'r-invite'), resolve(outputDirectory, 'r-invite'), {
  recursive: true,
  force: true,
});
