/**
 * Core engine types. These are pure data contracts — no DOM, no React.
 * Everything the rules engine reasons about flows through here.
 */

export type ComponentType =
  | 'users'
  | 'lb'
  | 'app'
  | 'cache'
  | 'db'
  | 'replica'
  | 'cdn'
  | 'queue'
  | 'storage';

/** A brick placed on the board. The engine only needs uid + type; x/y are UI-only. */
export interface PlacedBrick {
  uid: number;
  type: ComponentType | string;
  x?: number;
  y?: number;
}

/** An undirected connection between two bricks, referenced by uid. */
export interface Edge {
  a: number;
  b: number;
}

/**
 * The read-only view a scenario is handed. This is the stable abstraction the
 * whole platform extends: add new helpers here, never break the existing ones.
 */
export interface Graph {
  /** Is at least one brick of this type reachable from the Users node? */
  linked: (type: string) => boolean;
  /** How many reachable bricks of this type exist? */
  count: (type: string) => number;
  /**
   * Read-path awareness: is a brick of `type` wired *between* a `front` (default
   * App Server) and `behind` (default Database) — i.e. `App -> type -> DB`, not
   * just connected somewhere? This is what lets the engine tell "cache on the
   * read path" from "cache dangling off to the side".
   */
  onReadPath: (type: string, behind?: string, front?: string) => boolean;
  /** Set of uids reachable from the Users node (for FX / highlighting). */
  reachable: Set<number>;
}

/** What a scenario's `check` returns. */
export interface ScenarioResult {
  pass: boolean;
  /** Component types the player likely needs (drives the palette fail-hint flash). */
  need: string[];
  /** Plain-English explanation shown on failure — teaches the why. */
  hint: string;
  /** Plain-English explanation shown on success — teaches the why. */
  explainPass?: string;
}

/** A single wave the player is tested against. */
export interface Scenario {
  wave: string;
  title: string;
  users: number;
  desc: string;
  check: (g: Graph) => ScenarioResult;
}
