import { CockpitShell } from "@/components/foundry/cockpit-shell";
import { DenShell } from "@/components/foundry/den-shell";
import { GoopCycleScene } from "@/components/goop-cycle/goop-cycle-scene";
import { denAtmosphere } from "@/lib/den-atmosphere";

export default function GoopCycleProofPage() {
  return (
    <CockpitShell>
      <main className={`proof-main ${denAtmosphere.routeClass} workshop-route--goop`}>
        <DenShell lampFocus={{ x: "52%", y: "36%" }}>
          <GoopCycleScene />
        </DenShell>
      </main>
    </CockpitShell>
  );
}
