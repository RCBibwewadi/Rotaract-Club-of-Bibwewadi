import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Rotaract Club of Bibwewadi Pune | RCB - Make it Matter',
    template: '%s | Rotaract Club of Bibwewadi',
  },
  description:
    'Rotaract Club of Bibwewadi (RCB), Pune — a Rotary International sponsored youth service club. Community service, professional development, events, and leadership opportunities in Bibwewadi, Pune. Make it Matter.',
  keywords: [
    'Rotaract',
    'Rotaract Club',
    'Rotaract Club of Bibwewadi',
    'RCB',
    'RCB Pune',
    'Rotaract Bibwewadi',
    'Bibwewadi',
    'Rotary',
    'Rotary International',
    'Rotary Club of Bibwewadi',
    'Pune',
    'youth club Pune',
    'community service Pune',
    'volunteer Pune',
    'social service club',
    'Rotaract District 3131',
    'Make it Matter',
    'leadership development',
    'professional development Pune',
    'NGO Pune',
  ],
  metadataBase: new URL('https://www.rcbibwewadipune.org'),
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://www.rcbibwewadipune.org',
    siteName: 'Rotaract Club of Bibwewadi',
    title: 'Rotaract Club of Bibwewadi Pune | RCB - Make it Matter',
    description:
      'Rotaract Club of Bibwewadi (RCB), Pune — community service, events, and leadership. A Rotary International sponsored youth club. Make it Matter.',
    images: ['/logo.png'],
  },
  twitter: {
    card: 'summary',
    title: 'Rotaract Club of Bibwewadi Pune | RCB',
    description:
      'Official website of Rotaract Club of Bibwewadi, Pune. Community service, events & leadership. Make it Matter.',
    images: ['/logo.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var store = JSON.parse(localStorage.getItem('rcb-site-data') || '{}');
                  if (store.isDark) document.documentElement.classList.add('dark');
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="font-[DM_Sans] antialiased dark:text-white text-dark transition-colors duration-300 bg-transparent">
        {children}
      </body>
    </html>
  );
}
