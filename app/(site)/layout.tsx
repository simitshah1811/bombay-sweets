import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { CartProvider } from "@/lib/cart/CartContext";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Preloader } from "@/components/Preloader";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Preloader />
      <CartProvider>
        <MotionProvider>
          <SiteHeader />
          <div className="flex-1">{children}</div>
          <SiteFooter />
          <CartDrawer />
        </MotionProvider>
      </CartProvider>
    </>
  );
}
