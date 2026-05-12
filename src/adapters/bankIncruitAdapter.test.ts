import { describe, expect, it } from "vitest";
import { getSiteAdapter } from ".";
import type { FieldCandidate } from "../types/autofill";
import { createEmptyProfile } from "../lib/storage";

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

describe("bankIncruitAdapter", () => {
  it("recognizes common bank recruiting sites that use Incruit-style pages", () => {
    expect(getSiteAdapter("https://recruit.incruit.com/kbstar/signin").id).toBe("bank-incruit");
    expect(getSiteAdapter("https://recruit.incruit.com/wooribank/job/").id).toBe("bank-incruit");
    expect(getSiteAdapter("https://recruit.incruit.com/shinhanhr/jobcont/2021101501").id).toBe("bank-incruit");
    expect(getSiteAdapter("https://hanabank.incruit.com/hire/hirelist.asp").id).toBe("bank-incruit");
    expect(getSiteAdapter("https://ibk.incruit.com/hire/hirelist.asp").id).toBe("bank-incruit");
    expect(getSiteAdapter("https://www.ibk-recruit.com/").id).toBe("bank-incruit");
  });

  it("falls back to default matching on unsupported sites", () => {
    expect(getSiteAdapter("https://example.com/apply").id).toBe("default");
    expect(getSiteAdapter("not a url").id).toBe("default");
  });

  it("maps Incruit-style personal field ids without visible labels", () => {
    const profile = createEmptyProfile();
    profile.personal.name = "홍길동";
    profile.personal.email = "hong@example.com";
    profile.personal.phone = "010-1234-5678";

    const adapter = getSiteAdapter("https://recruit.incruit.com/kbstar/apply");
    const plan = adapter.buildPlan(
      [
        candidate({ key: "name", id: "app_nm" }),
        candidate({ key: "email", name: "email_addr" }),
        candidate({ key: "phone", name: "hp_no" })
      ],
      profile
    );

    expect(plan.matches.map((match) => [match.candidateKey, match.profileField, match.value])).toEqual([
      ["name", "personal.name", "홍길동"],
      ["email", "personal.email", "hong@example.com"],
      ["phone", "personal.phone", "010-1234-5678"]
    ]);
    expect(plan.matches.every((match) => match.reviewRequired === false)).toBe(true);
  });

  it("maps Incruit-style section field names into bank resume domains", () => {
    const profile = createEmptyProfile();
    profile.workExperiences.push({
      company: "핀테크은행",
      position: "인턴",
      startDate: "2024-01",
      endDate: "2024-06",
      description: "영업점 데이터 정리를 자동화했습니다."
    });
    profile.credentials.push({
      name: "투자자산운용사",
      acquiredDate: "2023-05",
      issuer: "금융투자협회"
    });
    profile.languageScores.push({
      language: "영어",
      testName: "TOEIC",
      score: "910",
      acquiredDate: "2024-03"
    });
    profile.extracurricularProjects.push({
      title: "금융 데이터 공모전",
      organization: "한국핀테크지원센터",
      startDate: "",
      endDate: "",
      role: "",
      description: "",
      techStack: ""
    });
    profile.awards.push({
      name: "금융 아이디어 공모전 우수상",
      awardDate: "2022-11",
      issuer: "한국은행",
      description: "디지털 금융 서비스 제안"
    });

    const adapter = getSiteAdapter("https://hanabank.incruit.com/apply");
    const plan = adapter.buildPlan(
      [
        candidate({ key: "career-company", name: "career_company_nm" }),
        candidate({ key: "career-desc", tagName: "textarea", type: "textarea", name: "career_content" }),
        candidate({ key: "license-name", name: "license_nm" }),
        candidate({ key: "language-score", name: "lang_score" }),
        candidate({ key: "activity-org", name: "activity_org_nm" }),
        candidate({ key: "award-name", name: "award_nm" }),
        candidate({ key: "award-desc", tagName: "textarea", type: "textarea", name: "award_desc" })
      ],
      profile
    );

    expect(plan.matches.map((match) => [match.candidateKey, match.profileField, match.value])).toEqual([
      ["career-company", "workExperiences.0.company", "핀테크은행"],
      ["career-desc", "workExperiences.0.description", "영업점 데이터 정리를 자동화했습니다."],
      ["license-name", "credentials.0.name", "투자자산운용사"],
      ["language-score", "languageScores.0.score", "910"],
      ["activity-org", "extracurricularProjects.0.organization", "한국핀테크지원센터"],
      ["award-name", "awards.0.name", "금융 아이디어 공모전 우수상"],
      ["award-desc", "awards.0.description", "디지털 금융 서비스 제안"]
    ]);
  });
});
