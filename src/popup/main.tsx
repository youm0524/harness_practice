import React from "react";
import ReactDOM from "react-dom/client";
import { FileText, Settings } from "lucide-react";
import { Button } from "../components/Button";
import { formatLocalStorageNotice } from "../lib/appInfo";
import "../styles.css";

function PopupApp() {
  return (
    <main className="w-[360px] bg-[#f7f8f5] p-4 text-[#18201a]">
      <header className="mb-4">
        <div className="flex items-center gap-2">
          <FileText aria-hidden="true" className="h-5 w-5 text-[#2f7d4f]" />
          <h1 className="text-base font-semibold">ApplyMate</h1>
        </div>
        <p className="mt-2 text-xs leading-5 text-[#69736a]">
          {formatLocalStorageNotice()}
        </p>
      </header>

      <section className="rounded-md border border-[#d8ded2] bg-white p-4">
        <p className="text-sm font-medium text-[#374239]">
          프로필을 입력하면 현재 지원 페이지 채우기를 시작할 수 있습니다.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <Button className="w-full">
            <FileText aria-hidden="true" className="h-4 w-4" />
            현재 페이지 채우기
          </Button>
          <Button className="w-full" variant="secondary">
            <Settings aria-hidden="true" className="h-4 w-4" />
            프로필 입력하기
          </Button>
        </div>
      </section>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PopupApp />
  </React.StrictMode>
);
