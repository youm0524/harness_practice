import { buildAutofillPlan } from "../lib/fieldMatcher";
import type { SiteAdapter } from "./types";

export const defaultAdapter: SiteAdapter = {
  id: "default",
  name: "기본 매칭",
  supportLevel: "basic",
  matches: () => true,
  buildPlan: buildAutofillPlan
};
