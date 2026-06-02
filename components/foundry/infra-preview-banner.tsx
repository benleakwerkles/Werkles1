import { copy } from "@/lib/copy";
import { isAppInfraPreview } from "@/lib/app-infra-preview";

type InfraPreviewBannerProps = {
  detail: string;
};

export function InfraPreviewBanner({ detail }: InfraPreviewBannerProps) {
  if (!isAppInfraPreview()) return null;

  return (
    <p className="trust-badge infra-preview-banner" role="status">
      {copy.infraPreview.banner} — {detail}
    </p>
  );
}
