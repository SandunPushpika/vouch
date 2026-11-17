import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { brand } from "@/constants/brand";
import "./globals.css";
export const metadata: Metadata = {
  metadataBase: new URL(brand.url),
  title: {
    default: "vouchs — Good work. Beautifully billed.",
    template: "%s | vouchs",
  },
  description: brand.description,
  openGraph: {
    title: "vouchs — Free Invoice & Quotation Generator",
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
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
