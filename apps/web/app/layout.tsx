import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Rotaract Club of Bibwewadi | RCB Pune',
  description:
    'Official website of the Rotaract Club of Bibwewadi, Pune. Make it Matter.',
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
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@300;400;500;600;700;800;900&display=swap"
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
      <body className="font-[Inter] antialiased dark:bg-dark dark:text-white bg-light text-dark transition-colors duration-300">
        {children}
      </body>
    </html>
  );
}
