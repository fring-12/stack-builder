import { describe, expect, it } from 'vitest';
import { buildGraph } from './graph';
import type { Edge, PlacedBrick } from './types';
import { SCENARIOS } from '@/content/caching/scenarios';

/** Tiny builder so tests read like boards. */
function board(bricks: Array<[number, string]>, links: Array<[number, number]>) {
  const placed: PlacedBrick[] = bricks.map(([uid, type]) => ({ uid, type }));
  const edges: Edge[] = links.map(([a, b]) => ({ a, b }));
  return buildGraph(placed, edges);
}

describe('buildGraph — reachability', () => {
  it('linked() is false for a brick not wired back to Users', () => {
    // users—app, db present but disconnected
    const g = board([[1, 'users'], [2, 'app'], [3, 'db']], [[1, 2]]);
    expect(g.linked('app')).toBe(true);
    expect(g.linked('db')).toBe(false); // db is on the board but unreachable
  });

  it('count() only counts reachable bricks of a type', () => {
    const g = board(
      [[1, 'users'], [2, 'app'], [3, 'app'], [4, 'app']],
      [[1, 2], [1, 3]], // only two apps reachable; #4 is floating
    );
    expect(g.count('app')).toBe(2);
  });

  it('empty board (no users) reaches nothing', () => {
    const g = board([[1, 'app'], [2, 'db']], [[1, 2]]);
    expect(g.linked('app')).toBe(false);
  });
});

describe('buildGraph — onReadPath (the caching Scenario 1 rule)', () => {
  it('passes when Cache sits between App and DB (App → Cache → DB)', () => {
    const g = board(
      [[1, 'users'], [2, 'app'], [3, 'cache'], [4, 'db']],
      [[1, 2], [2, 3], [3, 4]],
    );
    expect(g.onReadPath('cache')).toBe(true);
  });

  it('fails when Cache dangles off the App only (not wired to DB)', () => {
    const g = board(
      [[1, 'users'], [2, 'app'], [3, 'cache'], [4, 'db']],
      [[1, 2], [2, 3], [2, 4]], // cache touches app but not db; app talks straight to db
    );
    expect(g.linked('cache')).toBe(true); // it IS connected...
    expect(g.onReadPath('cache')).toBe(false); // ...but not on the read path
  });

  it('fails when there is no cache at all', () => {
    const g = board([[1, 'users'], [2, 'app'], [3, 'db']], [[1, 2], [2, 3]]);
    expect(g.onReadPath('cache')).toBe(false);
  });

  it('fails when the cache subgraph is unreachable from Users', () => {
    // app↔cache↔db form the read path, but nothing connects to users
    const g = board(
      [[1, 'users'], [2, 'app'], [3, 'cache'], [4, 'db']],
      [[2, 3], [3, 4]],
    );
    expect(g.onReadPath('cache')).toBe(false);
  });
});

describe('Scenario 1 "Read Storm" wiring', () => {
  const readStorm = SCENARIOS.find((s) => s.title === 'Read Storm')!;

  it('exists at 25,000 users with both explanations authored', () => {
    expect(readStorm).toBeTruthy();
    expect(readStorm.users).toBe(25000);
    const res = readStorm.check(board([[1, 'users']], []));
    expect(res.explainPass).toBeTruthy();
    expect(res.hint).toBeTruthy();
  });

  it('fails a bare Users→App→DB board, passes once a Cache is on the read path', () => {
    const fail = readStorm.check(
      board([[1, 'users'], [2, 'app'], [3, 'db']], [[1, 2], [2, 3]]),
    );
    expect(fail.pass).toBe(false);

    const pass = readStorm.check(
      board([[1, 'users'], [2, 'app'], [3, 'cache'], [4, 'db']], [[1, 2], [2, 3], [3, 4]]),
    );
    expect(pass.pass).toBe(true);
  });
});
