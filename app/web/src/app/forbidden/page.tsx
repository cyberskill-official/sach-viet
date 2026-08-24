import { ForbiddenPanel } from "./forbidden-panel";
import { LuxuryAuthFrame } from "@/components/luxury-shell";

export default function ForbiddenPage() {
  return (
    <LuxuryAuthFrame>
      <ForbiddenPanel />
    </LuxuryAuthFrame>
  );
}
