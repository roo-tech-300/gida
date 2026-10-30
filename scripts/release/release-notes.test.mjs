// node --test scripts/release/release-notes.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { extractReleaseNotes } from './release-notes.mjs';

test('takes the section under "## Release notes" up to the next heading', () => {
  const body = '## Summary\nInternal details.\n\n## Release notes\n• Video tours\n• Faster uploads\n\n## Testing\nRan it.';
  assert.equal(extractReleaseNotes(body), '• Video tours\n• Faster uploads');
});

test('runs to the end when it is the last section', () => {
  assert.equal(extractReleaseNotes('## Release Notes\nVideo tours are here.\n'), 'Video tours are here.');
});

test('is empty without the section, so the app shows no notes', () => {
  assert.equal(extractReleaseNotes('Merge pull request #2 from roo-tech-300/feature/listing-video'), '');
  assert.equal(extractReleaseNotes(null), '');
});

test('ignores the template comment left unedited', () => {
  const body = '## Release notes\n<!-- Shown to users in "What\'s new". -->\n\n## Testing';
  assert.equal(extractReleaseNotes(body), '');
});
