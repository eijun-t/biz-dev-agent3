import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import '@/styles/design-tokens.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'AI Business Dashboard - 革新的なビジネスインテリジェンス',
  description: '自律型AIエージェントによる新事業創出支援システム',
  keywords: 'AI, ビジネス, ダッシュボード, 分析, レポート',
  authors: [{ name: 'AI Innovation Team' }],
  openGraph: {
    title: 'AI Business Dashboard',
    description: '次世代ビジネスインテリジェンスプラットフォーム',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#8b5cf6" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={inter.variable}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}