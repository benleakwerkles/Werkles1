import { CockpitShell } from "@/components/foundry/cockpit-shell";
import { DenPreviewScene } from "@/components/foundry/den-preview-scene";
import { DenShell } from "@/components/foundry/den-shell";
import { denAtmosphere } from "@/lib/den-atmosphere";

export default function DenProofPage() {
  return (
    <CockpitShell>
      <main className={`proof-main ${denAtmosphere.routeClass}`}>
        <DenShell lampFocus={{ x: "58%", y: "42%" }}>
          <DenPreviewScene />
        </DenShell>
      </main>
    </CockpitShell>
  );
}
