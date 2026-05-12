import type { AutofillPlan, FieldCandidate, FieldMatch } from "../types/autofill";
import type { UserProfile } from "../types/profile";

type ProfileValue = {
  field: string;
  value: string;
  aliases: string[];
  contextAliases?: string[];
  priority: number;
  transform?: (value: string, candidate: FieldCandidate, text: string) => string;
};

const MIN_CONFIDENCE = 0.68;
const REVIEW_CONFIDENCE = 0.86;
const DATE_FIELDS = new Set([
  "personal.birthDate",
  "startDate",
  "endDate",
  "acquiredDate",
  "awardDate"
]);
const ESSAY_ALIASES = [
  "자기소개",
  "자기 소개",
  "자기소개서",
  "지원동기",
  "지원 동기",
  "성장과정",
  "성장 과정",
  "입사 후 포부",
  "입사후포부",
  "성격 장단점",
  "장점 단점",
  "역량기술서",
  "essay",
  "cover letter",
  "motivation"
];
const ACTIVITY_CONTEXT_ALIASES = [
  "대내외",
  "대내외활동",
  "대외활동",
  "대내활동",
  "교내활동",
  "교외활동",
  "교내외",
  "활동경험",
  "활동 경험",
  "주요활동",
  "프로젝트",
  "project",
  "activity",
  "experience"
];
const WORK_CONTEXT_ALIASES = [
  "직장",
  "직장경력",
  "경력",
  "경력사항",
  "근무",
  "근무경험",
  "재직",
  "회사",
  "인턴",
  "career",
  "work",
  "employment",
  "company"
];
const CREDENTIAL_CONTEXT_ALIASES = ["자격", "자격사항", "자격증", "면허", "certificate", "certification", "license"];
const AWARD_CONTEXT_ALIASES = ["수상", "수상내역", "수상경력", "상훈", "award", "honor"];

function hasValue(value: string) {
  return value.trim().length > 0;
}

export function normalizeFieldText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[_\-./()[\]{}:]/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function candidateText(candidate: FieldCandidate): string {
  return normalizeFieldText(
    [
      candidate.label,
      candidate.placeholder,
      candidate.ariaLabel,
      candidate.name,
      candidate.id,
      candidate.nearbyText,
      candidate.sectionText
    ].join(" ")
  );
}

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function formatDateValue(value: string, candidate: FieldCandidate, text: string): string {
  const digits = onlyDigits(value);
  if (digits.length < 4) {
    return value;
  }

  const year = digits.slice(0, 4);
  const month = digits.slice(4, 6);
  const day = digits.slice(6, 8);
  const maxLength = candidate.maxLength > 0 ? candidate.maxLength : 0;
  const wantsYear = /\b(yyyy|year|yy)\b|연도|년도|년$|생년$/.test(text);
  const wantsMonth = /\b(mm|month)\b|월$/.test(text);
  const wantsDay = /\b(dd|day)\b|일$/.test(text);

  if (candidate.type === "month") {
    return month ? `${year}-${month}` : year;
  }

  if (candidate.type === "date") {
    return day ? `${year}-${month}-${day}` : month ? `${year}-${month}` : year;
  }

  if (wantsYear && !wantsMonth && !wantsDay) {
    return maxLength === 2 ? year.slice(2) : year;
  }

  if (wantsMonth && !wantsYear && !wantsDay) {
    return month;
  }

  if (wantsDay && !wantsYear && !wantsMonth) {
    return day;
  }

  if (maxLength === 4) {
    return year;
  }

  if (maxLength === 2) {
    if (wantsMonth) {
      return month;
    }
    if (wantsDay) {
      return day;
    }
    return year.slice(2);
  }

  if (maxLength === 6 && month) {
    return `${year}${month}`;
  }

  if (maxLength === 8 && day) {
    return `${year}${month}${day}`;
  }

  if (/[./]/.test(candidate.placeholder)) {
    return day ? `${year}.${month}.${day}` : month ? `${year}.${month}` : year;
  }

  if (candidate.placeholder.includes("-") || value.includes("-")) {
    return day ? `${year}-${month}-${day}` : month ? `${year}-${month}` : year;
  }

  return day ? `${year}${month}${day}` : month ? `${year}${month}` : year;
}

function formatPhoneValue(value: string, candidate: FieldCandidate, text: string): string {
  const digits = onlyDigits(value);
  if (digits.length < 9) {
    return value;
  }

  const first = digits.slice(0, 3);
  const middle = digits.length === 10 ? digits.slice(3, 6) : digits.slice(3, 7);
  const last = digits.slice(-4);
  const maxLength = candidate.maxLength > 0 ? candidate.maxLength : 0;
  const compactHints = [candidate.name, candidate.id, candidate.autocomplete].join(" ").toLowerCase();

  if (/앞|first|prefix|tel1|phone1|mobile1|hp1/.test(text + " " + compactHints)) {
    return first;
  }

  if (/중간|middle|tel2|phone2|mobile2|hp2/.test(text + " " + compactHints)) {
    return middle;
  }

  if (/끝|뒤|last|tel3|phone3|mobile3|hp3/.test(text + " " + compactHints)) {
    return last;
  }

  if (maxLength === 3) {
    return first;
  }

  if (maxLength === 4) {
    return last;
  }

  if (maxLength > 0 && maxLength <= digits.length) {
    return digits.slice(0, maxLength);
  }

  if (candidate.placeholder.includes("-") || value.includes("-")) {
    return `${first}-${middle}-${last}`;
  }

  return digits;
}

function fieldValue(
  field: string,
  value: string,
  aliases: string[],
  priority: number,
  options: Pick<ProfileValue, "contextAliases" | "transform"> = {}
): ProfileValue {
  return { field, value, aliases, priority, ...options };
}

function dateFieldValue(
  field: string,
  value: string,
  aliases: string[],
  priority: number,
  contextAliases?: string[]
): ProfileValue {
  return fieldValue(field, value, aliases, priority, {
    contextAliases,
    transform: formatDateValue
  });
}

function profileValues(profile: UserProfile): ProfileValue[] {
  const values: ProfileValue[] = [
    fieldValue("personal.name", profile.personal.name, ["이름", "성명", "지원자명", "name", "full name", "applicant name"], 90),
    dateFieldValue("personal.birthDate", profile.personal.birthDate, ["생년월일", "생년", "생월", "생일", "출생", "birth date", "birthday", "date of birth", "dob"], 80),
    fieldValue("personal.email", profile.personal.email, ["이메일", "메일", "email", "e mail"], 90),
    fieldValue("personal.phone", profile.personal.phone, ["전화번호", "휴대폰", "핸드폰", "연락처", "phone", "mobile", "cell", "tel"], 90, {
      transform: formatPhoneValue
    }),
    fieldValue("personal.address", profile.personal.address, ["주소", "address"], 75)
  ];

  profile.educations.forEach((education, index) => {
    const prefix = `educations.${index}`;
    values.push(
      fieldValue(`${prefix}.schoolName`, education.schoolName, ["학교명", "출신학교", "대학교명", "school name", "university name", "college name"], 70),
      fieldValue(`${prefix}.major`, education.major, ["전공", "major"], 70),
      fieldValue(`${prefix}.degree`, education.degree, ["학위", "degree"], 70),
      dateFieldValue(`${prefix}.startDate`, education.startDate, ["입학일", "입학년월", "입학", "시작일", "start date", "admission"], 60, ["학력", "학교", "education"]),
      dateFieldValue(`${prefix}.endDate`, education.endDate, ["졸업일", "졸업년월", "졸업", "종료일", "end date", "graduation"], 60, ["학력", "학교", "education"]),
      fieldValue(`${prefix}.gpa`, education.gpa, ["학점", "평점", "gpa", "grade"], 70)
    );
  });

  profile.credentials.forEach((credential, index) => {
    const prefix = `credentials.${index}`;
    values.push(
      fieldValue(`${prefix}.name`, credential.name, ["자격증명", "자격사항명", "자격명", "면허명", "certificate name", "certification name", "license name"], 70),
      dateFieldValue(`${prefix}.acquiredDate`, credential.acquiredDate, ["취득일", "취득년월", "발급일", "issued date", "acquired date"], 60, CREDENTIAL_CONTEXT_ALIASES),
      fieldValue(`${prefix}.issuer`, credential.issuer, ["발급처", "발행기관", "시행처", "기관", "issuer", "issuing organization"], 60, { contextAliases: CREDENTIAL_CONTEXT_ALIASES })
    );
  });

  profile.extracurricularProjects.forEach((project, index) => {
    const prefix = `extracurricularProjects.${index}`;
    values.push(
      fieldValue(`${prefix}.title`, project.title, ["프로젝트명", "프로젝트 제목", "활동명", "경험명", "명칭", "project title", "project name", "activity name"], 80, { contextAliases: ACTIVITY_CONTEXT_ALIASES }),
      dateFieldValue(`${prefix}.startDate`, project.startDate, ["시작일", "시작년월", "활동 시작", "기간 시작", "project start"], 60, ACTIVITY_CONTEXT_ALIASES),
      dateFieldValue(`${prefix}.endDate`, project.endDate, ["종료일", "종료년월", "활동 종료", "기간 종료", "project end"], 60, ACTIVITY_CONTEXT_ALIASES),
      fieldValue(`${prefix}.role`, project.role, ["역할", "담당 역할", "담당", "role"], 70, { contextAliases: ACTIVITY_CONTEXT_ALIASES }),
      fieldValue(`${prefix}.description`, project.description, ["프로젝트 내용", "활동 내용", "대외활동 내용", "주요 내용", "내용", "설명", "상세", "project description", "description", "details"], 65, { contextAliases: ACTIVITY_CONTEXT_ALIASES }),
      fieldValue(`${prefix}.techStack`, project.techStack, ["기술 스택", "사용 기술", "tech stack", "technologies"], 70, { contextAliases: ACTIVITY_CONTEXT_ALIASES })
    );
  });

  profile.workExperiences.forEach((experience, index) => {
    const prefix = `workExperiences.${index}`;
    values.push(
      fieldValue(`${prefix}.company`, experience.company, ["회사명", "직장명", "근무처", "회사", "기관명", "company", "employer"], 78, { contextAliases: WORK_CONTEXT_ALIASES }),
      fieldValue(`${prefix}.position`, experience.position, ["직무", "직위", "직책", "담당업무", "position", "job title"], 72, { contextAliases: WORK_CONTEXT_ALIASES }),
      dateFieldValue(`${prefix}.startDate`, experience.startDate, ["입사일", "근무 시작", "시작일", "기간 시작", "start date"], 60, WORK_CONTEXT_ALIASES),
      dateFieldValue(`${prefix}.endDate`, experience.endDate, ["퇴사일", "근무 종료", "종료일", "기간 종료", "end date"], 60, WORK_CONTEXT_ALIASES),
      fieldValue(`${prefix}.description`, experience.description, ["업무 내용", "직장경력 내용", "경력 내용", "주요 업무", "내용", "설명", "상세", "work description", "description", "details"], 66, { contextAliases: WORK_CONTEXT_ALIASES })
    );
  });

  profile.awards.forEach((award, index) => {
    const prefix = `awards.${index}`;
    values.push(
      fieldValue(`${prefix}.name`, award.name, ["수상명", "상훈명", "수상 항목", "상명", "award name"], 72, { contextAliases: AWARD_CONTEXT_ALIASES }),
      dateFieldValue(`${prefix}.awardDate`, award.awardDate, ["수상일", "수상년월", "award date"], 60, AWARD_CONTEXT_ALIASES),
      fieldValue(`${prefix}.issuer`, award.issuer, ["수여기관", "발급기관", "주최기관", "기관", "issuer", "organization"], 60, { contextAliases: AWARD_CONTEXT_ALIASES }),
      fieldValue(`${prefix}.description`, award.description, ["수상 내용", "상훈 내용", "내용", "설명", "상세", "award description", "description", "details"], 58, { contextAliases: AWARD_CONTEXT_ALIASES })
    );
  });

  return values.filter(({ value }) => hasValue(value));
}

function isDateField(field: string): boolean {
  const lastPart = field.split(".").at(-1) ?? "";
  return DATE_FIELDS.has(field) || DATE_FIELDS.has(lastPart);
}

function hasAlias(text: string, aliases: string[] = []): boolean {
  return aliases.map(normalizeFieldText).some((alias) => alias && text.includes(alias));
}

function isEssayCandidate(candidate: FieldCandidate, text: string): boolean {
  return candidate.tagName === "textarea" && hasAlias(text, ESSAY_ALIASES);
}

function scoreCandidate(text: string, profileValue: ProfileValue): number {
  const { aliases, contextAliases, field } = profileValue;
  if (contextAliases?.length && !hasAlias(text, contextAliases)) {
    return 0;
  }

  if (isDateField(field) && !/\d/.test(text) && !/(일|월|년|date|day|month|year|입학|졸업|취득|수상|입사|퇴사|시작|종료)/.test(text)) {
    return 0;
  }

  const normalizedAliases = aliases.map(normalizeFieldText);

  if (normalizedAliases.some((alias) => text === alias)) {
    return 1;
  }

  if (normalizedAliases.some((alias) => text.split(" ").includes(alias))) {
    return 0.9;
  }

  if (normalizedAliases.some((alias) => text.includes(alias))) {
    return 0.78;
  }

  return 0;
}

export function buildAutofillPlan(
  candidates: FieldCandidate[],
  profile: UserProfile
): AutofillPlan {
  const values = profileValues(profile);
  const matches: FieldMatch[] = [];

  candidates.forEach((candidate) => {
    const text = candidateText(candidate);
    if (isEssayCandidate(candidate, text)) {
      return;
    }

    const best = values
      .map((value) => ({
        value,
          confidence: scoreCandidate(text, value)
      }))
      .filter(({ confidence }) => confidence >= MIN_CONFIDENCE)
      .sort((left, right) => {
        if (right.confidence !== left.confidence) {
          return right.confidence - left.confidence;
        }

        return right.value.priority - left.value.priority;
      })[0];

    if (!best) {
      return;
    }

    const transformedValue = best.value.transform
      ? best.value.transform(best.value.value, candidate, text)
      : best.value.value;

    if (!hasValue(transformedValue)) {
      return;
    }

    matches.push({
      candidateKey: candidate.key,
      profileField: best.value.field,
      label: candidate.label || candidate.placeholder || candidate.name || candidate.id,
      confidence: best.confidence,
      reviewRequired: best.confidence < REVIEW_CONFIDENCE,
      value: transformedValue
    });
  });

  return { matches };
}
