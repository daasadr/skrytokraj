import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { auth } from "@/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Skrytokraj",
    template: "%s · Skrytokraj",
  },
  description:
    "Hra na pomezí krajiny a příběhu — hledej skuliny, plň úkoly a piš kroniku skrytého kraje kolem Petřvaldu na Novojičínsku.",
  applicationName: "Skrytokraj",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Skrytokraj",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f1512",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html
      lang="cs"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">
        <SiteHeader
          user={
            session?.user
              ? {
                  name: session.user.name ?? session.user.email ?? "Kronikář",
                  role: session.user.role,
                }
              : null
          }
        />
        <main className="flex-1 flex flex-col">{children}</main>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
