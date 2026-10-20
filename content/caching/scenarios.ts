import type { Scenario } from '@/lib/engine/types';

/**
 * The wave set the player is tested against (the rules engine's content).
 *
 * Wave 3 is Caching Module — Scenario 1 "Read Storm" (see docs-caching-module.md):
 * it uses read-path awareness (App -> Cache -> DB) and ships both a pass and a
 * fail explanation. Scenarios 2–4 of the caching module layer on from here, one
 * engine primitive at a time (policy, missProtection, data profile).
 */
export const SCENARIOS: Scenario[] = [
  {
    wave: 'Wave 1',
    title: 'First Customers',
    users: 50,
    desc: 'A trickle of early users arrive. Requests need somewhere to land.',
    check: (g) => {
      const ok = g.linked('app') && g.linked('db');
      return {
        pass: ok,
        need: ['app', 'db'],
        hint: 'Requests have nowhere to go. Place an App Server and a Database, and connect Users → App Server → Database.',
      };
    },
  },
  {
    wave: 'Wave 2',
    title: 'Word Is Spreading',
    users: 5000,
    desc: 'Thousands show up at once. A single server starts to smoke.',
    check: (g) => {
      const ok = g.linked('lb') && g.count('app') >= 2;
      return {
        pass: ok,
        need: ['lb', 'app'],
        hint: "One server can't take it. Add a Load Balancer and a second App Server behind it.",
      };
    },
  },
  {
    // Caching Module — Scenario 1: "Read Storm"
    wave: 'Wave 3',
    title: 'Read Storm',
    users: 25000,
    desc: 'Your feed is a hit. The same popular posts get read tens of thousands of times a second. Your database is doing the same expensive query over and over and starting to choke.',
    check: (g) => {
      const ok = g.onReadPath('cache');
      return {
        pass: ok,
        need: ['cache'],
        hint: 'Every read is hitting the database directly, including the same popular post 20,000 times a second. The database can’t keep up and requests start timing out. The fix isn’t a bigger database — it’s to stop asking it the same question repeatedly. Put a Cache on the read path (App Server → Cache → Database).',
        explainPass:
          'The cache now answers the repeated reads from memory. 95% of requests never touch the database — that’s your cache hit ratio. The database went from 25,000 queries/sec to about 1,200. You didn’t make the database faster; you stopped asking it the same question.',
      };
    },
  },
  {
    wave: 'Wave 4',
    title: 'Media Goes Viral',
    users: 100000,
    desc: 'A post blows up. Images hammer your app servers from everywhere.',
    check: (g) => {
      const ok = g.linked('cdn');
      return {
        pass: ok,
        need: ['cdn', 'storage'],
        hint: 'Static media is crushing your servers. Add a CDN (ideally backed by Object Storage) to serve files from the edge.',
      };
    },
  },
  {
    wave: 'Wave 5',
    title: 'Backlog of Jobs',
    users: 250000,
    desc: 'Thumbnails, emails and encoding pile up and block live requests.',
    check: (g) => {
      const ok = g.linked('queue');
      return {
        pass: ok,
        need: ['queue'],
        hint: 'Heavy background work is blocking users. Add a Message Queue so jobs run async.',
      };
    },
  },
  {
    wave: 'Final Wave',
    title: 'Global Scale',
    users: 1000000,
    desc: 'A million users, worldwide, all at once. Everything must work together.',
    check: (g) => {
      const need = ['lb', 'cache', 'db', 'cdn', 'queue'];
      const missing = need.filter((t) => !g.linked(t));
      const ok = missing.length === 0 && g.count('app') >= 3 && (g.linked('replica') || g.linked('cache'));
      return {
        pass: ok,
        need: need.concat('app'),
        hint: 'To survive a million users you need the whole stack connected: Load Balancer, 3+ App Servers, Cache, Read Replica, Database, CDN and a Message Queue.',
      };
    },
  },
];
