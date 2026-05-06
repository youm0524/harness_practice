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
  disabled: boolean;
  readonly: boolean;
  hidden: boolean;
};

export type FieldMatch = {
  candidateKey: string;
  profileField: string;
  label: string;
  confidence: number;
};

export type AutofillPlan = {
  matches: FieldMatch[];
};

export type AutofillResult = {
  status: AutofillStatus;
  filledCount: number;
  skippedCount: number;
  failedCount: number;
  matches: Array<Pick<FieldMatch, "candidateKey" | "profileField" | "label">>;
  message: string;
};
