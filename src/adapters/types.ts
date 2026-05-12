import type { AutofillPlan, FieldCandidate } from "../types/autofill";
import type { UserProfile } from "../types/profile";

export type SiteSupportLevel = "high" | "basic";

export interface SiteAdapter {
  id: string;
  name: string;
  supportLevel: SiteSupportLevel;
  matches(url: URL): boolean;
  buildPlan(candidates: FieldCandidate[], profile: UserProfile): AutofillPlan;
}
