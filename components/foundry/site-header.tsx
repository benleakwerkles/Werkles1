import Link from "next/link";
import { BrandMark } from "@/components/foundry/brand-mark";
import { NavIcon } from "@/components/foundry/site-icon";
import { copy } from "@/lib/copy";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="brand brand--tight" href="/" aria-label="Werkles home">
        <BrandMark size="header" presentation="board" />
        <span className="brand-word brand-word--workshop-serif">erkles</span>
      </Link>
      <nav aria-label="Primary navigation">
        <Link href="/#people"><NavIcon icon="nav-people" />People</Link>
        <Link href="/#how"><NavIcon icon="nav-how" />How</Link>
        <Link href="/proof"><NavIcon icon="nav-proof" />Proof</Link>
        <Link href="/membership"><NavIcon icon="nav-dues" />Dues</Link>
        <Link href="/login">Login</Link>
        <Link href="/#beta">Beta</Link>
      </nav>
      <Link className="header-cta" href="/signup">{copy.hero.primaryCta}</Link>
    </header>
  );
}
