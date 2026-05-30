import { BrandMark } from "@/components/foundry/brand-mark";

const fontOptions = [
  {
    id: "a",
    label: "A — Forge Sans",
    note: "Heavy UI sans. Live header default.",
    wordClass: "brand-word brand-word--forge-sans"
  },
  {
    id: "b",
    label: "B — Workshop Serif",
    note: "Warm foundry voice. Pairs with brass/copper panels.",
    wordClass: "brand-word brand-word--workshop-serif"
  },
  {
    id: "c",
    label: "C — Fraunces",
    note: "Industrial optimism with a craft edge.",
    wordClass: "brand-word brand-word--fraunces"
  },
  {
    id: "d",
    label: "D — Condensed Grotesk",
    note: "Tight, modern lockup. Reads fast at small sizes.",
    wordClass: "brand-word brand-word--condensed-grotesk"
  }
] as const;

const markOptions = [
  {
    id: "board",
    label: "Full board (PNG)",
    note: "Ben original W — full app icon board.",
    presentation: "board" as const
  },
  {
    id: "soft",
    label: "Soft crop (PNG)",
    note: "Gentle zoom — keeps more W, less frame clip.",
    presentation: "soft" as const
  },
  {
    id: "blend",
    label: "Blend knockdown (PNG)",
    note: "Soft crop + lighten blend to drop dark board edge on cream header.",
    presentation: "blend" as const
  }
] as const;

function LockupPreview({
  markPresentation,
  wordClass,
  compact = false
}: {
  markPresentation: "board" | "soft" | "blend";
  wordClass: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`header-mark-lockup header-mark-lockup--on-header${
        compact ? " header-mark-lockup--compact" : ""
      }`}
    >
      <BrandMark size="header" presentation={markPresentation} />
      <span className={wordClass}>erkles</span>
    </div>
  );
}

export function HeaderMarkReview() {
  return (
    <section id="header-mark" className="header-mark-review" aria-labelledby="headerMarkTitle">
      <div className="header-mark-review__intro">
        <p className="eyebrow">Header mark pass v2</p>
        <h2 id="headerMarkTitle">Pick a lockup direction</h2>
        <p>
          Live header locked to <strong>Option B — Workshop Serif</strong> + soft crop W (blend
          removed — it was washing out <strong>erkles</strong> on the cream header).
        </p>
      </div>

      <div className="header-mark-review__grid">
        {fontOptions.map((option) => (
          <article key={option.id} className="header-mark-review__card">
            <header>
              <strong>{option.label}</strong>
              <span>{option.note}</span>
            </header>
            <LockupPreview markPresentation="blend" wordClass={option.wordClass} />
          </article>
        ))}
      </div>

      <div className="header-mark-review__marks">
        <h3>Mark treatment (same font — Option A)</h3>
        <div className="header-mark-review__mark-row">
          {markOptions.map((option) => (
            <article key={option.id} className="header-mark-review__mark-card">
              <header>
                <strong>{option.label}</strong>
                <span>{option.note}</span>
              </header>
              <LockupPreview
                markPresentation={option.presentation}
                wordClass="brand-word brand-word--forge-sans"
                compact
              />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
