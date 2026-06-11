import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Rotaract Club of Bibwewadi | RCB Pune',
  description:
    'Official website of the Rotaract Club of Bibwewadi, Pune. Make it Matter.',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'Rotaract Club of Bibwewadi | RCB Pune',
    description: 'Official website of the Rotaract Club of Bibwewadi, Pune. Make it Matter.',
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
