import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./globals.css";
import { DialogHost } from "@/components/ui/Dialogs";

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Absolute base for Open Graph image/URLs in shared-link previews
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://hsl.hikmahinstitute.org.pk"),
  title: "Hikmah Student Life - HSL",
  description: "Official Sports & Activity Platform for Hikmah Institute",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body
        className={`${jakartaSans.variable} ${geistMono.variable} font-sans antialiased bg-[#0b0f19] text-slate-100 min-h-screen`}
      >
        {children}
        <ToastContainer position="top-right" autoClose={4000} theme="dark" />
        <DialogHost />
      </body>
    </html>
  );
}


