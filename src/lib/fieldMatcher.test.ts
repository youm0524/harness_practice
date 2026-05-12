import { describe, expect, it } from "vitest";
import type { FieldCandidate } from "../types/autofill";
import { createEmptyProfile } from "./storage";
import { buildAutofillPlan, normalizeFieldText } from "./fieldMatcher";

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
    ...overrides,
  };
}

describe("fieldMatcher", () => {
  it("normalizes text for matching", () => {
    expect(normalizeFieldText("User_Email (필수)")).toBe("user email 필수");
  });

  it("matches Korean and English aliases", () => {
    const profile = createEmptyProfile();
    profile.personal.name = "홍길동";
    profile.personal.email = "hong@example.com";
    profile.personal.phone = "010-1234-5678";

    const plan = buildAutofillPlan(
      [
        candidate({ key: "name", label: "성명" }),
        candidate({ key: "email", name: "email" }),
        candidate({ key: "phone", placeholder: "Mobile phone" }),
      ],
      profile,
    );

    expect(
      plan.matches.map((match) => [match.candidateKey, match.value]),
    ).toEqual([
      ["name", "홍길동"],
      ["email", "hong@example.com"],
      ["phone", "010-1234-5678"],
    ]);
  });

  it("does not include low confidence fields or empty profile values", () => {
    const profile = createEmptyProfile();
    profile.personal.name = "홍길동";

    const plan = buildAutofillPlan(
      [
        candidate({ key: "unknown", label: "희망 직무" }),
        candidate({ key: "email", label: "이메일" }),
      ],
      profile,
    );

    expect(plan.matches).toEqual([]);
  });

  it("uses more specific project aliases before generic name aliases", () => {
    const profile = createEmptyProfile();
    profile.personal.name = "홍길동";
    profile.extracurricularProjects.push({
      title: "채용 자동화 도구",
      organization: "",
      startDate: "",
      endDate: "",
      role: "",
      description: "",
      techStack: "",
    });

    const plan = buildAutofillPlan(
      [candidate({ key: "project", label: "Project title" })],
      profile,
    );

    expect(plan.matches[0]).toMatchObject({
      candidateKey: "project",
      profileField: "extracurricularProjects.0.title",
      value: "채용 자동화 도구",
    });
  });

  it("formats phone values for split fields", () => {
    const profile = createEmptyProfile();
    profile.personal.phone = "010-1234-5678";

    const plan = buildAutofillPlan(
      [
        candidate({ key: "phone1", label: "휴대폰 앞자리", maxLength: 3 }),
        candidate({ key: "phone2", label: "휴대폰 중간자리", maxLength: 4 }),
        candidate({ key: "phone3", label: "휴대폰 끝자리", maxLength: 4 }),
      ],
      profile,
    );

    expect(
      plan.matches.map((match) => [match.candidateKey, match.value]),
    ).toEqual([
      ["phone1", "010"],
      ["phone2", "1234"],
      ["phone3", "5678"],
    ]);
  });

  it("formats date values for native and split fields", () => {
    const profile = createEmptyProfile();
    profile.personal.birthDate = "1999.04.05";

    const plan = buildAutofillPlan(
      [
        candidate({ key: "date", label: "생년월일", type: "date" }),
        candidate({ key: "year", label: "생년", maxLength: 4 }),
        candidate({ key: "month", label: "생월", maxLength: 2 }),
        candidate({ key: "day", label: "생일", maxLength: 2 }),
      ],
      profile,
    );

    expect(
      plan.matches.map((match) => [match.candidateKey, match.value]),
    ).toEqual([
      ["date", "1999-04-05"],
      ["year", "1999"],
      ["month", "04"],
      ["day", "05"],
    ]);
  });

  it("does not put project details into work experience fields", () => {
    const profile = createEmptyProfile();
    profile.extracurricularProjects.push({
      title: "교내 해커톤",
      organization: "",
      startDate: "",
      endDate: "",
      role: "",
      description: "서비스 기획 및 개발",
      techStack: "",
    });

    const plan = buildAutofillPlan(
      [candidate({ key: "career", label: "직장경력 내용" })],
      profile,
    );

    expect(plan.matches).toEqual([]);
  });

  it("uses section context to map generic textarea labels to the right experience domain", () => {
    const profile = createEmptyProfile();
    profile.extracurricularProjects.push({
      title: "교내 해커톤",
      organization: "",
      startDate: "",
      endDate: "",
      role: "프론트엔드",
      description: "지원서 자동화 서비스를 구현했습니다.",
      techStack: "React",
    });
    profile.workExperiences.push({
      company: "테크컴퍼니",
      position: "인턴",
      startDate: "",
      endDate: "",
      description: "운영 도구를 개선했습니다.",
    });
    profile.awards.push({
      name: "캡스톤 우수상",
      awardDate: "",
      issuer: "한국대학교",
      description: "졸업작품 우수상",
    });

    const plan = buildAutofillPlan(
      [
        candidate({
          key: "activity-desc",
          tagName: "textarea",
          type: "textarea",
          label: "내용",
          sectionText: "대내외활동 프로젝트 경험",
        }),
        candidate({
          key: "work-desc",
          tagName: "textarea",
          type: "textarea",
          label: "내용",
          sectionText: "경력사항 근무경험",
        }),
        candidate({
          key: "award-desc",
          tagName: "textarea",
          type: "textarea",
          label: "내용",
          sectionText: "수상 및 상훈",
        }),
      ],
      profile,
    );

    expect(
      plan.matches.map((match) => [
        match.candidateKey,
        match.profileField,
        match.value,
      ]),
    ).toEqual([
      [
        "activity-desc",
        "extracurricularProjects.0.description",
        "지원서 자동화 서비스를 구현했습니다.",
      ],
      [
        "work-desc",
        "workExperiences.0.description",
        "운영 도구를 개선했습니다.",
      ],
      ["award-desc", "awards.0.description", "졸업작품 우수상"],
    ]);
  });

  it("treats related activity wording as the extracurricular project domain", () => {
    const profile = createEmptyProfile();
    profile.extracurricularProjects.push({
      title: "오픈소스 기여",
      organization: "",
      startDate: "",
      endDate: "",
      role: "",
      description: "",
      techStack: "",
    });

    const plan = buildAutofillPlan(
      [
        candidate({
          key: "activity-title",
          label: "활동명",
          sectionText: "교내외 활동경험",
        }),
      ],
      profile,
    );

    expect(plan.matches[0]).toMatchObject({
      candidateKey: "activity-title",
      profileField: "extracurricularProjects.0.title",
      value: "오픈소스 기여",
    });
  });

  it("matches activity organizations and language scores", () => {
    const profile = createEmptyProfile();
    profile.extracurricularProjects.push({
      title: "금융 데이터 공모전",
      organization: "한국핀테크지원센터",
      startDate: "",
      endDate: "",
      role: "",
      description: "",
      techStack: "",
    });
    profile.languageScores.push({
      language: "영어",
      testName: "TOEIC",
      score: "910",
      acquiredDate: "2024-03",
    });

    const plan = buildAutofillPlan(
      [
        candidate({
          key: "activity-org",
          label: "활동기관",
          sectionText: "대내외활동",
        }),
        candidate({
          key: "language-test",
          label: "시험명",
          sectionText: "어학",
        }),
        candidate({
          key: "language-score",
          label: "점수",
          sectionText: "어학",
        }),
      ],
      profile,
    );

    expect(
      plan.matches.map((match) => [
        match.candidateKey,
        match.profileField,
        match.value,
      ]),
    ).toEqual([
      [
        "activity-org",
        "extracurricularProjects.0.organization",
        "한국핀테크지원센터",
      ],
      ["language-test", "languageScores.0.testName", "TOEIC"],
      ["language-score", "languageScores.0.score", "910"],
    ]);
  });

  it("skips self-introduction essay textareas even when generic description aliases appear", () => {
    const profile = createEmptyProfile();
    profile.extracurricularProjects.push({
      title: "교내 해커톤",
      organization: "",
      startDate: "",
      endDate: "",
      role: "",
      description: "프로젝트 설명",
      techStack: "",
    });

    const plan = buildAutofillPlan(
      [
        candidate({
          key: "essay",
          tagName: "textarea",
          type: "textarea",
          label: "내용",
          sectionText: "자기소개서 지원동기 성장과정",
        }),
      ],
      profile,
    );

    expect(plan.matches).toEqual([]);
  });
});
