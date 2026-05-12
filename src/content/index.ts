import { buildAutofillPlan } from "../lib/fieldMatcher";
import {
  applyAutofillPlan,
  collectFieldCandidates,
  createAutofillResult
} from "../lib/domCandidates";
import type { ExtensionMessage, ExtensionResponse } from "../types/messages";

chrome.runtime.onMessage.addListener(
  (
    message: ExtensionMessage,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: ExtensionResponse) => void
  ) => {
    if (
      message.type !== "ANALYZE_AUTOFILL" &&
      message.type !== "APPLY_AUTOFILL" &&
      message.type !== "RUN_AUTOFILL"
    ) {
      return false;
    }

    try {
      if (message.type === "ANALYZE_AUTOFILL") {
        const candidates = collectFieldCandidates();
        const plan = buildAutofillPlan(candidates, message.profile);

        sendResponse({
          ok: true,
          analysis: {
            candidatesCount: candidates.length,
            plan
          }
        });
        return true;
      }

      if (message.type === "APPLY_AUTOFILL") {
        const { filled, failed } = applyAutofillPlan(message.plan);

        sendResponse({
          ok: true,
          result: createAutofillResult([], message.plan, filled, failed, message.candidatesCount)
        });
        return true;
      }

      const candidates = collectFieldCandidates();
      const plan = buildAutofillPlan(candidates, message.profile);
      const { filled, failed } = applyAutofillPlan(plan);

      sendResponse({
        ok: true,
        result: createAutofillResult(candidates, plan, filled, failed)
      });
    } catch {
      sendResponse({
        ok: false,
        error: "현재 페이지를 스캔할 수 없습니다. 페이지를 새로고침한 뒤 다시 시도하세요."
      });
    }

    return true;
  }
);
