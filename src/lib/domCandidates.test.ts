import { describe, expect, it } from "vitest";
import type { FieldCandidate, FieldMatch } from "../types/autofill";
import { createAutofillResult, isFillableCandidate } from "./domCandidates";

function candidate(overrides: Partial<FieldCandidate>): FieldCandidate {
  return {
    key: "field-1",
    tagName: "input",
    type: "text",
    id: "",
    name: "",
    label: "",
    placeholder: "",
    ariaLabel: "",
    nearbyText: "",
    sectionText: "",
    autocomplete: "",
    inputMode: "",
    maxLength: -1,
    disabled: false,
    readonly: false,
    hidden: false,
    ...overrides
  };
}

function match(overrides: Partial<FieldMatch>): FieldMatch {
  return {
    candidateKey: "field-1",
    profileField: "personal.name",
    label: "성명",
    confidence: 1,
    reviewRequired: false,
    value: "홍길동",
    ...overrides
  };
}

describe("domCandidates helpers", () => {
  it("skips blocked or unavailable fields", () => {
    expect(isFillableCandidate(candidate({ type: "text" }))).toBe(true);
    expect(isFillableCandidate(candidate({ type: "password" }))).toBe(false);
    expect(isFillableCandidate(candidate({ type: "file" }))).toBe(false);
    expect(isFillableCandidate(candidate({ readonly: true }))).toBe(false);
    expect(isFillableCandidate(candidate({ disabled: true }))).toBe(false);
    expect(isFillableCandidate(candidate({ hidden: true }))).toBe(false);
  });

  it("creates success, partial and no-match results", () => {
    expect(
      createAutofillResult(
        [candidate({ key: "name" })],
        { matches: [match({ candidateKey: "name" })] },
        [match({ candidateKey: "name" })],
        []
      ).status
    ).toBe("success");

    expect(
      createAutofillResult(
        [candidate({ key: "name" }), candidate({ key: "email" })],
        { matches: [match({ candidateKey: "name" })] },
        [match({ candidateKey: "name" })],
        []
      ).status
    ).toBe("partial");

    expect(createAutofillResult([candidate({})], { matches: [] }, [], []).status).toBe(
      "no-match"
    );
  });
});
