import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'StackBuilder — System Design Puzzle',
  description:
    'Snap together a system out of LEGO bricks — then survive the waves of traffic that try to break it.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
