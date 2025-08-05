import type { Metadata } from "next";
import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FStars",
  description: "Plan your semester in less than 5 minutes.",
  applicationName: "FStars",
  authors: [{ name: "Acrylic125", url: "https://github.com/Acrylic125" }],
  keywords: ["fstars", "ntu", "stars", "timetable", "planner"],
  twitter: {
    title: "FStars",
    description: "Plan your semester in less than 5 minutes.",
    card: "summary_large_image",
    site: "@fstars",
    creator: "@acrylic125",
    images: "/thumbnail.png",
  },
  openGraph: {
    title: "FStars",
    description: "Plan your semester in less than 5 minutes.",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/thumbnail.png",
        width: 400,
        height: 300,
        alt: "FStars Thumbnail",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* <head>
        <script
          crossOrigin="anonymous"
          src="//unpkg.com/react-scan/dist/auto.global.js"
        />
      </head> */}
      <head>
        <script
          defer
          src="https://cloud.umami.is/script.js"
          data-website-id="960f5a89-4c32-4ca4-92eb-0d821d2e9677"
        ></script>
      </head>
      <Providers className={cn(geistSans.variable, geistMono.variable)}>
        {children}
      </Providers>
    </html>
  );
}
