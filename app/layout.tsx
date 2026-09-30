import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import './regal.css';

export const metadata: Metadata = {
  icons: { icon: '/favicon.svg' },
  title: 'After AI — Which future would you choose?',
  description: 'Explore twelve possible AI futures. Discover how your values shape the worlds you would want to live in with an interactive values compass and scenario atlas.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
