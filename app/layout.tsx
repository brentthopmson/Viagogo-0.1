import './globals.css';
import '@fortawesome/fontawesome-svg-core/styles.css';
import { config } from '@fortawesome/fontawesome-svg-core';
import RootLayoutWrapper from './RootLayout';
import { Inter } from 'next/font/google';

import { UserProvider } from './UserContext';
import ManifestLoader from './ManifestLoader';
import RegisterSW from './RegisterSW';
import PwaInstallPrompt from './PwaInstallPrompt';
import HideSplash from './HideSplash';

config.autoAddCss = false;
const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Tickets - Concert, Sport & Theatre Tickets | viagogo the Ticket Marketplace',
  description: 'Tickets for Concerts, Sport, Theatre at viagogo, an online ticket marketplace. Buy and Sell Tickets.',
  keywords: 'viagogo, buy tickets, sell tickets, concert, sport, theater',
  manifest: '/manifest.json',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon.png', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/favicon.png',
  },
  openGraph: {
    url: 'https://www.viagogo.com/',
    title: 'Tickets - Concert, Sport & Theatre Tickets | viagogo the Ticket Marketplace',
    description: 'Tickets for Concerts, Sport, Theatre at viagogo, an online ticket marketplace. Buy and Sell Tickets.',
    siteName: 'viagogo.com',
    images: [
      {
        url: '/logo.png',
      },
    ],
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#00A0D2" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="viagogo" />
        <link rel="apple-touch-startup-image" href="/splash-1024x1024.png" />
        <link rel="preconnect" href="https://ws.vggcdn.net/" />
        <link rel="dns-prefetch" href="https://ws.vggcdn.net/" />
        <link rel="preconnect" href="https://img.vggcdn.net/" />
        <link rel="dns-prefetch" href="https://img.vggcdn.net/" />
        <link rel="preconnect" href="https://wt.viagogo.net" />
        <link rel="dns-prefetch" href="https://wt.viagogo.net" />
        <link rel="preconnect" href="https://media.stubhubstatic.com" />
        <link rel="dns-prefetch" href="https://media.stubhubstatic.com" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Inter:400,500,600,700&display=swap" />
        <style>{`
          body {
            padding-top: env(safe-area-inset-top);
            padding-bottom: env(safe-area-inset-bottom);
          }
          header.fixed {
            padding-top: env(safe-area-inset-top);
          }
          nav.fixed {
            padding-bottom: env(safe-area-inset-bottom);
          }
          #splash-screen {
            position: fixed; inset: 0; z-index: 99999;
            display: flex; align-items: center; justify-content: center;
            background: #00A0D2;
            opacity: 1; transition: opacity 0.4s ease;
            pointer-events: none;
          }
          #splash-screen.hidden { opacity: 0; }
          #splash-screen img {
            width: 80px; height: 80px; border-radius: 50%;
          }
        `}</style>
        <script dangerouslySetInnerHTML={{__html: `
          (function() {
            function hide() {
              var el = document.getElementById('splash-screen');
              if (el) el.classList.add('hidden');
            }
            if (document.readyState === 'complete' || document.readyState === 'interactive') {
              hide();
            } else {
              document.addEventListener('DOMContentLoaded', hide);
            }
          })();
        `}} />
      </head>
      <body className={inter.className}>
        <div id="splash-screen">
          <img src="/logo.png" alt="" />
        </div>
        <HideSplash />
        <UserProvider>
          <PwaInstallPrompt />
          <RootLayoutWrapper inter={inter}>
            {children}
          </RootLayoutWrapper>
        </UserProvider>
        <ManifestLoader />
        <RegisterSW />
      </body>
    </html>
  );
}