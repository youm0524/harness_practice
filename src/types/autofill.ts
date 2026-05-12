export type AutofillStatus = "success" | "partial" | "no-match" | "error";

export type FieldCandidate = {
  key: string;
  tagName: string;
  type: string;
  id: string;
  name: string;
  label: string;
  placeholder: string;
  ariaLabel: string;
  nearbyText: string;
  sectionText: string;
  autocomplete: string;
  inputMode: string;
  maxLength: number;
  disabled: boolean;
  readonly: boolean;
  hidden: boolean;
};

export type FieldMatch = {
  candidateKey: string;
  profileField: string;
  label: string;
  confidence: number;
  reviewRequired: boolean;
  value: string;
};

export type AutofillPlan = {
  matches: FieldMatch[];
};

export type AutofillAnalysis = {
  candidatesCount: number;
  adapterName: string;
  supportLevel: "high" | "basic";
  plan: AutofillPlan;
};

export type AutofillResult = {
  status: AutofillStatus;
  filledCount: number;
  skippedCount: number;
  failedCount: number;
  matches: Array<Pick<FieldMatch, "candidateKey" | "profileField" | "label">>;
  message: string;
};
