import assert from 'node:assert/strict';
import { test } from 'node:test';
import { TranscodeQueue } from './queue.ts';

function deferred(): { promise: Promise<void>; resolve: () => void } {
  let resolve = () => {};
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

test('runs jobs one at a time in order and ignores duplicates', async () => {
  const started: string[] = [];
  const gates = new Map([['a', deferred()], ['b', deferred()]]);
  const queue = new TranscodeQueue(async (id) => {
    started.push(id);
    await gates.get(id)?.promise;
  });

  queue.enqueue('a');
  queue.enqueue('b');
  queue.enqueue('a');
  await Promise.resolve();
  assert.deepEqual(started, ['a']);
  assert.equal(queue.size, 2);

  gates.get('a')?.resolve();
  await new Promise((r) => setImmediate(r));
  assert.deepEqual(started, ['a', 'b']);

  gates.get('b')?.resolve();
  await new Promise((r) => setImmediate(r));
  assert.equal(queue.size, 0);
});

test('cancel aborts the running job and drops pending ones', async () => {
  const seen: string[] = [];
  const queue = new TranscodeQueue(
    (id, signal) =>
      new Promise<void>((resolve) => {
        seen.push(id);
        signal.addEventListener('abort', () => resolve());
      }),
  );

  queue.enqueue('a');
  queue.enqueue('b');
  queue.cancel('b');
  queue.cancel('a');
  await new Promise((r) => setImmediate(r));
  assert.deepEqual(seen, ['a']);
  assert.equal(queue.size, 0);
});

test('a crashing job does not stop the queue', async () => {
  const seen: string[] = [];
  const originalError = console.error;
  console.error = () => {};
  const queue = new TranscodeQueue(async (id) => {
    seen.push(id);
    if (id === 'bad') throw new Error('boom');
  });

  queue.enqueue('bad');
  queue.enqueue('good');
  await new Promise((r) => setImmediate(r));
  console.error = originalError;
  assert.deepEqual(seen, ['bad', 'good']);
});
