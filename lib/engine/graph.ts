import type { Edge, Graph, PlacedBrick } from './types';

/**
 * Build the graph view the rules engine reads.
 *
 * Pure: give it the placed bricks and edges, get back the `g` helpers. No DOM,
 * no module globals — which is exactly what makes it unit-testable.
 *
 * Validity is defined by BFS reachability from the Users node, so bricks that
 * aren't wired back to Users simply don't count.
 */
export function buildGraph(placed: PlacedBrick[], edges: Edge[]): Graph {
  // adjacency list (undirected)
  const adj: Record<number, number[]> = {};
  placed.forEach((p) => {
    adj[p.uid] = [];
  });
  edges.forEach((e) => {
    if (adj[e.a] && adj[e.b]) {
      adj[e.a].push(e.b);
      adj[e.b].push(e.a);
    }
  });

  const typeByUid: Record<number, string> = {};
  placed.forEach((p) => {
    typeByUid[p.uid] = p.type;
  });

  // BFS from the Users brick
  const usersNode = placed.find((p) => p.type === 'users');
  const reachable = new Set<number>();
  if (usersNode) {
    const q: number[] = [usersNode.uid];
    reachable.add(usersNode.uid);
    while (q.length) {
      const n = q.shift()!;
      (adj[n] || []).forEach((m) => {
        if (!reachable.has(m)) {
          reachable.add(m);
          q.push(m);
        }
      });
    }
  }

  const linkedTypes: Record<string, number> = {};
  placed.forEach((p) => {
    if (reachable.has(p.uid)) {
      linkedTypes[p.type] = (linkedTypes[p.type] || 0) + 1;
    }
  });

  const onReadPath = (type: string, behind = 'db', front = 'app'): boolean =>
    placed.some((node) => {
      if (node.type !== type || !reachable.has(node.uid)) return false;
      const nbrs = adj[node.uid] || [];
      const touchesFront = nbrs.some((n) => reachable.has(n) && typeByUid[n] === front);
      const touchesBehind = nbrs.some((n) => reachable.has(n) && typeByUid[n] === behind);
      return touchesFront && touchesBehind;
    });

  return {
    linked: (t) => (linkedTypes[t] || 0) > 0,
    count: (t) => linkedTypes[t] || 0,
    onReadPath,
    reachable,
  };
}
