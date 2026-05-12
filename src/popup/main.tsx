import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { AlertTriangle, CheckCircle2, FileText, Loader2, Search, Settings } from "lucide-react";
import { Button } from "../components/Button";
import { getProfile, isProfileEmpty } from "../lib/storage";
import type { AutofillAnalysis, AutofillResult, FieldMatch } from "../types/autofill";
import type { AnalyzeAutofillResponse, RunAutofillResponse } from "../types/messages";
import type { UserProfile } from "../types/profile";
import "../styles.css";

type PopupStatus =
  | "loading-profile"
  | "empty"
  | "ready"
  | "analyzing"
  | "reviewing"
  | "applying"
  | "done"
  | "error";

function openOptions() {
  void chrome.runtime.openOptionsPage();
}

function profileFieldLabel(field: string) {
  const labels: Record<string, string> = {
    "personal.name": "이름",
    "personal.birthDate": "생년월일",
    "personal.email": "이메일",
    "personal.phone": "전화번호",
    "personal.address": "주소",
    schoolName: "학교명",
    major: "전공",
    degree: "학위",
    gpa: "학점",
    name: "이름/명칭",
    acquiredDate: "취득일",
    issuer: "기관",
    title: "활동명",
    startDate: "시작일",
    endDate: "종료일",
    role: "역할",
    techStack: "기술 스택",
    company: "회사명",
    position: "직무/직위",
    awardDate: "수상일",
    description: "내용"
  };

  if (field.startsWith("educations.")) {
    return `학력 ${labels[field.split(".").at(-1) ?? ""] ?? field}`;
  }

  if (field.startsWith("credentials.")) {
    return `자격사항 ${labels[field.split(".").at(-1) ?? ""] ?? field}`;
  }

  if (field.startsWith("extracurricularProjects.")) {
    return `대내외 프로젝트 ${labels[field.split(".").at(-1) ?? ""] ?? field}`;
  }

  if (field.startsWith("workExperiences.")) {
    return `직장경력 ${labels[field.split(".").at(-1) ?? ""] ?? field}`;
  }

  if (field.startsWith("awards.")) {
    return `수상 ${labels[field.split(".").at(-1) ?? ""] ?? field}`;
  }

  return labels[field] ?? field;
}

function PopupApp() {
  const [status, setStatus] = useState<PopupStatus>("loading-profile");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [analysis, setAnalysis] = useState<AutofillAnalysis | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<AutofillResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void getProfile()
      .then((storedProfile) => {
        setProfile(storedProfile);
        setStatus(isProfileEmpty(storedProfile) ? "empty" : "ready");
      })
      .catch(() => {
        setError("프로필을 읽을 수 없습니다. options 페이지에서 다시 저장하세요.");
        setStatus("error");
      });
  }, []);

  async function analyzePage() {
    if (!profile) {
      return;
    }

    setStatus("analyzing");
    setError("");
    setAnalysis(null);
    setResult(null);

    try {
      const response = (await chrome.runtime.sendMessage({
        type: "ANALYZE_AUTOFILL",
        profile
      })) as AnalyzeAutofillResponse;

      if (!response?.ok || !response.analysis) {
        setError(response?.error ?? "페이지를 분석하지 못했습니다. 현재 탭을 확인하세요.");
        setStatus("error");
        return;
      }

      const defaultSelected = new Set(
        response.analysis.plan.matches
          .filter((match) => !match.reviewRequired)
          .map((match) => match.candidateKey)
      );

      setAnalysis(response.analysis);
      setSelectedKeys(defaultSelected);
      setStatus("reviewing");
    } catch {
      setError("현재 탭에 접근할 수 없습니다. 지원 페이지를 새로고침한 뒤 다시 시도하세요.");
      setStatus("error");
    }
  }

  async function applySelected() {
    if (!analysis) {
      return;
    }

    const matches = analysis.plan.matches.filter((match) => selectedKeys.has(match.candidateKey));
    if (matches.length === 0) {
      setError("입력할 항목을 하나 이상 선택하세요.");
      setStatus("error");
      return;
    }

    setStatus("applying");
    setError("");
    setResult(null);

    try {
      const response = (await chrome.runtime.sendMessage({
        type: "APPLY_AUTOFILL",
        plan: { matches },
        candidatesCount: analysis.candidatesCount
      })) as RunAutofillResponse;

      if (!response?.ok || !response.result) {
        setError(response?.error ?? "선택한 항목을 입력하지 못했습니다.");
        setStatus("error");
        return;
      }

      setResult(response.result);
      setStatus("done");
    } catch {
      setError("현재 탭에 접근할 수 없습니다. 지원 페이지를 새로고침한 뒤 다시 시도하세요.");
      setStatus("error");
    }
  }

  function toggleMatch(match: FieldMatch) {
    setSelectedKeys((current) => {
      const next = new Set(current);
      if (next.has(match.candidateKey)) {
        next.delete(match.candidateKey);
      } else {
        next.add(match.candidateKey);
      }
      return next;
    });
  }

  const isBusy = status === "analyzing" || status === "applying";
  const selectedCount = selectedKeys.size;

  return (
    <main className="w-[360px] bg-[#f7f8f5] p-4 text-[#18201a]">
      <header className="mb-4">
        <div className="flex items-center gap-2">
          <FileText aria-hidden="true" className="h-5 w-5 text-[#2f7d4f]" />
          <h1 className="text-base font-semibold">ApplyMate</h1>
        </div>
        <p className="mt-2 text-xs leading-5 text-[#69736a]">
          프로필은 이 브라우저에만 저장됩니다.
        </p>
      </header>

      <section className="rounded-md border border-[#d8ded2] bg-white p-4">
        {status === "empty" ? (
          <>
            <p className="text-sm font-medium text-[#374239]">
              프로필을 먼저 입력해야 자동 채우기를 사용할 수 있습니다.
            </p>
            <Button className="mt-4 w-full" onClick={openOptions}>
              <Settings aria-hidden="true" className="h-4 w-4" />
              프로필 입력하기
            </Button>
          </>
        ) : (
          <>
            <Button className="w-full" disabled={isBusy || status === "loading-profile"} onClick={analyzePage}>
              {status === "analyzing" ? (
                <Loader2 aria-hidden="true" className="h-4 w-4" />
              ) : (
                <Search aria-hidden="true" className="h-4 w-4" />
              )}
              {status === "analyzing" ? "분석 중" : "현재 페이지 분석"}
            </Button>
            <Button className="mt-2 w-full" variant="secondary" onClick={openOptions}>
              <Settings aria-hidden="true" className="h-4 w-4" />
              프로필 수정
            </Button>
          </>
        )}

        {analysis && status !== "empty" ? (
          <div className="mt-4 rounded-md border border-[#d8ded2] bg-[#f8faf6] p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-[#18201a]">
                추천 매핑 {analysis.plan.matches.length}개
              </p>
              <p className="text-xs text-[#69736a]">{selectedCount}개 선택</p>
            </div>
            {analysis.plan.matches.length > 0 ? (
              <>
                <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
                  {analysis.plan.matches.map((match) => (
                    <li className="rounded-md border border-[#d8ded2] bg-white p-2" key={match.candidateKey}>
                      <label className="flex items-start gap-2 text-xs text-[#374239]">
                        <input
                          className="mt-1 h-4 w-4 accent-[#2f7d4f]"
                          type="checkbox"
                          checked={selectedKeys.has(match.candidateKey)}
                          onChange={() => toggleMatch(match)}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold text-[#18201a]">
                            {match.label || match.candidateKey}
                          </span>
                          <span className="mt-1 block truncate">
                            {profileFieldLabel(match.profileField)}
                          </span>
                          <span className="mt-1 block truncate text-[#69736a]">
                            {match.value}
                          </span>
                          {match.reviewRequired ? (
                            <span className="mt-1 inline-block rounded-sm bg-[#fff3cd] px-1.5 py-0.5 text-[11px] text-[#8a5a00]">
                              확인 필요
                            </span>
                          ) : null}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
                <Button className="mt-3 w-full" disabled={isBusy || selectedCount === 0} onClick={applySelected}>
                  {status === "applying" ? (
                    <Loader2 aria-hidden="true" className="h-4 w-4" />
                  ) : (
                    <FileText aria-hidden="true" className="h-4 w-4" />
                  )}
                  {status === "applying" ? "입력 중" : "선택 항목 입력"}
                </Button>
              </>
            ) : (
              <p className="mt-3 text-xs leading-5 text-[#69736a]">
                추천할 수 있는 텍스트 입력칸을 찾지 못했습니다.
              </p>
            )}
          </div>
        ) : null}

        {result ? (
          <div className="mt-4 rounded-md border border-[#d8ded2] bg-[#eef2e8] p-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-[#18201a]">
              <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-[#2f7d4f]" />
              {result.message}
            </p>
            <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <dt className="text-[#69736a]">채움</dt>
                <dd className="text-base font-semibold">{result.filledCount}</dd>
              </div>
              <div>
                <dt className="text-[#69736a]">스킵</dt>
                <dd className="text-base font-semibold">{result.skippedCount}</dd>
              </div>
              <div>
                <dt className="text-[#69736a]">실패</dt>
                <dd className="text-base font-semibold">{result.failedCount}</dd>
              </div>
            </dl>
            {result.matches.length > 0 ? (
              <ul className="mt-3 space-y-1 text-xs text-[#374239]">
                {result.matches.map((match) => (
                  <li className="truncate" key={`${match.candidateKey}-${match.profileField}`}>
                    {match.label || match.candidateKey} {"->"} {match.profileField}
                  </li>
                ))}
              </ul>
            ) : null}
            <p className="mt-3 text-xs leading-5 text-[#69736a]">
              제출 전 입력 내용을 직접 확인하세요.
            </p>
          </div>
        ) : null}

        {status === "error" ? (
          <div className="mt-4 rounded-md border border-[#b42318] bg-white p-3 text-sm text-[#b42318]">
            <p className="flex items-start gap-2">
              <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </p>
          </div>
        ) : null}
      </section>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PopupApp />
  </React.StrictMode>
);
