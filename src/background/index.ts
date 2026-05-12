import type { ExtensionMessage, ExtensionResponse } from "../types/messages";

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function injectContentScript(tabId: number) {
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["assets/content.js"]
  });
}

async function sendAutofillMessage(
  tabId: number,
  message: ExtensionMessage
): Promise<ExtensionResponse> {
  try {
    return await chrome.tabs.sendMessage(tabId, message);
  } catch {
    await injectContentScript(tabId);
    return chrome.tabs.sendMessage(tabId, message);
  }
}

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

    void (async () => {
      try {
        const tab = await getActiveTab();

        if (!tab.id) {
          sendResponse({
            ok: false,
            error: "현재 탭에 접근할 수 없습니다. 지원 페이지를 열고 다시 시도하세요."
          });
          return;
        }

        sendResponse(await sendAutofillMessage(tab.id, message));
      } catch {
        sendResponse({
          ok: false,
          error: "현재 탭에 자동 채우기를 실행할 수 없습니다. 페이지를 새로고침한 뒤 다시 시도하세요."
        });
      }
    })();

    return true;
  }
);
