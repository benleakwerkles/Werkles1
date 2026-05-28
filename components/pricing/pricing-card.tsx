import Link from "next/link";
import type { ReactNode } from "react";

type PricingCardProps = {
  kicker: string;
  title: string;
  price: string;
  body: string;
  cta?: {
    label: string;
    href: string;
  };
  featured?: boolean;
  children?: ReactNode;
};

export function PricingCard({
  kicker,
  title,
  price,
  body,
  cta,
  featured = false,
  children
}: PricingCardProps) {
  return (
    <article className={`ops-card pricing-card${featured ? " pricing-card-featured" : ""}`}>
      <div>
        <p className="plan-kicker">{kicker}</p>
        <h2>{title}</h2>
        <p className="pricing-price">{price}</p>
        <p>{body}</p>
      </div>
      {children}
      {cta ? (
        <Link className={featured ? "button button-light" : "button button-outline"} href={cta.href}>
          {cta.label}
        </Link>
      ) : null}
    </article>
  );
}
