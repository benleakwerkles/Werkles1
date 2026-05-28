import { copy } from "@/lib/copy";

export function DraftReviewBadge() {
  return (
    <p className="draft-review-badge" role="note">
      {copy.uiPass.draftBadge}
    </p>
  );
}
