/** Runs SQL inside the local Supabase Postgres container, optionally as a signed-in student. */
import { spawnSync } from 'node:child_process';

export interface SqlResult {
  rows: string[][];
  error: string | null;
}

const NOISE = /^(BEGIN|SET|ROLLBACK|COMMIT|\{"sub")/;

export function runSql(sql: string): SqlResult {
  const run = spawnSync('docker', ['exec', '-i', 'supabase_db_gida', 'psql', '-U', 'postgres', '-tA', '-F', '|'], { input: sql, encoding: 'utf8' });
  if (run.error) throw new Error(`[SlotLab] Could not run psql in the local database container: ${run.error.message}`);
  const lines = run.stdout.split('\n').map((l) => l.trim()).filter((l) => l && !NOISE.test(l));
  const failure = /ERROR:\s*(.+)/.exec(run.stderr);
  return { rows: lines.map((l) => l.split('|')), error: failure ? failure[1].trim() : null };
}

export function userId(email: string): string {
  const id = runSql(`select id from auth.users where email='${email}'`).rows[0]?.[0];
  if (!id) throw new Error(`[SlotLab] No account ${email}. Run \`npm run db:seed:lab\` first.`);
  return id;
}

/** Runs the statements as that student (row-level security applies) and always rolls back. */
export function asStudent(email: string, statements: string): SqlResult {
  const claims = JSON.stringify({ sub: userId(email), role: 'authenticated' });
  return runSql(`begin; set local role authenticated; select set_config('request.jwt.claims', '${claims}', true); ${statements} rollback;`);
}

/** Runs as the service role, which is how the Cloudflare worker calls the pay-link function. */
export function asService(statements: string): SqlResult {
  return runSql(`begin; set local role service_role; ${statements} rollback;`);
}
