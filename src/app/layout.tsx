import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from '@/components/theme-provider';

export const metadata: Metadata = {
  title: 'Laddrr',
  description: 'An OS for team and individual accountability.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><g transform='rotate(15 50 50)'><rect x='25' y='10' width='8' height='80' fill='%23D6A01D' rx='2' ry='2'/><rect x='65' y='10' width='8' height='80' fill='%23D6A01D' rx='2' ry='2'/><rect x='29' y='25' width='40' height='7' fill='%23D6A01D' rx='1' ry='1'/><rect x='29' y='45' width='40' height='7' fill='%23D6A01D' rx='1' ry='1'/><rect x='29' y='65' width='40' height='7' fill='%23D6A01D' rx='1' ry='1'/></g><rect x='60' y='80' width='35' height='7' fill='%23D6A01D' rx='1' ry='1'/><rect x='60' y='90' width='35' height='7' fill='%23D6A01D' rx='1' ry='1'/></svg>" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
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
