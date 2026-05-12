import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { AlertTriangle, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { Button } from "../components/Button";
import {
  clearProfile,
  createEmptyProfile,
  getProfile,
  saveProfile,
} from "../lib/storage";
import type {
  ActivityProject,
  Award,
  Credential,
  Education,
  LanguageScore,
  UserProfile,
  WorkExperience,
} from "../types/profile";
import "../styles.css";

type Status = { type: "idle" | "success" | "error"; message: string };

const inputClass =
  "rounded-md border border-[#c8d0c2] bg-white px-3 py-2 text-sm text-[#18201a] focus:border-[#2f7d4f] focus:outline-none focus:ring-2 focus:ring-[#dcebdd]";

function formatSavedAt(value: string | null) {
  return value ? new Date(value).toLocaleString("ko-KR") : "아직 저장되지 않음";
}

function TextField({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  const id = label.replace(/\s+/g, "-");
  return (
    <label
      className="flex flex-col gap-1 text-sm font-medium text-[#374239]"
      htmlFor={id}
    >
      {label}
      {multiline ? (
        <textarea
          className={`${inputClass} min-h-24 resize-y`}
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          className={inputClass}
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </label>
  );
}

function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-[#d8ded2] bg-white p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-[#18201a]">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function OptionsApp() {
  const [profile, setProfile] = useState<UserProfile>(createEmptyProfile);
  const [status, setStatus] = useState<Status>({ type: "idle", message: "" });
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    void getProfile().then(setProfile);
  }, []);

  function updatePersonal(field: keyof UserProfile["personal"], value: string) {
    setProfile((current) => ({
      ...current,
      personal: { ...current.personal, [field]: value },
    }));
  }

  function updateList<
    T extends
      | Education
      | Credential
      | LanguageScore
      | ActivityProject
      | WorkExperience
      | Award,
  >(
    key:
      | "educations"
      | "credentials"
      | "languageScores"
      | "extracurricularProjects"
      | "workExperiences"
      | "awards",
    index: number,
    field: keyof T,
    value: string,
  ) {
    setProfile((current) => ({
      ...current,
      [key]: current[key].map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
  }

  async function handleSave() {
    try {
      await saveProfile(profile);
      const saved = await getProfile();
      setProfile(saved);
      setStatus({ type: "success", message: "프로필을 저장했습니다." });
    } catch {
      setStatus({
        type: "error",
        message: "저장하지 못했습니다. 잠시 뒤 다시 시도하세요.",
      });
    }
  }

  async function handleClear() {
    try {
      await clearProfile();
      setProfile(createEmptyProfile());
      setConfirmReset(false);
      setStatus({ type: "success", message: "로컬 프로필을 초기화했습니다." });
    } catch {
      setStatus({
        type: "error",
        message: "초기화하지 못했습니다. 다시 시도하세요.",
      });
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8f5] px-6 py-8 text-[#18201a]">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">ApplyMate 프로필</h1>
            <p className="mt-2 text-sm leading-6 text-[#69736a]">
              마지막 저장: {formatSavedAt(profile.updatedAt)}
            </p>
            {status.message ? (
              <p
                className={`mt-2 text-sm ${status.type === "error" ? "text-[#b42318]" : "text-[#2f7d4f]"}`}
              >
                {status.message}
              </p>
            ) : null}
          </div>
          <Button onClick={handleSave}>
            <Save aria-hidden="true" className="h-4 w-4" />
            프로필 저장
          </Button>
        </header>

        <Section title="인적사항">
          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              label="이름"
              value={profile.personal.name}
              onChange={(value) => updatePersonal("name", value)}
            />
            <TextField
              label="생년월일"
              value={profile.personal.birthDate}
              onChange={(value) => updatePersonal("birthDate", value)}
            />
            <TextField
              label="이메일"
              value={profile.personal.email}
              onChange={(value) => updatePersonal("email", value)}
            />
            <TextField
              label="전화번호"
              value={profile.personal.phone}
              onChange={(value) => updatePersonal("phone", value)}
            />
            <div className="md:col-span-2">
              <TextField
                label="주소"
                value={profile.personal.address}
                onChange={(value) => updatePersonal("address", value)}
              />
            </div>
          </div>
        </Section>

        <Section
          title="학력"
          action={
            <Button
              variant="secondary"
              onClick={() =>
                setProfile((current) => ({
                  ...current,
                  educations: [
                    ...current.educations,
                    {
                      schoolName: "",
                      major: "",
                      degree: "",
                      startDate: "",
                      endDate: "",
                      gpa: "",
                    },
                  ],
                }))
              }
            >
              <Plus aria-hidden="true" className="h-4 w-4" />
              항목 추가
            </Button>
          }
        >
          <div className="space-y-5">
            {profile.educations.map((education, index) => (
              <div
                className="border-t border-[#d8ded2] pt-4 first:border-t-0 first:pt-0"
                key={index}
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold">
                    {education.schoolName || "새 학력"}
                  </p>
                  <Button
                    aria-label="학력 삭제"
                    variant="text"
                    onClick={() =>
                      setProfile((current) => ({
                        ...current,
                        educations: current.educations.filter(
                          (_, itemIndex) => itemIndex !== index,
                        ),
                      }))
                    }
                  >
                    <Trash2 aria-hidden="true" className="h-4 w-4" />
                    삭제
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <TextField
                    label={`학교명 ${index + 1}`}
                    value={education.schoolName}
                    onChange={(value) =>
                      updateList<Education>(
                        "educations",
                        index,
                        "schoolName",
                        value,
                      )
                    }
                  />
                  <TextField
                    label={`전공 ${index + 1}`}
                    value={education.major}
                    onChange={(value) =>
                      updateList<Education>("educations", index, "major", value)
                    }
                  />
                  <TextField
                    label={`학위 ${index + 1}`}
                    value={education.degree}
                    onChange={(value) =>
                      updateList<Education>(
                        "educations",
                        index,
                        "degree",
                        value,
                      )
                    }
                  />
                  <TextField
                    label={`입학일 ${index + 1}`}
                    value={education.startDate}
                    onChange={(value) =>
                      updateList<Education>(
                        "educations",
                        index,
                        "startDate",
                        value,
                      )
                    }
                  />
                  <TextField
                    label={`졸업일 ${index + 1}`}
                    value={education.endDate}
                    onChange={(value) =>
                      updateList<Education>(
                        "educations",
                        index,
                        "endDate",
                        value,
                      )
                    }
                  />
                  <TextField
                    label={`학점 ${index + 1}`}
                    value={education.gpa}
                    onChange={(value) =>
                      updateList<Education>("educations", index, "gpa", value)
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="자격사항"
          action={
            <Button
              variant="secondary"
              onClick={() =>
                setProfile((current) => ({
                  ...current,
                  credentials: [
                    ...current.credentials,
                    { name: "", acquiredDate: "", issuer: "" },
                  ],
                }))
              }
            >
              <Plus aria-hidden="true" className="h-4 w-4" />
              항목 추가
            </Button>
          }
        >
          <div className="space-y-5">
            {profile.credentials.map((credential, index) => (
              <div
                className="border-t border-[#d8ded2] pt-4 first:border-t-0 first:pt-0"
                key={index}
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold">
                    {credential.name || "새 자격사항"}
                  </p>
                  <Button
                    aria-label="자격사항 삭제"
                    variant="text"
                    onClick={() =>
                      setProfile((current) => ({
                        ...current,
                        credentials: current.credentials.filter(
                          (_, itemIndex) => itemIndex !== index,
                        ),
                      }))
                    }
                  >
                    <Trash2 aria-hidden="true" className="h-4 w-4" />
                    삭제
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <TextField
                    label={`자격증명 ${index + 1}`}
                    value={credential.name}
                    onChange={(value) =>
                      updateList<Credential>(
                        "credentials",
                        index,
                        "name",
                        value,
                      )
                    }
                  />
                  <TextField
                    label={`취득일 ${index + 1}`}
                    value={credential.acquiredDate}
                    onChange={(value) =>
                      updateList<Credential>(
                        "credentials",
                        index,
                        "acquiredDate",
                        value,
                      )
                    }
                  />
                  <TextField
                    label={`발급처 ${index + 1}`}
                    value={credential.issuer}
                    onChange={(value) =>
                      updateList<Credential>(
                        "credentials",
                        index,
                        "issuer",
                        value,
                      )
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="어학"
          action={
            <Button
              variant="secondary"
              onClick={() =>
                setProfile((current) => ({
                  ...current,
                  languageScores: [
                    ...current.languageScores,
                    { language: "", testName: "", score: "", acquiredDate: "" },
                  ],
                }))
              }
            >
              <Plus aria-hidden="true" className="h-4 w-4" />
              항목 추가
            </Button>
          }
        >
          <div className="space-y-5">
            {profile.languageScores.map((languageScore, index) => (
              <div
                className="border-t border-[#d8ded2] pt-4 first:border-t-0 first:pt-0"
                key={index}
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold">
                    {languageScore.testName || "새 어학"}
                  </p>
                  <Button
                    aria-label="어학 삭제"
                    variant="text"
                    onClick={() =>
                      setProfile((current) => ({
                        ...current,
                        languageScores: current.languageScores.filter(
                          (_, itemIndex) => itemIndex !== index,
                        ),
                      }))
                    }
                  >
                    <Trash2 aria-hidden="true" className="h-4 w-4" />
                    삭제
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-4">
                  <TextField
                    label={`언어 ${index + 1}`}
                    value={languageScore.language}
                    onChange={(value) =>
                      updateList<LanguageScore>(
                        "languageScores",
                        index,
                        "language",
                        value,
                      )
                    }
                  />
                  <TextField
                    label={`시험명 ${index + 1}`}
                    value={languageScore.testName}
                    onChange={(value) =>
                      updateList<LanguageScore>(
                        "languageScores",
                        index,
                        "testName",
                        value,
                      )
                    }
                  />
                  <TextField
                    label={`점수/등급 ${index + 1}`}
                    value={languageScore.score}
                    onChange={(value) =>
                      updateList<LanguageScore>(
                        "languageScores",
                        index,
                        "score",
                        value,
                      )
                    }
                  />
                  <TextField
                    label={`취득일 ${index + 1}`}
                    value={languageScore.acquiredDate}
                    onChange={(value) =>
                      updateList<LanguageScore>(
                        "languageScores",
                        index,
                        "acquiredDate",
                        value,
                      )
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="대내외 프로젝트"
          action={
            <Button
              variant="secondary"
              onClick={() =>
                setProfile((current) => ({
                  ...current,
                  extracurricularProjects: [
                    ...current.extracurricularProjects,
                    {
                      title: "",
                      organization: "",
                      startDate: "",
                      endDate: "",
                      role: "",
                      description: "",
                      techStack: "",
                    },
                  ],
                }))
              }
            >
              <Plus aria-hidden="true" className="h-4 w-4" />
              항목 추가
            </Button>
          }
        >
          <div className="space-y-5">
            {profile.extracurricularProjects.map((project, index) => (
              <div
                className="border-t border-[#d8ded2] pt-4 first:border-t-0 first:pt-0"
                key={index}
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold">
                    {project.title || "새 대내외 프로젝트"}
                  </p>
                  <Button
                    aria-label="대내외 프로젝트 삭제"
                    variant="text"
                    onClick={() =>
                      setProfile((current) => ({
                        ...current,
                        extracurricularProjects:
                          current.extracurricularProjects.filter(
                            (_, itemIndex) => itemIndex !== index,
                          ),
                      }))
                    }
                  >
                    <Trash2 aria-hidden="true" className="h-4 w-4" />
                    삭제
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField
                    label={`프로젝트명 ${index + 1}`}
                    value={project.title}
                    onChange={(value) =>
                      updateList<ActivityProject>(
                        "extracurricularProjects",
                        index,
                        "title",
                        value,
                      )
                    }
                  />
                  <TextField
                    label={`활동기관 ${index + 1}`}
                    value={project.organization}
                    onChange={(value) =>
                      updateList<ActivityProject>(
                        "extracurricularProjects",
                        index,
                        "organization",
                        value,
                      )
                    }
                  />
                  <TextField
                    label={`역할 ${index + 1}`}
                    value={project.role}
                    onChange={(value) =>
                      updateList<ActivityProject>(
                        "extracurricularProjects",
                        index,
                        "role",
                        value,
                      )
                    }
                  />
                  <TextField
                    label={`시작일 ${index + 1}`}
                    value={project.startDate}
                    onChange={(value) =>
                      updateList<ActivityProject>(
                        "extracurricularProjects",
                        index,
                        "startDate",
                        value,
                      )
                    }
                  />
                  <TextField
                    label={`종료일 ${index + 1}`}
                    value={project.endDate}
                    onChange={(value) =>
                      updateList<ActivityProject>(
                        "extracurricularProjects",
                        index,
                        "endDate",
                        value,
                      )
                    }
                  />
                  <TextField
                    label={`기술 스택 ${index + 1}`}
                    value={project.techStack}
                    onChange={(value) =>
                      updateList<ActivityProject>(
                        "extracurricularProjects",
                        index,
                        "techStack",
                        value,
                      )
                    }
                  />
                  <TextField
                    label={`프로젝트 내용 ${index + 1}`}
                    value={project.description}
                    onChange={(value) =>
                      updateList<ActivityProject>(
                        "extracurricularProjects",
                        index,
                        "description",
                        value,
                      )
                    }
                    multiline
                  />
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="직장경력"
          action={
            <Button
              variant="secondary"
              onClick={() =>
                setProfile((current) => ({
                  ...current,
                  workExperiences: [
                    ...current.workExperiences,
                    {
                      company: "",
                      position: "",
                      startDate: "",
                      endDate: "",
                      description: "",
                    },
                  ],
                }))
              }
            >
              <Plus aria-hidden="true" className="h-4 w-4" />
              항목 추가
            </Button>
          }
        >
          <div className="space-y-5">
            {profile.workExperiences.map((experience, index) => (
              <div
                className="border-t border-[#d8ded2] pt-4 first:border-t-0 first:pt-0"
                key={index}
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold">
                    {experience.company || "새 직장경력"}
                  </p>
                  <Button
                    aria-label="직장경력 삭제"
                    variant="text"
                    onClick={() =>
                      setProfile((current) => ({
                        ...current,
                        workExperiences: current.workExperiences.filter(
                          (_, itemIndex) => itemIndex !== index,
                        ),
                      }))
                    }
                  >
                    <Trash2 aria-hidden="true" className="h-4 w-4" />
                    삭제
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField
                    label={`회사명 ${index + 1}`}
                    value={experience.company}
                    onChange={(value) =>
                      updateList<WorkExperience>(
                        "workExperiences",
                        index,
                        "company",
                        value,
                      )
                    }
                  />
                  <TextField
                    label={`직무/직위 ${index + 1}`}
                    value={experience.position}
                    onChange={(value) =>
                      updateList<WorkExperience>(
                        "workExperiences",
                        index,
                        "position",
                        value,
                      )
                    }
                  />
                  <TextField
                    label={`입사일 ${index + 1}`}
                    value={experience.startDate}
                    onChange={(value) =>
                      updateList<WorkExperience>(
                        "workExperiences",
                        index,
                        "startDate",
                        value,
                      )
                    }
                  />
                  <TextField
                    label={`퇴사일 ${index + 1}`}
                    value={experience.endDate}
                    onChange={(value) =>
                      updateList<WorkExperience>(
                        "workExperiences",
                        index,
                        "endDate",
                        value,
                      )
                    }
                  />
                  <div className="md:col-span-2">
                    <TextField
                      label={`업무 내용 ${index + 1}`}
                      value={experience.description}
                      onChange={(value) =>
                        updateList<WorkExperience>(
                          "workExperiences",
                          index,
                          "description",
                          value,
                        )
                      }
                      multiline
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="수상 항목"
          action={
            <Button
              variant="secondary"
              onClick={() =>
                setProfile((current) => ({
                  ...current,
                  awards: [
                    ...current.awards,
                    { name: "", awardDate: "", issuer: "", description: "" },
                  ],
                }))
              }
            >
              <Plus aria-hidden="true" className="h-4 w-4" />
              항목 추가
            </Button>
          }
        >
          <div className="space-y-5">
            {profile.awards.map((award, index) => (
              <div
                className="border-t border-[#d8ded2] pt-4 first:border-t-0 first:pt-0"
                key={index}
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold">
                    {award.name || "새 수상 항목"}
                  </p>
                  <Button
                    aria-label="수상 항목 삭제"
                    variant="text"
                    onClick={() =>
                      setProfile((current) => ({
                        ...current,
                        awards: current.awards.filter(
                          (_, itemIndex) => itemIndex !== index,
                        ),
                      }))
                    }
                  >
                    <Trash2 aria-hidden="true" className="h-4 w-4" />
                    삭제
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField
                    label={`수상명 ${index + 1}`}
                    value={award.name}
                    onChange={(value) =>
                      updateList<Award>("awards", index, "name", value)
                    }
                  />
                  <TextField
                    label={`수상일 ${index + 1}`}
                    value={award.awardDate}
                    onChange={(value) =>
                      updateList<Award>("awards", index, "awardDate", value)
                    }
                  />
                  <TextField
                    label={`수여기관 ${index + 1}`}
                    value={award.issuer}
                    onChange={(value) =>
                      updateList<Award>("awards", index, "issuer", value)
                    }
                  />
                  <TextField
                    label={`수상 내용 ${index + 1}`}
                    value={award.description}
                    onChange={(value) =>
                      updateList<Award>("awards", index, "description", value)
                    }
                    multiline
                  />
                </div>
              </div>
            ))}
          </div>
        </Section>

        <section className="rounded-md border border-[#b42318] bg-white p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-base font-semibold text-[#b42318]">
                <AlertTriangle aria-hidden="true" className="h-4 w-4" />
                로컬 데이터 초기화
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#69736a]">
                이 브라우저에 저장된 프로필만 삭제됩니다.
              </p>
            </div>
            {confirmReset ? (
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setConfirmReset(false)}
                >
                  취소
                </Button>
                <Button onClick={handleClear}>
                  <RotateCcw aria-hidden="true" className="h-4 w-4" />
                  초기화 확인
                </Button>
              </div>
            ) : (
              <Button variant="secondary" onClick={() => setConfirmReset(true)}>
                <RotateCcw aria-hidden="true" className="h-4 w-4" />
                전체 초기화
              </Button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <OptionsApp />
  </React.StrictMode>,
);
