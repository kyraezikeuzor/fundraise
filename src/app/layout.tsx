import type { Metadata } from "next";
import Script from "next/script";
import { GIVEBUTTER_SCRIPT_SRC } from "@/lib/givebutter";
import "./globals.css";

export const metadata: Metadata = {
  title: "Omelora Fundraise",
  description:
    "Grab your Omelora volunteer fundraiser link and share it to raise support.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Script src={GIVEBUTTER_SCRIPT_SRC} strategy="afterInteractive" />
        {children}
      </body>
    </html>
  );
}
