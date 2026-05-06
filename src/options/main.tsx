import React from "react";
import ReactDOM from "react-dom/client";
import { Save } from "lucide-react";
import { Button } from "../components/Button";
import { formatLocalStorageNotice } from "../lib/appInfo";
import "../styles.css";

function OptionsApp() {
  return (
    <main className="min-h-screen bg-[#f7f8f5] px-6 py-8 text-[#18201a]">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">ApplyMate 프로필</h1>
            <p className="mt-2 text-sm leading-6 text-[#69736a]">
              {formatLocalStorageNotice()}
            </p>
          </div>
          <Button>
            <Save aria-hidden="true" className="h-4 w-4" />
            프로필 저장
          </Button>
        </header>

        <section className="rounded-md border border-[#d8ded2] bg-white p-4">
          <h2 className="text-base font-semibold">인적사항</h2>
          <p className="mt-2 text-sm leading-6 text-[#374239]">
            이름, 이메일, 전화번호부터 입력할 수 있는 프로필 화면이 이곳에
            구성됩니다.
          </p>
        </section>
      </div>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <OptionsApp />
  </React.StrictMode>
);
