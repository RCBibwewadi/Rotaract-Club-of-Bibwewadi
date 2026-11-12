import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Rotaract Club of Bibwewadi',
    short_name: 'RCB',
    description:
      'Rotaract Club of Bibwewadi (RCB), Pune — community service, events, and leadership. Make it Matter.',
    // The installed app opens the members' app, not the website. Scope stays
    // at '/' so the unlisted sign-up form still opens inside the app.
    start_url: '/app',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    lang: 'en-IN',
    theme_color: '#8b1a2b',
    background_color: '#fafaf9',
    categories: ['social', 'education', 'lifestyle'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      {
        src: '/icons/icon-maskable-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
