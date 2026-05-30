"use client";

import { useEffect, useMemo, useState } from "react";
import { copy } from "@/lib/copy";
import { getWorkshopMomentCopy } from "@/lib/workshop-moment";

const railPhrases = [
  copy.hero.trustLine,
  copy.trust.headline,
  copy.hero.brandPromise,
  "Proof signals. Private knocks.",
  "Built on Trust.",
  "Inspect the deck before the knock."
];

export function WorkshopTrustRail() {
  const [momentLine, setMomentLine] = useState(copy.trust.headline);

  useEffect(() => {
    setMomentLine(getWorkshopMomentCopy().trustRail);
  }, []);

  const track = useMemo(
    () => [...railPhrases, momentLine, ...railPhrases, momentLine],
    [momentLine]
  );

  return (
    <div className="workshop-trust-rail" aria-hidden="true">
      <div className="workshop-trust-rail__track">
        {track.map((phrase, index) => (
          <span key={`${phrase}-${index}`}>{phrase}</span>
        ))}
      </div>
    </div>
  );
}
