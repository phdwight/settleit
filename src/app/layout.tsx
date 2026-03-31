import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AppProvider } from '@/contexts/AppContext';
import { Header } from '@/components/Header';
import { InstallPrompt } from '@/components/InstallPrompt';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';

export const metadata: Metadata = {
  title: 'SettleIt – Split Bills, Not Friendships',
  description: 'A fast, offline-first PWA to split bills and track shared expenses among friends and groups.',
  manifest: `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/manifest.json`,
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SettleIt',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icons/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#4f46e5' },
    { media: '(prefers-color-scheme: dark)', color: '#6366f1' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light">
      <body>
        <ThemeProvider>
          <AppProvider>
            <ServiceWorkerRegistration />
            <InstallPrompt />
            <Header />
            <main id="main-content" tabIndex={-1}>
              {children}
            </main>
            <footer className="text-center text-[10px] text-[var(--muted)] py-3">
              v{process.env.NEXT_PUBLIC_BUILD_VERSION}
            </footer>
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
