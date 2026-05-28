"use client";

import { useMemo, useState } from "react";
import {
  draftAssetInventory,
  ghostForgeDraftFolder,
  type DraftAssetRecord
} from "@/lib/draft-asset-inventory";
import { iconDropFolder, siteIcons } from "@/lib/site-icons";

function DraftAssetTile({ asset }: { asset: DraftAssetRecord }) {
  const [missing, setMissing] = useState(false);

  return (
    <figure className="draft-asset-tile">
      <div className="draft-asset-tile__frame">
        {!missing ? (
          <img
            src={asset.publicPath}
            alt=""
            loading="lazy"
            onError={() => setMissing(true)}
          />
        ) : (
          <div className="draft-asset-tile__missing" aria-hidden="true">
            <span>Not in repo</span>
            <code>{asset.filename}</code>
          </div>
        )}
      </div>
      <figcaption>
        <strong>{asset.filename}</strong>
        <span className={`draft-asset-tile__status draft-asset-tile__status--${asset.status}`}>
          {asset.status}
        </span>
        {asset.route ? <span className="draft-asset-tile__route">{asset.route}</span> : null}
      </figcaption>
    </figure>
  );
}

export function DraftAssetGallery() {
  const iconAssets = useMemo(
    () =>
      Object.values(siteIcons).map((icon) => ({
        id: icon.id,
        filename: icon.filename,
        publicPath: icon.publicPath,
        status: "planned" as const,
        source: "ghost-forge" as const,
        route: "site icon"
      })),
    []
  );

  const atmosphereAssets = useMemo(
    () => draftAssetInventory.filter((item) => item.source === "ghost-forge"),
    []
  );

  return (
    <section id="forge-preview" className="draft-asset-gallery" aria-labelledby="forgePreviewTitle">
      <div className="draft-asset-gallery__header">
        <p className="eyebrow">Ghost Forge draft review</p>
        <h2 id="forgePreviewTitle">Site icons + atmosphere</h2>
        <p className="draft-asset-gallery__path">
          Icons: <code>{iconDropFolder}</code> · Atmosphere: <code>{ghostForgeDraftFolder}</code>
        </p>
      </div>
      <h3 className="draft-asset-gallery__subhead">Micro icons (Tier 3)</h3>
      <div className="draft-asset-gallery__grid">
        {iconAssets.map((asset) => (
          <DraftAssetTile key={asset.id} asset={asset} />
        ))}
      </div>
      <h3 className="draft-asset-gallery__subhead">Atmosphere plates</h3>
      <div className="draft-asset-gallery__grid">
        {atmosphereAssets.map((asset) => (
          <DraftAssetTile key={asset.id} asset={asset} />
        ))}
      </div>
    </section>
  );
}
