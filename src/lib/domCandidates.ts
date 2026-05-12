import type { AutofillPlan, AutofillResult, FieldCandidate, FieldMatch } from "../types/autofill";

const BLOCKED_INPUT_TYPES = new Set([
  "button",
  "checkbox",
  "color",
  "file",
  "hidden",
  "image",
  "password",
  "radio",
  "range",
  "reset",
  "submit"
]);

type FillableElement = HTMLInputElement | HTMLTextAreaElement;

function isFillableTag(element: Element): element is FillableElement {
  return element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement;
}

export function isFillableElement(element: Element): element is FillableElement {
  if (!isFillableTag(element)) {
    return false;
  }

  if (element.disabled || element.hidden) {
    return false;
  }

  if (element.readOnly) {
    return false;
  }

  if (element instanceof HTMLInputElement && BLOCKED_INPUT_TYPES.has(element.type)) {
    return false;
  }

  return true;
}

export function isFillableCandidate(candidate: FieldCandidate): boolean {
  if (candidate.disabled || candidate.readonly || candidate.hidden) {
    return false;
  }

  return !BLOCKED_INPUT_TYPES.has(candidate.type.toLowerCase());
}

function getElementLabel(element: FillableElement): string {
  const id = element.id;
  if (id) {
    const label = document.querySelector<HTMLLabelElement>(`label[for="${CSS.escape(id)}"]`);
    if (label?.innerText) {
      return label.innerText.trim();
    }
  }

  const closestLabel = element.closest("label");
  return closestLabel?.textContent?.trim() ?? "";
}

function getNearbyText(element: FillableElement): string {
  const wrapper = element.closest("div, li, p, section, fieldset");
  return wrapper?.textContent?.replace(/\s+/g, " ").trim().slice(0, 160) ?? "";
}

function getSectionText(element: FillableElement): string {
  const section = element.closest("section, fieldset, article, form, table, ul, ol");
  const sectionHeading = section?.querySelector("legend, h1, h2, h3, h4, h5, h6")?.textContent;

  if (sectionHeading?.trim()) {
    return sectionHeading.trim();
  }

  let current: Element | null = element;
  while (current?.parentElement) {
    let sibling = current.previousElementSibling;
    while (sibling) {
      if (/^(LEGEND|H1|H2|H3|H4|H5|H6|STRONG|B|P|DIV)$/.test(sibling.tagName)) {
        const text = sibling.textContent?.replace(/\s+/g, " ").trim();
        if (text && text.length <= 80) {
          return text;
        }
      }
      sibling = sibling.previousElementSibling;
    }

    current = current.parentElement;
  }

  return "";
}

export function collectFieldCandidates(root: ParentNode = document): FieldCandidate[] {
  return Array.from(root.querySelectorAll("input, textarea"))
    .filter(isFillableElement)
    .map((element, index) => {
      const key = element.id ? `#${CSS.escape(element.id)}` : `[data-applymate-key="${index}"]`;

      if (!element.id) {
        element.setAttribute("data-applymate-key", String(index));
      }

      return {
        key,
        tagName: element.tagName.toLowerCase(),
        type: element instanceof HTMLInputElement ? element.type : element.tagName.toLowerCase(),
        id: element.id,
        name: element.getAttribute("name") ?? "",
        label: getElementLabel(element),
        placeholder: element.getAttribute("placeholder") ?? "",
        ariaLabel: element.getAttribute("aria-label") ?? "",
        nearbyText: getNearbyText(element),
        sectionText: getSectionText(element),
        autocomplete: element.getAttribute("autocomplete") ?? "",
        inputMode: element instanceof HTMLInputElement ? element.inputMode : "",
        maxLength: element.maxLength,
        disabled: element.disabled,
        readonly: element.readOnly,
        hidden: element.hidden
      };
    });
}

function findElementByKey(key: string): FillableElement | null {
  const element = document.querySelector(key);
  return element && isFillableElement(element) ? element : null;
}

function setNativeValue(element: FillableElement, value: string) {
  element.value = value;
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

export function applyAutofillPlan(plan: AutofillPlan): {
  filled: FieldMatch[];
  failed: FieldMatch[];
} {
  const filled: FieldMatch[] = [];
  const failed: FieldMatch[] = [];

  plan.matches.forEach((match) => {
    try {
      const element = findElementByKey(match.candidateKey);
      if (!element) {
        failed.push(match);
        return;
      }

      setNativeValue(element, match.value);
      filled.push(match);
    } catch {
      failed.push(match);
    }
  });

  return { filled, failed };
}

export function createAutofillResult(
  candidates: FieldCandidate[],
  plan: AutofillPlan,
  filled: FieldMatch[],
  failed: FieldMatch[],
  knownCandidatesCount = candidates.length
): AutofillResult {
  const skippedCount = Math.max(knownCandidatesCount - filled.length - failed.length, 0);
  const status =
    filled.length === 0
      ? "no-match"
      : skippedCount > 0 || failed.length > 0 || filled.length < plan.matches.length
        ? "partial"
        : "success";

  const message =
    status === "success"
      ? `${filled.length}개 필드를 채웠습니다. 제출 전 내용을 확인하세요.`
      : status === "partial"
        ? `${filled.length}개 필드를 채웠고 ${skippedCount + failed.length}개는 건너뛰었습니다. 제출 전 내용을 확인하세요.`
        : "채울 수 있는 필드를 찾지 못했습니다. 프로필과 현재 페이지를 확인하세요.";

  return {
    status,
    filledCount: filled.length,
    skippedCount,
    failedCount: failed.length,
    matches: filled.slice(0, 5).map(({ candidateKey, profileField, label }) => ({
      candidateKey,
      profileField,
      label
    })),
    message
  };
}
