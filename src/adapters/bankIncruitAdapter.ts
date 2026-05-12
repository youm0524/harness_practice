import { buildAutofillPlan, normalizeFieldText } from "../lib/fieldMatcher";
import type { AutofillPlan, FieldCandidate } from "../types/autofill";
import type { UserProfile } from "../types/profile";
import type { SiteAdapter } from "./types";

const BANK_INCRUIT_HOSTS = [
  "recruit.incruit.com",
  "hanabank.incruit.com",
  "ibk.incruit.com",
  "www.ibk-recruit.com",
  "ibk-recruit.com"
];
const BANK_INCRUIT_PATHS = ["kbstar", "wooribank", "shinhanhr"];

type HintRule = {
  pattern: RegExp;
  label?: string;
  sectionText?: string;
};

const HINT_RULES: HintRule[] = [
  { pattern: /(user|app|appl|applicant|kor|han|mber|mem)?_?(nm|name)$|^(nm|name)$/, label: "성명" },
  { pattern: /(birth|brth|birthday|dob|생년)/, label: "생년월일" },
  { pattern: /(email|e_mail|mail)/, label: "이메일" },
  { pattern: /(hp|hand|mobile|cell|phone|tel)/, label: "휴대폰 전화번호" },
  { pattern: /(addr|address)/, label: "주소" },

  { pattern: /(school|schl|univ|college|edu|acdm|학력)/, sectionText: "학력" },
  { pattern: /(school|schl|univ|college).*?(nm|name)|학교/, label: "학교명", sectionText: "학력" },
  { pattern: /(major|전공)/, label: "전공", sectionText: "학력" },
  { pattern: /(degree|학위)/, label: "학위", sectionText: "학력" },
  { pattern: /(gpa|grade|score|학점|평점)/, label: "학점", sectionText: "학력" },
  { pattern: /(admission|entrance|enter|start).*?(dt|date|ym)|입학/, label: "입학일", sectionText: "학력" },
  { pattern: /(gradu|finish|end).*?(dt|date|ym)|졸업/, label: "졸업일", sectionText: "학력" },

  { pattern: /(cert|certificate|license|licen|quali|qual|자격|면허)/, sectionText: "자격사항" },
  { pattern: /(cert|certificate|license|licen|quali|qual).*?(nm|name)|자격증명|자격명/, label: "자격증명", sectionText: "자격사항" },
  { pattern: /(issuer|org|organ|agency|institute|pub|issue).*?(nm|name)?|발급|시행/, label: "발급처", sectionText: "자격사항" },
  { pattern: /(acq|acquire|issue).*?(dt|date|ym)|취득/, label: "취득일", sectionText: "자격사항" },

  { pattern: /(lang|language|foreign|toeic|toefl|opic|teps|어학|외국어|토익|토플|오픽|텝스)/, sectionText: "어학 외국어" },
  { pattern: /(lang|language).*?(nm|name)|언어|외국어/, label: "언어", sectionText: "어학 외국어" },
  { pattern: /(test|exam|toeic|toefl|opic|teps).*?(nm|name)?|시험명|어학시험/, label: "시험명", sectionText: "어학 외국어" },
  { pattern: /(score|grade|level|point|점수|등급|성적)/, label: "점수 등급", sectionText: "어학 외국어" },
  { pattern: /(test|exam|lang|language).*?(dt|date|ym)|응시일|어학취득일/, label: "취득일", sectionText: "어학 외국어" },

  { pattern: /(act|activity|outside|extra|project|proj|prj|portfolio|대외|대내|활동|프로젝트)/, sectionText: "대내외활동 프로젝트" },
  { pattern: /(act|activity|project|proj|prj).*?(nm|name|title)|활동명|프로젝트명/, label: "활동명 프로젝트명", sectionText: "대내외활동 프로젝트" },
  { pattern: /(act|activity|project|proj|prj).*?(org|organ|agency|host|inst|corp)|활동기관|주최기관/, label: "활동기관", sectionText: "대내외활동 프로젝트" },
  { pattern: /(role|part|charge|담당|역할)/, label: "역할", sectionText: "대내외활동 프로젝트" },
  { pattern: /(tech|skill|stack|기술)/, label: "기술 스택", sectionText: "대내외활동 프로젝트" },
  { pattern: /(act|activity|project|proj|prj).*?(cont|content|desc|detail|memo|text)|활동내용|프로젝트내용/, label: "내용 설명", sectionText: "대내외활동 프로젝트" },

  { pattern: /(career|work|company|corp|employ|job|intern|경력|근무|직장|회사|인턴)/, sectionText: "직장경력" },
  { pattern: /(company|corp|employer|workplace).*?(nm|name)?|회사명|근무처/, label: "회사명", sectionText: "직장경력" },
  { pattern: /(position|duty|job|task|rank|title)|직무|직위|직책/, label: "직무 직위", sectionText: "직장경력" },
  { pattern: /(career|work|job).*?(cont|content|desc|detail|memo|text)|업무내용|경력내용/, label: "업무 내용", sectionText: "직장경력" },

  { pattern: /(award|prize|honor|reward|수상|상훈)/, sectionText: "수상" },
  { pattern: /(award|prize|honor).*?(nm|name|title)|수상명|상훈명/, label: "수상명", sectionText: "수상" },
  { pattern: /(award|prize|honor).*?(cont|content|desc|detail|memo|text)|수상내용|상훈내용/, label: "수상 내용", sectionText: "수상" },
  { pattern: /(award|prize|honor).*?(dt|date|ym)|수상일/, label: "수상일", sectionText: "수상" },

  { pattern: /(start|from|begin).*?(dt|date|ym)|시작/, label: "시작일" },
  { pattern: /(end|to|finish).*?(dt|date|ym)|종료/, label: "종료일" },
  { pattern: /(cont|content|desc|detail|memo|text|intro|body|내용|설명|상세)/, label: "내용 설명" }
];

function isBankIncruitUrl(url: URL) {
  if (!BANK_INCRUIT_HOSTS.includes(url.hostname)) {
    return false;
  }

  if (url.hostname === "recruit.incruit.com") {
    const firstPath = url.pathname.split("/").filter(Boolean)[0] ?? "";
    return BANK_INCRUIT_PATHS.includes(firstPath);
  }

  return true;
}

function appendText(left: string, right = "") {
  return [left, right].filter(Boolean).join(" ").trim();
}

function enrichCandidate(candidate: FieldCandidate): FieldCandidate {
  const rawHint = normalizeFieldText(
    [candidate.id, candidate.name, candidate.placeholder, candidate.ariaLabel].join(" ")
  );

  return HINT_RULES.reduce<FieldCandidate>((current, rule) => {
    if (!rule.pattern.test(rawHint)) {
      return current;
    }

    return {
      ...current,
      label: appendText(current.label, rule.label),
      sectionText: appendText(current.sectionText, rule.sectionText)
    };
  }, candidate);
}

function uniqueMatches(plan: AutofillPlan): AutofillPlan {
  const seen = new Set<string>();
  return {
    matches: plan.matches.filter((match) => {
      const key = `${match.candidateKey}:${match.profileField}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
  };
}

export const bankIncruitAdapter: SiteAdapter = {
  id: "bank-incruit",
  name: "은행권 Incruit 계열",
  supportLevel: "high",
  matches: isBankIncruitUrl,
  buildPlan(candidates: FieldCandidate[], profile: UserProfile): AutofillPlan {
    const enrichedCandidates = candidates.map(enrichCandidate);
    const plan = buildAutofillPlan(enrichedCandidates, profile);

    return uniqueMatches({
      matches: plan.matches.map((match) => ({
        ...match,
        reviewRequired: false
      }))
    });
  }
};
