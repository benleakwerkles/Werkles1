import Link from "next/link";
import { NavIcon } from "@/components/foundry/site-icon";
import { copy } from "@/lib/copy";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="Werkles home">
        <img className="brand-wordmark" src="/assets/werkles-word-only.png" alt={copy.brand} />
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
