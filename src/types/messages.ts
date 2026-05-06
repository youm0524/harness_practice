import type { AutofillResult } from "./autofill";
import type { UserProfile } from "./profile";

export type RunAutofillRequest = {
  type: "RUN_AUTOFILL";
  profile: UserProfile;
};

export type RunAutofillResponse = {
  ok: boolean;
  result?: AutofillResult;
  error?: string;
};

export type ExtensionMessage = RunAutofillRequest;
