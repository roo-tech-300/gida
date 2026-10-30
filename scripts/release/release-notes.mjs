// Release notes for the in-app "What's new" box (used by
// .github/workflows/build-android.yml).
//
//   gh pr view N --json body --jq .body | node scripts/release/release-notes.mjs
//
// Prints the text under the PR description's "## Release notes" heading, up
// to the next heading. Prints nothing when the section is missing or still
// only holds the template's comment: the app then hides "What's new" rather
// than showing a commit message to users.

const HEADING = /^#{1,6}\s+release notes\s*$/i;
const ANY_HEADING = /^#{1,6}\s/;

export function extractReleaseNotes(body) {
  const lines = (body ?? '').replace(/<!--[\s\S]*?-->/g, '').split(/\r?\n/);
  const start = lines.findIndex((line) => HEADING.test(line.trim()));
  if (start === -1) return '';

  const section = [];
  for (const line of lines.slice(start + 1)) {
    if (ANY_HEADING.test(line.trim())) break;
    section.push(line.trimEnd());
  }
  return section.join('\n').trim().slice(0, 2000);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  let input = '';
  process.stdin.setEncoding('utf8');
  for await (const chunk of process.stdin) input += chunk;
  process.stdout.write(extractReleaseNotes(input));
}
