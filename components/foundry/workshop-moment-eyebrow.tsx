"use client";

import { useEffect, useState } from "react";
import { copy } from "@/lib/copy";
import { getWorkshopMoment, getWorkshopMomentCopy, type WorkshopMoment } from "@/lib/workshop-moment";

type WorkshopMomentEyebrowProps = {
  className?: string;
  fallback?: string;
};

export function WorkshopMomentEyebrow({
  className = "eyebrow",
  fallback = copy.hero.eyebrow
}: WorkshopMomentEyebrowProps) {
  const [label, setLabel] = useState(fallback);

  useEffect(() => {
    const moment: WorkshopMoment = getWorkshopMoment();
    setLabel(getWorkshopMomentCopy(moment).heroEyebrow);
    document.documentElement.dataset.workshopMoment = moment;
  }, []);

  return <p className={className}>{label}</p>;
}
