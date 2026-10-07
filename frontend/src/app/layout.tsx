import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Flowtide | Plan. Track. Deliver.',
  description: 'Flowtide — Modern unified project and task management platform.',
  icons: {
    icon: '/icon.svg',
  },
  openGraph: {
    title: 'Flowtide | Plan. Track. Deliver.',
    description: 'Flowtide — Modern unified project and task management platform.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
