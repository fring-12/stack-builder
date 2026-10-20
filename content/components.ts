import type { ComponentType } from '@/lib/engine/types';

export interface ComponentDef {
  name: string;
  emoji: string;
  sub: string;
  /** brick gradient colours */
  top: string;
  mid: string;
  dark: string;
}

export const COMPONENTS: Record<ComponentType, ComponentDef> = {
  users:   { name: 'Users',          emoji: '👥', sub: 'traffic source',  top: '#ff8a9b', mid: '#ef5d72', dark: '#b93347' },
  lb:      { name: 'Load Balancer',  emoji: '⚖️', sub: 'spreads load',    top: '#7f9bff', mid: '#5a74f0', dark: '#3a4fc0' },
  app:     { name: 'App Server',     emoji: '🖥️', sub: 'runs your code',  top: '#6ee7a8', mid: '#3fcc86', dark: '#259c62' },
  cache:   { name: 'Cache',          emoji: '⚡', sub: 'fast reads',      top: '#ffd56b', mid: '#f6b73c', dark: '#c98f1e' },
  db:      { name: 'Database',       emoji: '🗄️', sub: 'source of truth', top: '#c89bff', mid: '#a874f0', dark: '#7a4ac0' },
  replica: { name: 'Read Replica',   emoji: '🗃️', sub: 'offloads reads',  top: '#d9b6ff', mid: '#bf93f0', dark: '#8f62c0' },
  cdn:     { name: 'CDN',            emoji: '🌐', sub: 'edge delivery',   top: '#6fe6e0', mid: '#36c6c0', dark: '#1e9994' },
  queue:   { name: 'Message Queue',  emoji: '📬', sub: 'async jobs',      top: '#ff9bd1', mid: '#f05fae', dark: '#c03a84' },
  storage: { name: 'Object Storage', emoji: '🪣', sub: 'files & media',   top: '#ffbf8a', mid: '#f59a52', dark: '#c57226' },
};

/** Palette order. Users is auto-placed and not draggable, so it's excluded. */
export const PALETTE: ComponentType[] = ['lb', 'app', 'cache', 'db', 'replica', 'cdn', 'queue', 'storage'];
