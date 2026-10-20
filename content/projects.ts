export interface Project {
  id: string;
  emoji: string;
  name: string;
  diff: string;
  desc: string;
  goal: string;
}

export const PROJECTS: Project[] = [
  {
    id: 'photo',
    emoji: '📸',
    name: 'PhotoShare',
    diff: 'Beginner',
    desc: 'A photo-sharing app. Users upload images and scroll a feed.',
    goal: 'Serve a global photo feed without melting your servers.',
  },
  {
    id: 'shop',
    emoji: '🛒',
    name: 'QuickCart',
    diff: 'Intermediate',
    desc: 'An online store with flash sales and heavy checkout traffic.',
    goal: 'Keep checkout alive through viral flash-sale spikes.',
  },
  {
    id: 'stream',
    emoji: '🎬',
    name: 'StreamBox',
    diff: 'Advanced',
    desc: 'A video platform streaming to users worldwide.',
    goal: 'Stream smoothly to a million concurrent viewers.',
  },
];
