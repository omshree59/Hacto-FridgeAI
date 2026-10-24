import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'FridgeFlow AI — Local-First AI Fridge Scanner & Grocery Intelligence',
  description:
    'Snap a photo. Know what you have. Shop only what you need. 100% private, local-first grocery scanning and shopping list generator powered by Ollama.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col transition-colors selection:bg-emerald-200 selection:text-emerald-950">
        <ThemeProvider>
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
