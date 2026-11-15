import type { Metadata } from "next";
import { brand } from "@/constants/brand";
import "./globals.css";
export const metadata: Metadata = {
  metadataBase: new URL(brand.url),
  title: {
    default: "Vouch — Good work. Beautifully billed.",
    template: "%s | Vouch",
  },
  description: brand.description,
  openGraph: {
    title: "Vouch — Free Invoice & Quotation Generator",
    description: brand.description,
    type: "website",
  },
  robots: { index: true, follow: true },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
