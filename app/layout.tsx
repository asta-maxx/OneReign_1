import type { Metadata } from "next";
import "./globals.css";
import { Inter, Bebas_Neue } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const bebas = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-display" });

import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "TransitOps | Fleet Management",
  description: "Smart Transport Operations Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans tracking-tight", inter.variable, bebas.variable)} suppressHydrationWarning>
      <body className="antialiased flex min-h-screen bg-canvas text-ink">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
