import type { Metadata, Viewport } from "next";
import "./globals.css";

import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { ToastProvider } from "@/components/ui/Toast";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "CheckNow! — Pide desde tu mesa",
  description: "Escanea, pide y paga desde tu celular. La experiencia de restaurante reinventada.",
  keywords: ["restaurante", "QR", "pedidos", "Venezuela", "menú digital"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0F0F13",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-[Inter] antialiased">
        <ToastProvider>
          <ErrorBoundary>
            <Suspense
              fallback={
                <div className="h-[100dvh] flex items-center justify-center bg-background-dark">
                  <LoadingSpinner />
                </div>
              }
            >
              {children}
            </Suspense>
          </ErrorBoundary>
        </ToastProvider>
      </body>
    </html>
  );
}
