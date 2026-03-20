import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CheckNow",
  description: "CheckNow Restaurant Experience",
};

import { OrderProvider } from "@/context/OrderContext";
import { ConfigProvider } from "@/context/ConfigContext";
import { SessionProvider } from "@/context/SessionContext";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ToastProvider } from "@/components/ui/Toast";
import { Suspense } from "react";

/**
 * AI Context: The root layout of the Next.js App Router.
 * This file wraps every page in the application with necessary React Contexts (Providers)
 * such as `ConfigProvider`, `ToastProvider`, and `OrderProvider`.
 * Note: `html` has `suppressHydrationWarning` due to Next.js strict hydration checks.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ConfigProvider>
          <ToastProvider>
            <SessionProvider>
              <OrderProvider>
                <ErrorBoundary>
                  <Suspense fallback={<div className="h-[100dvh] flex items-center justify-center"><LoadingSpinner /></div>}>
                    {children}
                  </Suspense>
                </ErrorBoundary>
              </OrderProvider>
            </SessionProvider>
          </ToastProvider>
        </ConfigProvider>
      </body>
    </html>
  );
}


