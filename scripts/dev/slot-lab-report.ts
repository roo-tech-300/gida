/**
 * Reads the slot lab back and checks it against the rules the app relies on.
 *
 *   npm run db:slot-report
 *
 * Data rules are plain queries. Behaviour probes run as real lab students inside transactions that
 * are always rolled back, so nothing in your database changes.
 */
import { DATA_RULES, PROBES, type Check } from './slot-lab-checks.ts';

let findings = 0;

function section(name: string, checks: Check[]): void {
  console.log(`\n${name}`);
  for (const check of checks) {
    let problems: string[];
    try {
      problems = check.run();
    } catch (error) {
      problems = [`could not run: ${error instanceof Error ? error.message : String(error)}`];
    }
    if (problems.length === 0) {
      console.log(`  ✔ [${check.area}] ${check.title}`);
      continue;
    }
    findings += problems.length;
    console.log(`  ⚠ [${check.area}] ${check.title}`);
    for (const p of problems) console.log(`      - ${p}`);
  }
}

section('Data rules', DATA_RULES);
section('Behaviour probes (rolled back)', PROBES);
console.log(`\n${findings === 0 ? 'No findings.' : `${findings} finding(s) above.`}`);
