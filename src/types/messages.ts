import type { AutofillAnalysis, AutofillPlan, AutofillResult } from "./autofill";
import type { UserProfile } from "./profile";

export type AnalyzeAutofillRequest = {
  type: "ANALYZE_AUTOFILL";
  profile: UserProfile;
};

export type AnalyzeAutofillResponse = {
  ok: boolean;
  analysis?: AutofillAnalysis;
  error?: string;
};

export type RunAutofillRequest = {
  type: "RUN_AUTOFILL";
  profile: UserProfile;
};

export type ApplyAutofillRequest = {
  type: "APPLY_AUTOFILL";
  plan: AutofillPlan;
  candidatesCount: number;
};

export type RunAutofillResponse = {
  ok: boolean;
  result?: AutofillResult;
  error?: string;
};

export type ExtensionMessage = AnalyzeAutofillRequest | RunAutofillRequest | ApplyAutofillRequest;
export type ExtensionResponse = AnalyzeAutofillResponse | RunAutofillResponse;
