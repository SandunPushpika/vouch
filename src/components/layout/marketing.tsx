import Link from "next/link";
import { brand } from "@/constants/brand";
import { Check } from "lucide-react";
export function PublicBrand() {
  return (
    <Link className="brand" href="/">
      <span className="brand-mark">
        <Check size={22} strokeWidth={3} />
      </span>
      {brand.name.toLowerCase()}
      <span className="brand-dot">.</span>
    </Link>
  );
}
export function PublicNav() {
  return (
    <nav className="marketing-nav">
      <PublicBrand />
      <div className="marketing-links">
        <Link href="/#features">Features</Link>
        <Link href="/#templates">Templates</Link>
        <Link href="/#faq">FAQs</Link>
        <Link className="button button-primary" href="/app">
          Open workspace <span>↗</span>
        </Link>
      </div>
    </nav>
  );
}
export function PublicFooter() {
  return (
    <footer className="marketing-footer">
      <PublicBrand />
      <div>
        <Link href="/privacy">Privacy policy</Link>
        <Link href="/terms">Terms of use</Link>
        <Link href="/contact">Contact</Link>
      </div>
      <span>
        © {new Date().getFullYear()} {brand.name}. Made for your independence.
      </span>
    </footer>
  );
}
