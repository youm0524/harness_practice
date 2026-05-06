# Step 2: field-matching

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/docs/PRD.md`
- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`
- `/AGENT.md`
- `/src/types/profile.ts`
- `/src/lib/storage.ts`
- `/phases/0-mvp/index.json`

이전 step에서 만들어진 프로필 모델과 storage helper를 꼼꼼히 읽고, 설계 의도를 이해한 뒤 작업하라.

## 작업

DOM과 분리된 규칙 기반 필드 매칭 순수 로직을 구현한다.

필수 생성/수정 범위:

- `src/types/autofill.ts`
- `src/lib/fieldMatcher.ts`
- `src/lib/fieldMatcher.test.ts`

필수 타입/함수 시그니처:

```ts
export interface FieldCandidate
export interface FieldMatch
export interface AutofillPlan

export function normalizeFieldText(value: string): string
export function buildAutofillPlan(
  candidates: FieldCandidate[],
  profile: UserProfile,
): AutofillPlan
```

핵심 규칙:

- `FieldCandidate`는 DOM 요소 자체가 아니라 `id`, `name`, `type`, `label`, `placeholder`, `ariaLabel`, `nearbyText`, `tagName` 같은 문자열 메타데이터와 안정적인 selector/key만 담는다.
- `buildAutofillPlan`은 DOM API를 호출하지 않는 순수 함수여야 한다.
- 한국어와 영어 alias를 모두 지원한다. 예: 이름/성명/name, 이메일/email, 전화번호/phone/mobile, 학교/school/university, 자격증/certificate/license, 프로젝트/project.
- 확신도가 낮은 항목은 채우지 않는다. 무리하게 추측하지 않는다.
- 한 프로필 필드가 여러 candidate와 매칭될 수 있지만, 같은 DOM candidate에는 하나의 값만 배정한다.
- 빈 값은 plan에 포함하지 않는다.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm run test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트를 확인한다:
   - 매칭 로직이 `src/lib/fieldMatcher.ts`에 있고 DOM과 분리되어 있는가?
   - 한국어/영어 alias 테스트가 포함되어 있는가?
   - 낮은 확신도 필드를 채우지 않는 테스트가 있는가?
3. 결과에 따라 `phases/0-mvp/index.json`의 해당 step을 업데이트한다:
   - 성공 -> `"status": "completed"`, `"summary": "DOM 비의존 규칙 기반 fieldMatcher와 AutofillPlan 테스트 구현"`
   - 수정 3회 시도 후에도 실패 -> `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 -> `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- content script DOM 스캔을 구현하지 마라. 이유: 이 step은 순수 매칭 로직만 담당한다.
- AI/LLM API를 호출하지 마라. 이유: MVP는 개인정보를 외부로 보내지 않는다.
- 기존 테스트를 깨뜨리지 마라.
