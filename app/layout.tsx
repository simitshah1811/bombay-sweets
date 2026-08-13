import type { Metadata } from "next";
import { fraunces, lora, inter } from "@/lib/fonts";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { CartProvider } from "@/lib/cart/CartContext";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Preloader } from "@/components/Preloader";
import { business } from "@/data/business";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const TITLE = "Bombay Sweets — Port Coquitlam";
const DESCRIPTION =
  "Indian sweets, chaat, tandoori and North Indian specialties in Port Coquitlam, BC. Real recipes, made fresh daily.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: "%s · Bombay Sweets" },
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    siteName: business.name,
    locale: "en_CA",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${fraunces.variable} ${lora.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-ink">
        <Preloader />
        <CartProvider>
          <MotionProvider>
            <SiteHeader />
            <div className="flex-1">{children}</div>
            <SiteFooter />
            <CartDrawer />
          </MotionProvider>
        </CartProvider>
      </body>
    </html>
  );
}
